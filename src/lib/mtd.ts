// Making Tax Digital (ITSA) helpers for Blake UK Homes.
// Categories match the HMRC quarterly property template exactly.
import { addDays, addMonths, format, isAfter, isBefore, isEqual, parseISO } from 'date-fns'

export type MtdKind = 'income' | 'expense'

export type MtdIncomeCategory = 'period_amount' | 'rent_a_room' | 'other_income' | 'tax_deducted'

export type MtdExpenseCategory =
  | 'other'
  | 'council_tax'
  | 'light_and_heat'
  | 'water_rates'
  | 'white_goods'
  | 'insurance'
  | 'window_cleaning'
  | 'general_cleaning'
  | 'oven_cleaning'
  | 'gardening'
  | 'premise_running_costs'
  | 'telephone'
  | 'professional_fees'
  | 'legal_fees'
  | 'rent_a_room_expense'
  | 'redecorating'
  | 'ground_rent'
  | 'service_charges'
  | 'repairs_and_maintenance'
  | 'btl_mortgage_interest'
  | 'other_finance_costs'
  | 'accountancy_fees'
  | 'bank_charges'
  | 'travel_costs'

export const INCOME_CATEGORIES: { value: MtdIncomeCategory; label: string }[] = [
  { value: 'period_amount', label: 'Period Amount (rent)' },
  { value: 'rent_a_room',   label: 'Rent A Room' },
  { value: 'other_income',  label: 'Other Income' },
  { value: 'tax_deducted',  label: 'Tax Deducted' },
]

export const EXPENSE_CATEGORIES: { value: MtdExpenseCategory; label: string }[] = [
  { value: 'council_tax',             label: 'Council Tax' },
  { value: 'light_and_heat',          label: 'Light and Heat' },
  { value: 'water_rates',             label: 'Water Rates' },
  { value: 'white_goods',             label: 'White goods' },
  { value: 'insurance',               label: 'Insurance' },
  { value: 'window_cleaning',         label: 'Window Cleaning' },
  { value: 'general_cleaning',        label: 'General Cleaning' },
  { value: 'oven_cleaning',           label: 'Oven Cleaning' },
  { value: 'gardening',               label: 'Gardening' },
  { value: 'premise_running_costs',   label: 'Premise Running Costs' },
  { value: 'telephone',               label: 'Telephone' },
  { value: 'professional_fees',       label: 'Professional Fees' },
  { value: 'legal_fees',              label: 'Legal Fees' },
  { value: 'rent_a_room_expense',     label: 'Rent A Room' },
  { value: 'redecorating',            label: 'Redecorating' },
  { value: 'ground_rent',             label: 'Ground Rent' },
  { value: 'service_charges',         label: 'Service Charges' },
  { value: 'repairs_and_maintenance', label: 'Repairs and Maintenance' },
  { value: 'btl_mortgage_interest',   label: 'Residential BTL Mortgage Interest' },
  { value: 'other_finance_costs',     label: 'Other finance costs' },
  { value: 'accountancy_fees',        label: 'Accountancy fees' },
  { value: 'bank_charges',            label: 'Bank Charges' },
  { value: 'travel_costs',            label: 'Travel Costs' },
  { value: 'other',                   label: 'Other' },
]

export const INCOME_LABEL: Record<MtdIncomeCategory, string> =
  Object.fromEntries(INCOME_CATEGORIES.map((c) => [c.value, c.label])) as any
export const EXPENSE_LABEL: Record<MtdExpenseCategory, string> =
  Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.value, c.label])) as any

export interface MtdTransaction {
  id: string
  property_id: string
  document_id: string | null
  kind: MtdKind
  income_category: MtdIncomeCategory | null
  expense_category: MtdExpenseCategory | null
  transaction_date: string
  amount: number
  description: string | null
  supplier_or_payer: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

// ----- Quarter helpers -----
// UK tax year starts 6 April. Quarters: Q1 6 Apr–5 Jul, Q2 6 Jul–5 Oct, Q3 6 Oct–5 Jan, Q4 6 Jan–5 Apr.

export interface MtdQuarter {
  id: string             // e.g. 2026Q1
  label: string          // e.g. Q1 (6 Apr to 5 Jul) 2026/27
  shortLabel: string     // e.g. Q1 2026/27
  start: Date
  end: Date
  taxYearStart: number   // calendar year the tax year started (e.g. 2026 for 2026/27)
  qNum: 1 | 2 | 3 | 4
}

export function quarterFor(date: Date): MtdQuarter {
  const y = date.getFullYear()
  const apr6  = new Date(y, 3, 6)
  const jul6  = new Date(y, 6, 6)
  const oct6  = new Date(y, 9, 6)
  const jan6  = new Date(y, 0, 6)

  let qNum: 1 | 2 | 3 | 4
  let start: Date
  let end: Date
  let taxYearStart: number

  if (date >= oct6) {
    qNum = 3; start = oct6; end = new Date(y + 1, 0, 5); taxYearStart = y - (date >= apr6 ? 0 : 1)
    // taxYearStart = y because oct6 is in the same tax year as the apr6 of the same calendar year
    taxYearStart = y
  } else if (date >= jul6) {
    qNum = 2; start = jul6; end = new Date(y, 9, 5); taxYearStart = y
  } else if (date >= apr6) {
    qNum = 1; start = apr6; end = new Date(y, 6, 5); taxYearStart = y
  } else if (date >= jan6) {
    qNum = 4; start = jan6; end = new Date(y, 3, 5); taxYearStart = y - 1
  } else {
    // before Jan 6 in the calendar year: in Q3 of previous tax year (Oct prev year to Jan curr year)
    qNum = 3; start = new Date(y - 1, 9, 6); end = new Date(y, 0, 5); taxYearStart = y - 1
  }

  const tyShort = `${taxYearStart}/${String(taxYearStart + 1).slice(-2)}`
  const ranges: Record<number, string> = {
    1: '6 Apr to 5 Jul',
    2: '6 Jul to 5 Oct',
    3: '6 Oct to 5 Jan',
    4: '6 Jan to 5 Apr',
  }

  return {
    id: `${taxYearStart}Q${qNum}`,
    label: `Q${qNum} (${ranges[qNum]}) ${tyShort}`,
    shortLabel: `Q${qNum} ${tyShort}`,
    start,
    end,
    taxYearStart,
    qNum,
  }
}

/** Get a list of recent quarters (current and previous N). */
export function recentQuarters(count = 6, today = new Date()): MtdQuarter[] {
  const out: MtdQuarter[] = []
  let cursor = today
  let lastId: string | null = null
  for (let i = 0; i < count + 1; i++) {
    const q = quarterFor(cursor)
    if (q.id !== lastId) {
      out.push(q)
      lastId = q.id
    }
    // step back ~92 days to find the previous quarter
    cursor = addDays(q.start, -10)
  }
  return out.slice(0, count)
}

/** Find quarter by id like "2026Q2". */
export function quarterById(id: string): MtdQuarter | null {
  const m = id.match(/^(\d{4})Q([1-4])$/)
  if (!m) return null
  const ty = Number(m[1])
  const q = Number(m[2])
  const probeMap: Record<number, Date> = {
    1: new Date(ty, 4, 1),
    2: new Date(ty, 7, 1),
    3: new Date(ty, 10, 1),
    4: new Date(ty + 1, 1, 1),
  }
  return quarterFor(probeMap[q])
}

export function isInQuarter(dateStr: string, q: MtdQuarter): boolean {
  const d = parseISO(dateStr)
  return (
    (isAfter(d, q.start)  || isEqual(d, q.start)) &&
    (isBefore(d, q.end)   || isEqual(d, q.end))
  )
}

/** Sum a list of transactions for a quarter, grouped by category. */
export interface MtdSummary {
  quarter: MtdQuarter
  property_id: string
  income: { category: MtdIncomeCategory; label: string; total: number; count: number }[]
  expenses: { category: MtdExpenseCategory; label: string; total: number; count: number }[]
  totalIncome: number
  totalExpenses: number
  net: number
}

export function summariseQuarter(
  property_id: string,
  txs: MtdTransaction[],
  quarter: MtdQuarter,
): MtdSummary {
  const inQ = txs.filter((t) => t.property_id === property_id && isInQuarter(t.transaction_date, quarter))

  const incomeMap = new Map<MtdIncomeCategory, { total: number; count: number }>()
  const expenseMap = new Map<MtdExpenseCategory, { total: number; count: number }>()

  for (const t of inQ) {
    if (t.kind === 'income' && t.income_category) {
      const v = incomeMap.get(t.income_category) ?? { total: 0, count: 0 }
      v.total += Number(t.amount); v.count += 1
      incomeMap.set(t.income_category, v)
    } else if (t.kind === 'expense' && t.expense_category) {
      const v = expenseMap.get(t.expense_category) ?? { total: 0, count: 0 }
      v.total += Number(t.amount); v.count += 1
      expenseMap.set(t.expense_category, v)
    }
  }

  const income = INCOME_CATEGORIES.map((c) => ({
    category: c.value, label: c.label,
    total: incomeMap.get(c.value)?.total ?? 0,
    count: incomeMap.get(c.value)?.count ?? 0,
  })).filter((r) => r.total > 0 || r.count > 0)

  const expenses = EXPENSE_CATEGORIES.map((c) => ({
    category: c.value, label: c.label,
    total: expenseMap.get(c.value)?.total ?? 0,
    count: expenseMap.get(c.value)?.count ?? 0,
  })).filter((r) => r.total > 0 || r.count > 0)

  const totalIncome   = income.reduce((s, r) => s + r.total, 0)
  const totalExpenses = expenses.reduce((s, r) => s + r.total, 0)

  return {
    quarter, property_id,
    income, expenses,
    totalIncome, totalExpenses,
    net: totalIncome - totalExpenses,
  }
}
