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
  | 'lease_premiums'           // Box 22 — Premiums for the grant of a lease
  | 'reverse_premium'          // NEW — Box 23 — Reverse premiums and inducements

export type MtdExpenseCategory =
  | 'other'
  | 'non_residential_finance_costs'   // NEW — Box 26 (commercial lets)
  | 'replacing_domestic_items'        // NEW — Box 36 (residential like-for-like replacements)
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
  | 'letting_agent_fees'
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
  | 'income'                   // SA105 Box 20 (+22, +23) — rents and other property income
  | 'tax_deducted'             // SA105 Box 21 — tax already deducted at source, memo only
  | 'rent_a_room_relief'       // SA105 Box 37 — Rent a Room exempt relief, not a normal income line
  | 'box24_rents_rates_insurance'    // SA105 Box 24 — rent, rates, insurance, ground rents
  | 'box25_repairs'                  // SA105 Box 25 — property repairs and maintenance (like-for-like)
  | 'box26_non_residential_finance'  // SA105 Box 26 — non-residential property finance costs (fully deductible)
  | 'box27_professional'             // SA105 Box 27 — legal, management and professional fees
  | 'box28_services'                 // SA105 Box 28 — cost of services provided incl. wages
  | 'box29_other'                    // SA105 Box 29 — other allowable property expenses
  | 'box36_domestic_items'           // SA105 Box 36 — costs of replacing domestic items (residential)
  | 'box44_residential_finance'      // SA105 Box 44 — residential finance costs (20% tax credit only)
  | 'private_use'                    // SA105 Box 10 — private use adjustment (rare)

export interface CategoryMeta {
  label: string         // Nick's accountant label (what the user sees)
  hmrcLabel: string     // HMRC official wording
  sa105Box: string      // SA105 box number (e.g. '6', '44', '5.1')
  group: MtdGroupKey
  section24?: boolean   // true for residential finance costs — must stay separate
}

export const INCOME_META: Record<MtdIncomeCategory, CategoryMeta> = {
  period_amount: { label: 'Period Amount (rent)',    hmrcLabel: 'Rents and other income from property', sa105Box: '20', group: 'income' },
  other_income:  { label: 'Other Income',            hmrcLabel: 'Rents and other income from property', sa105Box: '20', group: 'income' },
  rent_a_room:   { label: 'Rent a Room (exempt)',    hmrcLabel: 'Rent a Room exempt amount (relief)',    sa105Box: '37', group: 'rent_a_room_relief' },
  tax_deducted:  { label: 'Tax Deducted at source',  hmrcLabel: 'Tax taken off any income in Box 20',    sa105Box: '21', group: 'tax_deducted' },
  lease_premiums:{ label: 'Lease premiums received', hmrcLabel: 'Premiums for the grant of a lease',      sa105Box: '22', group: 'income' },
  reverse_premium:{ label: 'Reverse premium received', hmrcLabel: 'Reverse premiums and inducements',      sa105Box: '23', group: 'income' },
}

export const EXPENSE_META: Record<MtdExpenseCategory, CategoryMeta> = {
  // Box 24 — Rent, rates, insurance, ground rents
  insurance:               { label: 'Insurance',               hmrcLabel: 'Rent, rates, insurance, ground rents',           sa105Box: '24', group: 'box24_rents_rates_insurance' },
  ground_rent:             { label: 'Ground Rent',             hmrcLabel: 'Rent, rates, insurance, ground rents',           sa105Box: '24', group: 'box24_rents_rates_insurance' },
  service_charges:         { label: 'Service Charges',         hmrcLabel: 'Rent, rates, insurance, ground rents',           sa105Box: '24', group: 'box24_rents_rates_insurance' },
  council_tax:             { label: 'Council Tax (landlord-paid)', hmrcLabel: 'Rent, rates, insurance, ground rents',       sa105Box: '24', group: 'box24_rents_rates_insurance' },
  water_rates:             { label: 'Water Rates (landlord-paid)', hmrcLabel: 'Rent, rates, insurance, ground rents',       sa105Box: '24', group: 'box24_rents_rates_insurance' },
  light_and_heat:          { label: 'Light and Heat (landlord-paid)', hmrcLabel: 'Rent, rates, insurance, ground rents',   sa105Box: '24', group: 'box24_rents_rates_insurance' },

  // Box 25 — Property repairs and maintenance (like-for-like only)
  repairs_and_maintenance: { label: 'Repairs and Maintenance', hmrcLabel: 'Property repairs and maintenance',              sa105Box: '25', group: 'box25_repairs' },
  redecorating:            { label: 'Redecorating',            hmrcLabel: 'Property repairs and maintenance',              sa105Box: '25', group: 'box25_repairs' },
  window_cleaning:         { label: 'Window Cleaning',         hmrcLabel: 'Property repairs and maintenance',              sa105Box: '25', group: 'box25_repairs' },
  general_cleaning:        { label: 'General Cleaning',        hmrcLabel: 'Property repairs and maintenance',              sa105Box: '25', group: 'box25_repairs' },
  oven_cleaning:           { label: 'Oven Cleaning',           hmrcLabel: 'Property repairs and maintenance',              sa105Box: '25', group: 'box25_repairs' },
  gardening:               { label: 'Gardening',               hmrcLabel: 'Property repairs and maintenance',              sa105Box: '25', group: 'box25_repairs' },

  // Box 27 — Legal, management and professional fees
  professional_fees:       { label: 'Professional Fees',       hmrcLabel: 'Legal, management and professional fees',       sa105Box: '27', group: 'box27_professional' },
  letting_agent_fees:      { label: 'Letting Agent Fees',      hmrcLabel: 'Legal, management and professional fees',       sa105Box: '27', group: 'box27_professional' },
  legal_fees:              { label: 'Legal Fees',              hmrcLabel: 'Legal, management and professional fees',       sa105Box: '27', group: 'box27_professional' },
  accountancy_fees:        { label: 'Accountancy fees',        hmrcLabel: 'Legal, management and professional fees',       sa105Box: '27', group: 'box27_professional' },

  // Box 28 — Cost of services provided including wages
  premise_running_costs:   { label: 'Cost of services provided (incl wages)', hmrcLabel: 'Cost of services provided, including wages', sa105Box: '28', group: 'box28_services' },
  telephone:               { label: 'Telephone (business)',    hmrcLabel: 'Cost of services provided, including wages',   sa105Box: '28', group: 'box28_services' },

  // Box 29 — Other allowable property expenses
  bank_charges:            { label: 'Bank Charges',            hmrcLabel: 'Other allowable property expenses',             sa105Box: '29', group: 'box29_other' },
  travel_costs:            { label: 'Travel Costs',            hmrcLabel: 'Other allowable property expenses',             sa105Box: '29', group: 'box29_other' },
  other:                   { label: 'Other',                   hmrcLabel: 'Other allowable property expenses',             sa105Box: '29', group: 'box29_other' },

  // Box 36 — Costs of replacing domestic items (residential lettings only)
  white_goods:             { label: 'Replacing domestic items (white goods, sofas, curtains)', hmrcLabel: 'Costs of replacing domestic items', sa105Box: '36', group: 'box36_domestic_items' },

  // Box 44 — Residential BTL finance costs (Section 24 — 20% tax credit only, NOT deducted)
  btl_mortgage_interest:   { label: 'Residential BTL Mortgage Interest', hmrcLabel: 'Residential property finance costs',   sa105Box: '44', group: 'box44_residential_finance', section24: true },
  other_finance_costs:     { label: 'Other residential finance costs',   hmrcLabel: 'Residential property finance costs',   sa105Box: '44', group: 'box44_residential_finance', section24: true },

  // Rent a Room — exempt relief, NOT a normal expense line (kept for legacy rows)
  rent_a_room_expense:     { label: 'Rent a Room (relief, legacy)', hmrcLabel: 'Rent a Room exempt relief',                sa105Box: '37', group: 'box29_other' },

  // Box 26 — Non-residential (commercial) property finance costs — fully deductible
  non_residential_finance_costs: { label: 'Non-residential finance costs (commercial let)', hmrcLabel: 'Non-residential property finance costs', sa105Box: '26', group: 'box26_non_residential_finance' },

  // Box 36 — Replacing domestic items (residential like-for-like) — kept separate from repairs
  replacing_domestic_items: { label: 'Replacing domestic items (like-for-like)', hmrcLabel: 'Costs of replacing domestic items', sa105Box: '36', group: 'box36_domestic_items' },

  // Box 10 — Private use adjustment (rare)
  private_use_adjustment:  { label: 'Private use adjustment',  hmrcLabel: 'Private use adjustment',                        sa105Box: '10', group: 'private_use' },
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
  income:                          { title: 'Rents and other income from property', box: 'Box 20' },
  tax_deducted:                    { title: 'Tax deducted at source',                box: 'Box 21', note: 'Memo only — never added to income.' },
  rent_a_room_relief:              { title: 'Rent a Room exempt relief',             box: 'Box 37', note: 'Separate scheme — not combined with SA105 totals.' },
  box24_rents_rates_insurance:     { title: 'Rent, rates, insurance and ground rents', box: 'Box 24' },
  box25_repairs:                   { title: 'Property repairs and maintenance',      box: 'Box 25', note: 'Like-for-like only. Improvements are capital (CGT, not deductible).' },
  box26_non_residential_finance:   { title: 'Non-residential property finance costs', box: 'Box 26', note: 'Fully deductible for commercial lets.' },
  box27_professional:              { title: 'Legal, management and professional fees', box: 'Box 27' },
  box28_services:                  { title: 'Costs of services provided (incl wages)', box: 'Box 28' },
  box29_other:                     { title: 'Other allowable property expenses',     box: 'Box 29' },
  box36_domestic_items:            { title: 'Costs of replacing domestic items',     box: 'Box 36', note: 'Residential lettings — like-for-like replacements only.' },
  box44_residential_finance:       { title: 'Residential property finance costs',    box: 'Box 44', note: 'Section 24 — 20% tax credit only, not deducted.' },
  private_use:                     { title: 'Private use adjustment',                box: 'Box 10' },
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
  is_recurring?: boolean
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

export function prevQuarterId(id: string): string {
  const m = id.match(/^(\d{4})Q([1-4])$/)
  if (!m) return id
  const ty = Number(m[1])
  const q = Number(m[2])
  if (q === 1) return `${ty - 1}Q4`
  return `${ty}Q${q - 1}`
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
  /** Deductible expense groups only — NOT Section 24. */
  expensesDeductible: MtdCategoryRow<MtdExpenseCategory>[]
  /** Box 44 — residential finance costs, kept separate per Section 24. */
  section24: MtdCategoryRow<MtdExpenseCategory>[]
  /** All expenses including Section 24 (raw totals only). */
  expenses: MtdCategoryRow<MtdExpenseCategory>[]
  /** SA105 Box 20 (+22, +23) — taxable rental income. Excludes Box 21 tax deducted and Box 37 Rent a Room. */
  totalIncome: number
  /** SA105 Box 21 — tax already deducted at source. Memo only, NOT summed into income. */
  totalTaxDeducted: number
  /** SA105 Box 37 — Rent a Room exempt relief. Separate scheme, NOT summed into income. */
  totalRentARoomRelief: number
  /** Deductible expenses only. Use for taxable profit. */
  totalDeductibleExpenses: number
  /** Section 24 total (20% tax credit, not deducted). */
  totalSection24: number
  totalExpenses: number
  /** Box 20 income minus deductible expenses. Section 24 credit applied later. */
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

  // Per HMRC: totalIncome is Box 20 (+22+23) only. Box 21 (tax deducted) and
  // Box 37 (Rent a Room exempt relief) are reported separately and NOT summed
  // into taxable income.
  const totalIncome = income
    .filter((r) => r.group === 'income')
    .reduce((s, r) => s + r.total, 0)
  const totalTaxDeducted = income
    .filter((r) => r.category === 'tax_deducted')
    .reduce((s, r) => s + r.total, 0)
  const totalRentARoomRelief = income
    .filter((r) => r.category === 'rent_a_room')
    .reduce((s, r) => s + r.total, 0)

  const totalDeductibleExpenses = expensesDeductible.reduce((s, r) => s + r.total, 0)
  const totalSection24 = section24.reduce((s, r) => s + r.total, 0)
  const totalExpenses = totalDeductibleExpenses + totalSection24

  const groupKeys: MtdGroupKey[] = [
    'box24_rents_rates_insurance',
    'box25_repairs',
    'box27_professional',
    'box28_services',
    'box29_other',
    'box36_domestic_items',
    'box26_non_residential_finance',
    'private_use',
    'box44_residential_finance',
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
    totalTaxDeducted,
    totalRentARoomRelief,
    totalExpenses,
    net: totalIncome - totalDeductibleExpenses,
    groupTotals,
  }
}
