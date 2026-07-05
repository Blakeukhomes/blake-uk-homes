import Link from 'next/link'
import { Receipt, Plus, Download, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Stat } from '@/components/ui/stat'
import { MtdQuarterPicker } from '@/components/mtd-quarter-picker'
import {
  EXPENSE_LABEL,
  INCOME_LABEL,
  type MtdTransaction,
  prevQuarterId,
  quarterById,
  quarterFor,
  recentQuarters,
  summariseQuarter,
} from '@/lib/mtd'
import { formatGBP } from '@/lib/rent'
import { QuarterCheckBanner } from '@/components/quarter-check-banner'
import type { Property } from '@/lib/types'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function MtdPage({
  searchParams,
}: {
  searchParams: { q?: string; p?: string }
}) {
  const supabase = createClient()

  const { data: properties = [] } = await supabase.from('properties').select('*').order('nickname')
  const props = (properties ?? []) as Property[]

  const quarters = recentQuarters(6)
  const quarter = (searchParams.q ? quarterById(searchParams.q) : null) ?? quarterFor(new Date())

  // Pull transactions for the chosen quarter
  const startStr = format(quarter.start, 'yyyy-MM-dd')
  const endStr   = format(quarter.end, 'yyyy-MM-dd')
  const { data: txs = [] } = await supabase
    .from('mtd_transactions')
    .select('*')
    .gte('transaction_date', startStr)
    .lte('transaction_date', endStr)
    .order('transaction_date', { ascending: false })

  const allTxsUnfiltered = (txs ?? []) as MtdTransaction[]
  const filterPropertyId = searchParams.p && searchParams.p !== 'all' ? searchParams.p : null
  const allTxs = filterPropertyId
    ? allTxsUnfiltered.filter((t) => t.property_id === filterPropertyId)
    : allTxsUnfiltered

  // Portfolio-wide totals
  let portfolioIncome = 0
  let portfolioExpense = 0
  for (const t of allTxs) {
    if (t.kind === 'income') portfolioIncome += Number(t.amount)
    if (t.kind === 'expense') portfolioExpense += Number(t.amount)
  }

  return (
    <>
      <PageHeader
        title="Making Tax Digital"
        subtitle="Quarterly property income and expenses, tagged to HMRC ITSA categories."
        actions={
          <>
            <MtdQuarterPicker quarters={quarters} selected={quarter.id} />
            <Link href={`/api/export/portfolio?ownership=personal&q=${quarter.id}`} target="_blank">
              <Button variant="secondary"><Download className="h-4 w-4" />Personal portfolio</Button>
            </Link>
            <Link href={`/api/export/portfolio?ownership=limited_company&q=${quarter.id}`} target="_blank">
              <Button variant="secondary"><Download className="h-4 w-4" />Ltd Co portfolio</Button>
            </Link>
            <Link href="/mtd/new">
              <Button><Plus className="h-4 w-4" />Log transaction</Button>
            </Link>
          </>
        }
      />

      <div className="p-6 space-y-6">
        {/* Reminder banner at start of each new quarter */}
        {(() => {
          const now = new Date()
          const currentQ = quarterFor(now)
          const daysIn = Math.floor((now.getTime() - currentQ.start.getTime()) / 86400000)
          const prevQ = quarterById(prevQuarterId(currentQ.id))
          if (!prevQ) return null
          return (
            <QuarterCheckBanner
              quarterId={currentQ.id}
              daysSinceQuarterStart={daysIn}
              prevQuarterLabel={prevQ.shortLabel}
            />
          )
        })()}

        {/* Portfolio KPIs for the quarter */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Quarter" value={quarter.shortLabel} hint={`${format(quarter.start, 'd MMM yyyy')} to ${format(quarter.end, 'd MMM yyyy')}`} icon={<Receipt className="h-4 w-4" />} />
          <Stat label="Income"   value={formatGBP(portfolioIncome)}  tone="success" />
          <Stat label="Expenses" value={formatGBP(portfolioExpense)} tone="warning" />
          <Stat label="Net"      value={formatGBP(portfolioIncome - portfolioExpense)} tone={portfolioIncome - portfolioExpense >= 0 ? 'success' : 'danger'} />
        </div>

        {/* Per-property breakdown */}
        {props.length === 0 ? (
          <Card>
            <CardBody className="text-center py-10 text-sm text-ink-500">
              Add a property first to begin tracking MTD transactions.
            </CardBody>
          </Card>
        ) : (
          props.map((p) => {
            const summary = summariseQuarter(p.id, allTxs, quarter, ((p as any).ownership_type ?? 'personal') as 'personal' | 'limited_company')
            return (
              <Card key={p.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>{p.nickname}</CardTitle>
                      <CardDescription>{p.address_line_1}, {p.city} {p.postcode}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={summary.net >= 0 ? 'success' : 'danger'}>
                        Net {formatGBP(summary.net)}
                      </Badge>
                      <Link href={`/api/pdf/mtd?property=${p.id}&q=${quarter.id}`} target="_blank">
                        <Button variant="secondary" size="sm"><Download className="h-4 w-4" /> PDF</Button>
                      </Link>
                      <Link href={`/api/xlsx/mtd?property=${p.id}&q=${quarter.id}`} target="_blank">
                        <Button variant="secondary" size="sm"><Download className="h-4 w-4" /> Xlsx</Button>
                      </Link>
                      <Link href={`/api/export/quarterly?property=${p.id}&q=${quarter.id}`} target="_blank">
                        <Button size="sm"><Download className="h-4 w-4" /> Full zip</Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="grid gap-6 md:grid-cols-2">
                  {/* Income */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-success-700">Income</p>
                    {summary.income.length === 0 ? (
                      <p className="mt-3 text-sm text-ink-400">No income recorded in this quarter.</p>
                    ) : (
                      <table className="mt-3 w-full text-sm">
                        <tbody>
                          {summary.income.map((r) => (
                            <tr key={r.category} className="border-t hairline border-t-ink-100">
                              <td className="py-1.5 text-ink-700">{r.label} <span className="text-xs text-ink-400">({r.count})</span></td>
                              <td className="py-1.5 text-right font-medium text-ink-900">{formatGBP(r.total)}</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-t-ink-200">
                            <td className="py-2 text-sm font-bold text-ink-900">Total income</td>
                            <td className="py-2 text-right text-sm font-bold text-success-700">{formatGBP(summary.totalIncome)}</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                  {/* Expenses */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-warning-700">Expenses</p>
                    {summary.expenses.length === 0 ? (
                      <p className="mt-3 text-sm text-ink-400">No expenses recorded in this quarter.</p>
                    ) : (
                      <table className="mt-3 w-full text-sm">
                        <tbody>
                          {summary.expenses.map((r) => (
                            <tr key={r.category} className="border-t hairline border-t-ink-100">
                              <td className="py-1.5 text-ink-700">{r.label} <span className="text-xs text-ink-400">({r.count})</span></td>
                              <td className="py-1.5 text-right font-medium text-ink-900">{formatGBP(r.total)}</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-t-ink-200">
                            <td className="py-2 text-sm font-bold text-ink-900">Total expenses</td>
                            <td className="py-2 text-right text-sm font-bold text-warning-700">{formatGBP(summary.totalExpenses)}</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </CardBody>
              </Card>
            )
          })
        )}

        {/* Property filter tabs */}
        {props.length > 1 && (
          <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 ring-1 ring-inset ring-ink-100">
            <Link
              href={`/mtd?q=${quarter.id}&p=all`}
              className={
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ' +
                (!filterPropertyId ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100')
              }
            >
              All properties
            </Link>
            {props.map((prop) => (
              <Link
                key={prop.id}
                href={`/mtd?q=${quarter.id}&p=${prop.id}`}
                className={
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ' +
                  (filterPropertyId === prop.id ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100')
                }
              >
                {prop.nickname}
              </Link>
            ))}
          </div>
        )}

        {/* Transactions list */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions this quarter</CardTitle>
            <CardDescription>Sorted by date, newest first. Linked invoices appear under Documents.</CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            {allTxs.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-ink-500">
                No transactions yet for this quarter.{' '}
                <Link href="/mtd/new" className="font-medium underline">Log one</Link>.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b hairline border-b-ink-100 bg-ink-50/50 text-left text-xs uppercase tracking-wider text-ink-500">
                    <th className="px-6 py-2 font-semibold">Date</th>
                    <th className="px-2 py-2 font-semibold">Property</th>
                    <th className="px-2 py-2 font-semibold">Category</th>
                    <th className="px-2 py-2 font-semibold">Description</th>
                    <th className="px-2 py-2 text-right font-semibold">Amount</th>
                    <th className="px-2 py-2 text-center font-semibold">Recurs</th>
                    <th className="px-6 py-2 text-right font-semibold">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {allTxs.map((t) => {
                    const prop = props.find((p) => p.id === t.property_id)
                    const label = t.kind === 'income'
                      ? INCOME_LABEL[t.income_category!]
                      : EXPENSE_LABEL[t.expense_category!]
                    return (
                      <tr key={t.id} className="border-b hairline border-b-ink-100">
                        <td className="px-6 py-2 text-ink-700">{new Date(t.transaction_date).toLocaleDateString('en-GB')}</td>
                        <td className="px-2 py-2 text-ink-700">{prop?.nickname ?? '-'}</td>
                        <td className="px-2 py-2">
                          <Badge tone={t.kind === 'income' ? 'success' : 'warning'}>{label}</Badge>
                        </td>
                        <td className="px-2 py-2 text-ink-700">
                          {t.description}
                          {t.supplier_or_payer ? <span className="text-xs text-ink-400"> · {t.supplier_or_payer}</span> : null}
                        </td>
                        <td className={`px-2 py-2 text-right font-medium ${t.kind === 'income' ? 'text-success-700' : 'text-ink-900'}`}>
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
