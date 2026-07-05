import Link from 'next/link'
import { ArrowLeft, Plus, RefreshCw, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stat } from '@/components/ui/stat'
import { Badge } from '@/components/ui/badge'
import { MtdQuarterPicker } from '@/components/mtd-quarter-picker'
import {
  EXPENSE_LABEL,
  INCOME_LABEL,
  type MtdTransaction,
  quarterById,
  quarterFor,
  recentQuarters,
  summariseQuarter,
} from '@/lib/mtd'
import { formatGBP } from '@/lib/rent'
import type { Property } from '@/lib/types'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function PropertyMtdPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { q?: string }
}) {
  const supabase = createClient()
  const { data: property } = await supabase
    .from('properties').select('*').eq('id', params.id).maybeSingle()
  if (!property) return null
  const p = property as Property

  const quarters = recentQuarters(8)
  const quarter = (searchParams.q ? quarterById(searchParams.q) : null) ?? quarterFor(new Date())

  const startStr = format(quarter.start, 'yyyy-MM-dd')
  const endStr   = format(quarter.end, 'yyyy-MM-dd')

  // Pull ALL transactions for this property in the chosen quarter
  const { data: txs = [] } = await supabase
    .from('mtd_transactions')
    .select('*')
    .eq('property_id', params.id)
    .gte('transaction_date', startStr)
    .lte('transaction_date', endStr)
    .order('transaction_date', { ascending: false })

  // Also pull all recurring templates for this property (regardless of quarter)
  // so Blake can see and manage what's set to auto-repeat.
  const { data: recurring = [] } = await supabase
    .from('mtd_transactions')
    .select('*')
    .eq('property_id', params.id)
    .eq('is_recurring', true)
    .order('transaction_date', { ascending: false })

  const rows = ((txs ?? []) as MtdTransaction[])
  const recurringRows = ((recurring ?? []) as MtdTransaction[])
  const ownership = ((p as any).ownership_type ?? 'personal') as 'personal' | 'limited_company'
  const summary = summariseQuarter(params.id, rows, quarter, ownership)

  return (
    <>
      <PageHeader
        title={`${p.nickname} — MTD`}
        subtitle={`${quarter.shortLabel} (${format(quarter.start, 'd MMM yyyy')} to ${format(quarter.end, 'd MMM yyyy')})`}
        actions={
          <>
            <Link href={`/properties/${p.id}`}><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>
            <MtdQuarterPicker quarters={quarters} selected={quarter.id} />
            <Link href={`/mtd/new?property_id=${p.id}`}>
              <Button><Plus className="h-4 w-4" />Log transaction</Button>
            </Link>
          </>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPIs for this property this quarter */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Income (Box 20)" value={formatGBP(summary.totalIncome)} tone="success" />
          <Stat label="Deductible expenses" value={formatGBP(summary.totalDeductibleExpenses)} tone="warning" />
          {ownership === 'personal' && (
            <Stat label="Section 24 (Box 44)" value={formatGBP(summary.totalSection24)} hint="20% tax credit only" />
          )}
          <Stat
            label="Net profit"
            value={formatGBP(summary.net)}
            tone={summary.net >= 0 ? 'success' : 'danger'}
          />
        </div>

        {(summary.totalTaxDeducted > 0 || summary.totalRentARoomRelief > 0) && (
          <Card>
            <CardBody className="text-xs text-ink-600 grid gap-1">
              {summary.totalTaxDeducted > 0 && (
                <p><strong>Box 21 (Tax deducted at source):</strong> {formatGBP(summary.totalTaxDeducted)} — memo only, not added to income.</p>
              )}
              {summary.totalRentARoomRelief > 0 && (
                <p><strong>Box 37 (Rent a Room relief):</strong> {formatGBP(summary.totalRentARoomRelief)} — separate scheme.</p>
              )}
            </CardBody>
          </Card>
        )}

        {/* Recurring templates card — always visible so Blake can manage */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-accent-600" />
                Recurring monthly expenses
              </CardTitle>
              <CardDescription>Templates set to auto-copy forward each month for {p.nickname}.</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {recurringRows.length === 0 ? (
              <p className="px-6 py-6 text-center text-sm text-ink-500">
                Nothing set to recur yet. When logging an expense (mortgage, insurance, letting-agent fee), tick the <em>Recurring monthly expense</em> box and it will appear here.
              </p>
            ) : (
              <ul className="divide-y hairline divide-ink-100">
                {recurringRows.map((r) => {
                  const label = r.kind === 'income'
                    ? INCOME_LABEL[r.income_category!]
                    : EXPENSE_LABEL[r.expense_category!]
                  const dayOfMonth = String(r.transaction_date).slice(-2)
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-6 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-900">{label} — {formatGBP(r.amount)}</p>
                        <p className="text-xs text-ink-500">
                          Repeats on day {dayOfMonth} each month
                          {r.supplier_or_payer ? ` · ${r.supplier_or_payer}` : ''}
                          {r.description ? ` · ${r.description}` : ''}
                        </p>
                      </div>
                      <Link href={`/mtd/${r.id}/edit`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-accent-700 ring-1 ring-inset ring-accent-500/30 hover:bg-accent-50">
                        <Pencil className="h-3 w-3" /> Edit
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Transactions for this quarter */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions this quarter</CardTitle>
            <CardDescription>Every income and expense row for {p.nickname} in {quarter.shortLabel}. Click Edit to change any field.</CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            {rows.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-ink-500">
                No transactions yet for this quarter.{' '}
                <Link href={`/mtd/new?property_id=${p.id}`} className="font-medium underline">Log one</Link>.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b hairline border-b-ink-100 bg-ink-50/50 text-left text-xs uppercase tracking-wider text-ink-500">
                    <th className="px-6 py-2 font-semibold">Date</th>
                    <th className="px-2 py-2 font-semibold">Category</th>
                    <th className="px-2 py-2 font-semibold">Supplier / Description</th>
                    <th className="px-2 py-2 text-right font-semibold">Amount</th>
                    <th className="px-2 py-2 text-center font-semibold">Recurs</th>
                    <th className="px-6 py-2 text-right font-semibold">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => {
                    const label = t.kind === 'income'
                      ? INCOME_LABEL[t.income_category!]
                      : EXPENSE_LABEL[t.expense_category!]
                    return (
                      <tr key={t.id} className="border-b hairline border-b-ink-100 hover:bg-ink-50/40">
                        <td className="px-6 py-2 text-ink-700">{new Date(t.transaction_date).toLocaleDateString('en-GB')}</td>
                        <td className="px-2 py-2">
                          <Badge tone={t.kind === 'income' ? 'success' : 'warning'}>{label}</Badge>
                        </td>
                        <td className="px-2 py-2 text-ink-700">
                          <div className="min-w-0">
                            {t.supplier_or_payer && <p className="truncate font-medium">{t.supplier_or_payer}</p>}
                            {t.description && <p className="truncate text-xs text-ink-500">{t.description}</p>}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-right font-medium text-ink-900">
                          {t.kind === 'expense' ? '-' : ''}{formatGBP(t.amount)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {t.is_recurring
                            ? <span title="Auto-copies each month" className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent-700 ring-1 ring-inset ring-accent-500/30"><RefreshCw className="h-2.5 w-2.5" /> monthly</span>
                            : <span className="text-xs text-ink-300">-</span>}
                        </td>
                        <td className="px-6 py-2 text-right">
                          <Link href={`/mtd/${t.id}/edit`} className="text-xs font-semibold text-accent-700 underline">Edit</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
