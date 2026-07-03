'use client'
import { useState } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/mtd'
import { MtdCategoryHint } from './mtd-category-hint'

/**
 * Combines the Kind radio + Income/Expense category selects and shows the
 * category-specific guidance card underneath. Rendered inside the server-side
 * MTD add/edit forms.
 */
export function MtdCategorySelects({
  defaultKind = 'income',
  defaultIncome = 'period_amount',
  defaultExpense = 'repairs_and_maintenance',
}: {
  defaultKind?: 'income' | 'expense'
  defaultIncome?: string
  defaultExpense?: string
}) {
  const [kind, setKind] = useState<'income' | 'expense'>(defaultKind)
  const [income, setIncome] = useState(defaultIncome)
  const [expense, setExpense] = useState(defaultExpense)

  return (
    <>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-ink-700">Type</label>
        <div className="grid grid-cols-2 gap-2">
          <label className="cursor-pointer rounded-lg border border-ink-200 bg-white p-3 text-sm has-[input:checked]:border-success-500 has-[input:checked]:bg-success-50">
            <input type="radio" name="kind" value="income" checked={kind === 'income'} onChange={() => setKind('income')} className="mr-2" /> Income
          </label>
          <label className="cursor-pointer rounded-lg border border-ink-200 bg-white p-3 text-sm has-[input:checked]:border-warning-500 has-[input:checked]:bg-warning-50">
            <input type="radio" name="kind" value="expense" checked={kind === 'expense'} onChange={() => setKind('expense')} className="mr-2" /> Expense
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="income_category" className="mb-1 block text-xs font-medium text-ink-700">Income category</label>
        <select
          id="income_category"
          name="income_category"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          className="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm ring-1 ring-inset ring-ink-200 focus:ring-2 focus:ring-inset focus:ring-ink-900"
        >
          {INCOME_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <p className="mt-1 text-xs text-ink-500">Used when type = Income.</p>
      </div>

      <div>
        <label htmlFor="expense_category" className="mb-1 block text-xs font-medium text-ink-700">Expense category</label>
        <select
          id="expense_category"
          name="expense_category"
          value={expense}
          onChange={(e) => setExpense(e.target.value)}
          className="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm ring-1 ring-inset ring-ink-200 focus:ring-2 focus:ring-inset focus:ring-ink-900"
        >
          {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <p className="mt-1 text-xs text-ink-500">Used when type = Expense.</p>
      </div>

      <MtdCategoryHint kind={kind} category={kind === 'income' ? income : expense} />
    </>
  )
}
