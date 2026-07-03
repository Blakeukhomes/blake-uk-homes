import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { type MtdTransaction } from '@/lib/mtd'
import { MtdCategorySelects } from '@/components/mtd-category-selects'
import type { Property } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EditMtdPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: tx } = await supabase.from('mtd_transactions').select('*').eq('id', params.id).maybeSingle()
  const { data: properties = [] } = await supabase.from('properties').select('id, nickname').order('nickname')
  if (!tx) notFound()
  const t = tx as MtdTransaction
  const props = (properties ?? []) as Pick<Property, 'id' | 'nickname'>[]

  async function update(formData: FormData) {
    'use server'
    const supabase = createClient()
    const kind = String(formData.get('kind')) as 'income' | 'expense'
    await supabase.from('mtd_transactions').update({
      property_id: String(formData.get('property_id')),
      kind,
      income_category:  kind === 'income'  ? (formData.get('income_category')  as string) : null,
      expense_category: kind === 'expense' ? (formData.get('expense_category') as string) : null,
      transaction_date: String(formData.get('transaction_date')),
      amount: Number(formData.get('amount') ?? 0),
      description: (formData.get('description') as string) || null,
      supplier_or_payer: (formData.get('supplier_or_payer') as string) || null,
      notes: (formData.get('notes') as string) || null,
      is_recurring: formData.get('is_recurring') === 'on',
    }).eq('id', params.id)
    revalidatePath('/mtd')
    redirect('/mtd')
  }

  async function remove() {
    'use server'
    const supabase = createClient()
    await supabase.from('mtd_transactions').delete().eq('id', params.id)
    revalidatePath('/mtd')
    redirect('/mtd')
  }

  return (
    <>
      <PageHeader
        title="Edit MTD transaction"
        actions={<Link href="/mtd"><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>}
      />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardBody>
            <form action={update} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="property_id">Property</Label>
                <Select id="property_id" name="property_id" required defaultValue={t.property_id}>
                  {props.map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="transaction_date">Date</Label>
                <Input id="transaction_date" name="transaction_date" type="date" required defaultValue={t.transaction_date} />
              </div>

              <MtdCategorySelects
                defaultKind={t.kind as 'income' | 'expense'}
                defaultIncome={t.income_category ?? 'period_amount'}
                defaultExpense={t.expense_category ?? 'repairs_and_maintenance'}
              />

              <div>
                <Label htmlFor="amount">Amount (£)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" min={0} required defaultValue={t.amount} />
              </div>
              <div>
                <Label htmlFor="supplier_or_payer">Supplier or payer</Label>
                <Input id="supplier_or_payer" name="supplier_or_payer" defaultValue={t.supplier_or_payer ?? ''} />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" defaultValue={t.description ?? ''} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} defaultValue={t.notes ?? ''} />
              </div>

              <div className="sm:col-span-2 rounded-xl border border-accent-500/30 bg-accent-50 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="is_recurring" defaultChecked={t.is_recurring ?? false} className="mt-1 h-4 w-4 rounded border-ink-300" />
                  <span className="text-sm">
                    <span className="block font-semibold text-ink-900">This is a recurring monthly expense</span>
                    <span className="mt-1 block text-xs text-ink-600">
                      Tick to auto-log a fresh copy each month. Untick to stop future copies (past ones stay).
                    </span>
                  </span>
                </label>
              </div>

              <div className="sm:col-span-2 flex justify-between gap-2">
                <Button type="submit" formAction={remove} variant="danger" size="sm">Delete</Button>
                <div className="flex gap-2">
                  <Link href="/mtd"><Button variant="secondary" type="button">Cancel</Button></Link>
                  <Button type="submit" size="lg">Save</Button>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
