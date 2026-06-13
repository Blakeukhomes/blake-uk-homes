// Making Tax Digital (ITSA) helpers for Blake UK Homes.
// Categories follow the client accountant's Nick's XL labels, but every category
// also carries its HMRC SA105 box mapping + SA105 group so exports can be grouped
// by box and Section 24 mortgage interest can be kept in its own block.
import { addDays, isAfter, isBefore, isEqual, parseISO } from 'date-fns'

export type MtdKind = 'income' | 'expense'

export type MtdIncomeCategory =
  | 'period_amount'
  | 'rent_a_room'
  | 'other_income'
  | 'tax_deducted'
  | 'lease_premiums'           // NEW (SA105 Box 6 / lease premiums received)

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
  | 'btl_mortgage_interest'   // Section 24 — Box 44
  | 'other_finance_costs'     // Section 24 — Box 44
  | 'accountancy_fees'
  | 'bank_charges'
  | 'travel_costs'
  | 'private_use_adjustment'  // NEW — SA105 Box 10

// ---------- Category metadata ----------
// `group` reflects the spec doc's Groups 1-5 plus 'section24' for Box 44 and
// 'private_use' for Box 10 deductions.
export type MtdGroupKey =
  | 'income'
  | 'group1_repairs'           // SA105 Box 6 — repairs and property running costs
  | 'group2_services'          // SA105 Box 6 — cost of services provided to tenants
  | 'group3_section24'         // SA105 Box 44 — residential finance costs (20% credit only)
  | 'group4_professional'      // SA105 Box 8 — legal/management/professional fees
  | 'group5_other'             // SA105 Box 9 — other allowable property expenses
  | 'private_use'              // SA105 Box 10 — private use adjustment

export interface CategoryMeta {
  label: string         // Nick's accountant label (what the user sees)
  hmrcLabel: string     // HMRC official wording
  sa105Box: string      // SA105 box number (e.g. '6', '44', '5.1')
  group: MtdGroupKey
  section24?: boolean   // true for residential finance costs — must stay separate
}

export const INCOME_META: Record<MtdIncomeCategory, CategoryMeta> = {
  period_amount: { label: 'Period Amount (rent)', hmrcLabel: 'Income — rent and services',  sa105Box: '5',    group: 'income' },
  other_income:  { label: 'Other Income',         hmrcLabel: 'Other income from property',   sa105Box: '5',    group: 'income' },
  rent_a_room:   { label: 'Rent A Room',          hmrcLabel: 'Rent a Room income',           sa105Box: '5',    group: 'income' },
  tax_deducted:  { label: 'Tax Deducted',         hmrcLabel: 'Tax deducted at source',       sa105Box: '21',   group: 'income' },
  lease_premiums:{ label: 'Lease premiums received', hmrcLabel: 'Lease premiums received',   sa105Box: '5',    group: 'income' },
}

export const EXPENSE_META: Record<MtdExpenseCategory, CategoryMeta> = {
  // Group 1 — Repairs and property costs (Box 6)
  repairs_and_maintenance: { label: 'Repairs and Maintenance', hmrcLabel: 'Repairs and maintenance',                       sa105Box: '6', group: 'group1_repairs' },
  redecorating:            { label: 'Redecorating',            hmrcLabel: 'Repairs and maintenance (redecorating)',         sa105Box: '6', group: 'group1_repairs' },
  white_goods:             { label: 'White goods',             hmrcLabel: 'Repairs and maintenance (white goods)',          sa105Box: '6', group: 'group1_repairs' },
  window_cleaning:         { label: 'Window Cleaning',         hmrcLabel: 'Repairs and maintenance (window cleaning)',      sa105Box: '6', group: 'group1_repairs' },
  general_cleaning:        { label: 'General Cleaning',        hmrcLabel: 'Repairs and maintenance (general cleaning)',     sa105Box: '6', group: 'group1_repairs' },
  oven_cleaning:           { label: 'Oven Cleaning',           hmrcLabel: 'Repairs and maintenance (oven cleaning)',        sa105Box: '6', group: 'group1_repairs' },
  gardening:               { label: 'Gardening',               hmrcLabel: 'Repairs and maintenance (gardening)',            sa105Box: '6', group: 'group1_repairs' },
  insurance:               { label: 'Insurance',               hmrcLabel: 'Rent, rates, insurance, ground rents',           sa105Box: '6', group: 'group1_repairs' },
  ground_rent:             { label: 'Ground Rent',             hmrcLabel: 'Rent, rates, insurance, ground rents (ground)',  sa105Box: '6', group: 'group1_repairs' },
  service_charges:         { label: 'Service Charges',         hmrcLabel: 'Rent, rates, insurance, ground rents (svc)',     sa105Box: '6', group: 'group1_repairs' },

  // Group 2 — Cost of services provided to tenants (Box 6)
  council_tax:             { label: 'Council Tax',             hmrcLabel: 'Cost of services provided to tenants (council tax)', sa105Box: '6', group: 'group2_services' },
  light_and_heat:          { label: 'Light and Heat',          hmrcLabel: 'Cost of services provided to tenants (light & heat)', sa105Box: '6', group: 'group2_services' },
  water_rates:             { label: 'Water Rates',             hmrcLabel: 'Cost of services provided to tenants (water)',       sa105Box: '6', group: 'group2_services' },
  premise_running_costs:   { label: 'Cost of services provided to tenants', hmrcLabel: 'Cost of services provided to tenants', sa105Box: '6', group: 'group2_services' },
  telephone:               { label: 'Telephone',               hmrcLabel: 'Cost of services provided to tenants (telephone)',   sa105Box: '6', group: 'group2_services' },

  // Group 3 — Residential finance costs (Box 44 — Section 24)
  btl_mortgage_interest:   { label: 'Residential BTL Mortgage Interest', hmrcLabel: 'Residential finance costs',  sa105Box: '44', group: 'group3_section24', section24: true },
  other_finance_costs:     { label: 'Other finance costs',     hmrcLabel: 'Residential finance costs (other)',     sa105Box: '44', group: 'group3_section24', section24: true },

  // Group 4 — Legal, management and professional fees (Box 8)
  professional_fees:       { label: 'Professional Fees',       hmrcLabel: 'Legal, management and professional fees',          sa105Box: '8', group: 'group4_professional' },
  legal_fees:              { label: 'Legal Fees',              hmrcLabel: 'Legal, management and professional fees (legal)',  sa105Box: '8', group: 'group4_professional' },
  accountancy_fees:        { label: 'Accountancy fees',        hmrcLabel: 'Legal, management and professional fees (accy)',   sa105Box: '8', group: 'group4_professional' },
  bank_charges:            { label: 'Bank Charges',            hmrcLabel: 'Legal, management and professional fees (bank)',   sa105Box: '8', group: 'group4_professional' },

  // Group 5 — Other allowable property expenses (Box 9)
  travel_costs:            { label: 'Travel Costs',            hmrcLabel: 'Other allowable property expenses (travel)', sa105Box: '9', group: 'group5_other' },
  rent_a_room_expense:     { label: 'Rent A Room (expense)',   hmrcLabel: 'Other allowable property expenses (rar)',    sa105Box: '9', group: 'group5_other' },
  other:                   { label: 'Other',                   hmrcLabel: 'Other allowable property expenses',          sa105Box: '9', group: 'group5_other' },

  // Box 10 — Private use adjustment (not common, but spec-listed)
  private_use_adjustment:  { label: 'Private use adjustment',  hmrcLabel: 'Private use adjustment',                     sa105Box: '10', group: 'private_use' },
}

// Display-ordered list used in selects / iterations
export const INCOME_CATEGORIES: { value: MtdIncomeCategory; label: string }[] =
  (Object.entries(INCOME_META) as [MtdIncomeCategory, CategoryMeta][])
    .map(([value, m]) => ({ value, label: m.label }))

export const EXPENSE_CATEGORIES: { value: MtdExpenseCategory; label: string }[] =
  (Object.entries(EXPENSE_META) as [MtdExpenseCategory, CategoryMeta][])
    .map(([value, m]) => ({ value, label: m.label }))

export const INCOME_LABEL: Record<MtdIncomeCategory, string> =
  Object.fromEntries(Object.entries(INCOME_META).map(([k, m]) => [k, m.label])) as Record<MtdIncomeCategory, string>
export const EXPENSE_LABEL: Record<MtdExpenseCategory, string> =
  Object.fromEntries(Object.entries(EXPENSE_META).map(([k, m]) => [k, m.label])) as Record<MtdExpenseCategory, string>

export const GROUP_LABEL: Record<MtdGroupKey, { title: string; box: string; note?: string }> = {
  income:              { title: 'Income',                                            box: 'Box 5 / 21' },
  group1_repairs:      { title: 'Repairs and property running costs',                box: 'Box 6' },
  group2_services:     { title: 'Cost of services provided to tenants',              box: 'Box 6' },
  group3_section24:    { title: 'Residential finance costs (Section 24)',            box: 'Box 44', note: 'Not deducted — 20% tax credit only.' },
  group4_professional: { title: 'Legal, management and professional fees',           box: 'Box 8' },
  group5_other:        { title: 'Other allowable property expenses',                 box: 'Box 9' },
  private_use:         { title: 'Private use adjustment',                            box: 'Box 10' },
}

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

// ----- Quarter helpers (UK tax year starts 6 April) -----
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
    qNum = 3; start = oct6; end = new Date(y + 1, 0, 5); taxYearStart = y
  } else if (date >= jul6) {
    qNum = 2; start = jul6; end = new Date(y, 9, 5); taxYearStart = y
  } else if (date >= apr6) {
    qNum = 1; start = apr6; end = new Date(y, 6, 5); taxYearStart = y
  } else if (date >= jan6) {
    qNum = 4; start = jan6; end = new Date(y, 3, 5); taxYearStart = y - 1
  } else {
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
    start, end, taxYearStart, qNum,
  }
}

export function recentQuarters(count = 6, today = new Date()): MtdQuarter[] {
  const out: MtdQuarter[] = []
  let cursor = today
  let lastId: string | null = null
  for (let i = 0; i < count + 1; i++) {
    const q = quarterFor(cursor)
    if (q.id !== lastId) { out.push(q); lastId = q.id }
    cursor = addDays(q.start, -10)
  }
  return out.slice(0, count)
}

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
    (isAfter(d, q.start) || isEqual(d, q.start)) &&
    (isBefore(d, q.end)  || isEqual(d, q.end))
  )
}

// ----- Quarter summary, with Section 24 split out -----
export interface MtdCategoryRow<C extends string = string> {
  category: C
  label: string
  hmrcLabel: string
  sa105Box: string
  group: MtdGroupKey
  total: number
  count: number
}

export interface MtdSummary {
  quarter: MtdQuarter
  property_id: string
  income: MtdCategoryRow<MtdIncomeCategory>[]
  /** Group 1, 2, 4, 5, and private_use only — NOT Section 24. */
  expensesDeductible: MtdCategoryRow<MtdExpenseCategory>[]
  /** Group 3 — residential finance costs, kept separate per Section 24. */
  section24: MtdCategoryRow<MtdExpenseCategory>[]
  /** All expenses including Section 24 (rarely needed, but handy for raw totals). */
  expenses: MtdCategoryRow<MtdExpenseCategory>[]
  totalIncome: number
  /** Deductible expenses only (sum of expensesDeductible). Use this for taxable profit. */
  totalDeductibleExpenses: number
  /** Section 24 total (gives a 20% tax credit, not a deduction). */
  totalSection24: number
  totalExpenses: number
  /** Income minus deductible expenses. The 20% credit on section24 is applied later by the accountant. */
  net: number
  /** Subtotals per group, in the export order. */
  groupTotals: { group: MtdGroupKey; title: string; box: string; total: number }[]
}

export function summariseQuarter(
  property_id: string,
  txs: MtdTransaction[],
  quarter: MtdQuarter,
  ownership: 'personal' | 'limited_company' = 'personal',
): MtdSummary {
  const inQ = txs.filter((t) => t.property_id === property_id && isInQuarter(t.transaction_date, quarter))

  const incomeMap  = new Map<MtdIncomeCategory,  { total: number; count: number }>()
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

  const income: MtdCategoryRow<MtdIncomeCategory>[] =
    (Object.entries(INCOME_META) as [MtdIncomeCategory, CategoryMeta][])
      .map(([cat, m]) => ({
        category: cat, label: m.label, hmrcLabel: m.hmrcLabel, sa105Box: m.sa105Box, group: m.group,
        total: incomeMap.get(cat)?.total ?? 0,
        count: incomeMap.get(cat)?.count ?? 0,
      }))
      .filter((r) => r.total > 0 || r.count > 0)

  const allExpenseRows: MtdCategoryRow<MtdExpenseCategory>[] =
    (Object.entries(EXPENSE_META) as [MtdExpenseCategory, CategoryMeta][])
      .map(([cat, m]) => ({
        category: cat, label: m.label, hmrcLabel: m.hmrcLabel, sa105Box: m.sa105Box, group: m.group,
        total: expenseMap.get(cat)?.total ?? 0,
        count: expenseMap.get(cat)?.count ?? 0,
      }))
      .filter((r) => r.total > 0 || r.count > 0)

  // Section 24 only applies to personally-owned properties. For limited-company
  // properties mortgage interest is a normal deductible expense (CT, not ITSA).
  const section24          = ownership === 'personal'
    ? allExpenseRows.filter((r) => EXPENSE_META[r.category].section24 === true)
    : []
  const expensesDeductible = ownership === 'personal'
    ? allExpenseRows.filter((r) => EXPENSE_META[r.category].section24 !== true)
    : allExpenseRows

  const totalIncome = income.reduce((s, r) => s + r.total, 0)
  const totalDeductibleExpenses = expensesDeductible.reduce((s, r) => s + r.total, 0)
  const totalSection24 = section24.reduce((s, r) => s + r.total, 0)
  const totalExpenses = totalDeductibleExpenses + totalSection24

  const groupKeys: MtdGroupKey[] = [
    'group1_repairs', 'group2_services', 'group4_professional', 'group5_other', 'private_use', 'group3_section24',
  ]
  const groupTotals = groupKeys.map((g) => {
    const total = allExpenseRows.filter((r) => r.group === g).reduce((s, r) => s + r.total, 0)
    return { group: g, title: GROUP_LABEL[g].title, box: GROUP_LABEL[g].box, total }
  })

  return {
    quarter,
    property_id,
    income,
    expensesDeductible,
    section24,
    expenses: allExpenseRows,
    totalIncome,
    totalDeductibleExpenses,
    totalSection24,
    totalExpenses,
    net: totalIncome - totalDeductibleExpenses,
    groupTotals,
  }
}
