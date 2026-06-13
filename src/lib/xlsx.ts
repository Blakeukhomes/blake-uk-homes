// MTD xlsx export — Nick's accountant XL layout, grouped by SA105 box.
// Income block, then Group 1-5 deductible expenses (Box 6 / 8 / 9 / 10) with
// subtotals, then a clearly labelled Section 24 (Box 44) block that is NOT
// included in the deductible total. Profit/Loss line uses deductible expenses
// only — the 20% Section 24 credit is reported separately on SA105 Box 44.
import ExcelJS from 'exceljs'
import {
  INCOME_LABEL, EXPENSE_LABEL, EXPENSE_META, INCOME_META, GROUP_LABEL,
  type MtdGroupKey, type MtdTransaction, type MtdQuarter, type MtdExpenseCategory, type MtdIncomeCategory,
  summariseQuarter,
} from './mtd'

const HEADER_FILL = 'FF374151'           // dark grey
const SECTION24_FILL = 'FFFEE2E2'        // light red (warning)
const SECTION24_BAND = 'FFB91C1C'        // red band
const SUBTOTAL_FILL = 'FFF3F4F6'         // light grey
const HIGHLIGHT_AMBER = 'FFFEF3C7'

const ORDER_INCOME: MtdIncomeCategory[] = [
  'period_amount', 'other_income', 'rent_a_room', 'lease_premiums', 'tax_deducted',
]

const GROUPS_IN_ORDER: { key: MtdGroupKey; categories: MtdExpenseCategory[] }[] = [
  { key: 'group1_repairs', categories: [
    'repairs_and_maintenance', 'redecorating', 'white_goods', 'window_cleaning',
    'general_cleaning', 'oven_cleaning', 'gardening', 'insurance', 'ground_rent', 'service_charges',
  ] },
  { key: 'group2_services', categories: [
    'council_tax', 'light_and_heat', 'water_rates', 'premise_running_costs', 'telephone',
  ] },
  { key: 'group4_professional', categories: [
    'professional_fees', 'legal_fees', 'accountancy_fees', 'bank_charges',
  ] },
  { key: 'group5_other', categories: [
    'travel_costs', 'rent_a_room_expense', 'other',
  ] },
  { key: 'private_use', categories: [
    'private_use_adjustment',
  ] },
]

const SECTION24_CATEGORIES: MtdExpenseCategory[] = ['btl_mortgage_interest', 'other_finance_costs']

export async function buildMtdXlsx(input: {
  property: {
    nickname: string; address: string;
    furnished?: boolean;
    property_income_allowance?: boolean;
    ownership_type?: 'personal' | 'limited_company';
    company_name?: string | null;
  }
  quarter: MtdQuarter
  transactions: MtdTransaction[]
}): Promise<Buffer> {
  const propId = input.transactions[0]?.property_id ?? input.property.nickname
  const s = summariseQuarter(propId, input.transactions, input.quarter)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Blake UK Homes'
  wb.created = new Date()

  const ws = wb.addWorksheet('SA105 Summary', { views: [{ state: 'frozen', ySplit: 3 }] })
  // 4 columns: Group | Category | SA105 Box | Amount
  ws.columns = [{ width: 34 }, { width: 38 }, { width: 12 }, { width: 16 }]

  // Title block
  ws.getCell('A1').value = 'UK Property Income and Expenses (MTD ITSA)'
  ws.getCell('A1').font = { bold: true, size: 14 }
  ws.getCell('A2').value = `Period: ${input.quarter.label} (ends ${input.quarter.end.toLocaleDateString('en-GB', { dateStyle: 'long' })})`
  ws.getCell('A2').font = { italic: true, color: { argb: 'FF6B7280' } }
  ws.getCell('A3').value = `Property: ${input.property.nickname} — ${input.property.address}`
  ws.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HIGHLIGHT_AMBER } }
  if (input.property.ownership_type === 'limited_company') {
    ws.getCell('A4').value = `Limited Company: ${input.property.company_name ?? 'Unnamed Ltd'}`
    ws.getCell('A4').font = { bold: true, color: { argb: 'FF6366F1' } }
  }

  // Property Income Allowance banner (if applicable)
  let row = 5
  if (input.property.property_income_allowance) {
    ws.mergeCells(`A${row}:D${row}`)
    ws.getCell(`A${row}`).value =
      '£1,000 Property Income Allowance claimed for this property — expenses are NOT deductible. Box 5.1.'
    ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTION24_FILL } }
    ws.getCell(`A${row}`).font = { bold: true, color: { argb: SECTION24_BAND } }
    ws.getCell(`A${row}`).alignment = { vertical: 'middle' }
    row += 2
  }

  // Income block
  ws.mergeCells(`A${row}:D${row}`)
  ws.getCell(`A${row}`).value = 'INCOME'
  ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
  ws.getCell(`A${row}`).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row++
  ws.getCell(`A${row}`).value = ''
  ws.getCell(`B${row}`).value = 'Category'
  ws.getCell(`C${row}`).value = 'SA105 Box'
  ws.getCell(`D${row}`).value = '£'
  ws.getRow(row).font = { bold: true }
  ws.getCell(`D${row}`).alignment = { horizontal: 'right' }
  row++

  for (const cat of ORDER_INCOME) {
    const meta = INCOME_META[cat]
    const found = s.income.find((r) => r.category === cat)
    ws.getCell(`B${row}`).value = meta.label
    ws.getCell(`C${row}`).value = `Box ${meta.sa105Box}`
    ws.getCell(`D${row}`).value = found?.total ?? 0
    ws.getCell(`D${row}`).numFmt = '#,##0.00'
    row++
  }
  // Total income
  ws.getCell(`B${row}`).value = 'Total income'
  ws.getCell(`B${row}`).font = { bold: true }
  ws.getCell(`D${row}`).value = s.totalIncome
  ws.getCell(`D${row}`).numFmt = '#,##0.00'
  ws.getCell(`D${row}`).font = { bold: true }
  ws.getCell(`D${row}`).border = { top: { style: 'thin' }, bottom: { style: 'double' } }
  row += 2

  // Group 1-5 deductible expenses
  ws.mergeCells(`A${row}:D${row}`)
  ws.getCell(`A${row}`).value = 'DEDUCTIBLE EXPENSES (used to calculate taxable profit)'
  ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
  ws.getCell(`A${row}`).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row++

  for (const grp of GROUPS_IN_ORDER) {
    const meta = GROUP_LABEL[grp.key]
    // Group header row
    ws.getCell(`A${row}`).value = `${meta.title} (${meta.box})`
    ws.getCell(`A${row}`).font = { bold: true }
    ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBTOTAL_FILL } }
    row++

    let groupTotal = 0
    for (const cat of grp.categories) {
      const found = s.expensesDeductible.find((r) => r.category === cat)
      const m = EXPENSE_META[cat]
      ws.getCell(`B${row}`).value = m.label
      ws.getCell(`C${row}`).value = `Box ${m.sa105Box}`
      ws.getCell(`D${row}`).value = found?.total ?? 0
      ws.getCell(`D${row}`).numFmt = '#,##0.00'
      groupTotal += found?.total ?? 0
      row++
    }
    ws.getCell(`B${row}`).value = `Subtotal — ${meta.title}`
    ws.getCell(`B${row}`).font = { italic: true }
    ws.getCell(`D${row}`).value = groupTotal
    ws.getCell(`D${row}`).numFmt = '#,##0.00'
    ws.getCell(`D${row}`).font = { italic: true }
    ws.getCell(`D${row}`).border = { top: { style: 'thin' } }
    row += 2
  }

  ws.getCell(`B${row}`).value = 'TOTAL DEDUCTIBLE EXPENSES'
  ws.getCell(`B${row}`).font = { bold: true }
  ws.getCell(`D${row}`).value = s.totalDeductibleExpenses
  ws.getCell(`D${row}`).numFmt = '#,##0.00'
  ws.getCell(`D${row}`).font = { bold: true }
  ws.getCell(`D${row}`).border = { top: { style: 'thin' }, bottom: { style: 'double' } }
  row += 2

  // Profit / Loss using DEDUCTIBLE expenses only
  ws.getCell(`A${row}`).value = s.net >= 0 ? 'TAXABLE PROFIT (income minus deductible expenses)' : 'TAXABLE LOSS'
  ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
  ws.getCell(`A${row}`).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getCell(`D${row}`).value = s.net
  ws.getCell(`D${row}`).numFmt = '#,##0.00;-#,##0.00'
  ws.getCell(`D${row}`).font = { bold: true, color: { argb: s.net >= 0 ? 'FF15803D' : 'FFB91C1C' } }
  ws.getCell(`D${row}`).border = { top: { style: 'thin' }, bottom: { style: 'thin' } }
  row += 3

  // Section 24 — separate block (personal only)
  if (input.property.ownership_type !== 'limited_company') {
  ws.mergeCells(`A${row}:D${row}`)
  ws.getCell(`A${row}`).value = 'SECTION 24 — RESIDENTIAL FINANCE COSTS (SA105 Box 44)'
  ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTION24_BAND } }
  ws.getCell(`A${row}`).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row++
  ws.mergeCells(`A${row}:D${row}`)
  ws.getCell(`A${row}`).value =
    'Mortgage interest and finance costs are NOT a direct deduction under UK Section 24. ' +
    'They give a 20% basic-rate tax credit instead. Reported separately on SA105 Box 44 — never merged with Box 6.'
  ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTION24_FILL } }
  ws.getCell(`A${row}`).font = { color: { argb: SECTION24_BAND }, italic: true }
  ws.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'middle' }
  ws.getRow(row).height = 32
  row++

  for (const cat of SECTION24_CATEGORIES) {
    const found = s.section24.find((r) => r.category === cat)
    const m = EXPENSE_META[cat]
    ws.getCell(`B${row}`).value = m.label
    ws.getCell(`C${row}`).value = `Box ${m.sa105Box}`
    ws.getCell(`D${row}`).value = found?.total ?? 0
    ws.getCell(`D${row}`).numFmt = '#,##0.00'
    row++
  }
  ws.getCell(`B${row}`).value = 'Section 24 total (Box 44)'
  ws.getCell(`B${row}`).font = { bold: true, color: { argb: SECTION24_BAND } }
  ws.getCell(`D${row}`).value = s.totalSection24
  ws.getCell(`D${row}`).numFmt = '#,##0.00'
  ws.getCell(`D${row}`).font = { bold: true, color: { argb: SECTION24_BAND } }
  ws.getCell(`D${row}`).border = { top: { style: 'thin' }, bottom: { style: 'double' } }
  row++
  ws.getCell(`B${row}`).value = '20% tax credit (Section 24)'
  ws.getCell(`D${row}`).value = s.totalSection24 * 0.20
  ws.getCell(`D${row}`).numFmt = '#,##0.00'
  ws.getCell(`D${row}`).font = { italic: true, color: { argb: SECTION24_BAND } }
  row += 1

  }

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf as ArrayBuffer)
}

/** Transactions-detail sheet (the second tab of the accountant's template). */
export async function buildMtdTransactionsXlsx(input: {
  property: { nickname: string }
  transactions: MtdTransaction[]
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Transactions')
  ws.columns = [
    { header: 'Transaction Date', width: 18 },
    { header: 'Description', width: 40 },
    { header: 'Category', width: 30 },
    { header: 'SA105 Box', width: 12 },
    { header: 'Section 24?', width: 12 },
    { header: 'Kind', width: 12 },
    { header: 'Amount', width: 14 },
    { header: 'Supplier / Payer', width: 28 },
  ]
  ws.getRow(1).font = { bold: true }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }

  for (const t of input.transactions) {
    let label = ''
    let sa105 = ''
    let section24 = ''
    if (t.kind === 'income' && t.income_category) {
      label = INCOME_LABEL[t.income_category]
      sa105 = `Box ${INCOME_META[t.income_category].sa105Box}`
    } else if (t.kind === 'expense' && t.expense_category) {
      const m = EXPENSE_META[t.expense_category]
      label = EXPENSE_LABEL[t.expense_category]
      sa105 = `Box ${m.sa105Box}`
      section24 = m.section24 ? 'YES' : ''
    }
    ws.addRow([
      new Date(t.transaction_date),
      t.description ?? '',
      label, sa105, section24,
      t.kind, Number(t.amount), t.supplier_or_payer ?? '',
    ])
  }
  ws.getColumn(1).numFmt = 'dd/mm/yyyy'
  ws.getColumn(7).numFmt = '#,##0.00'

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf as ArrayBuffer)
}
