// MTD xlsx export matching the HMRC ITSA property template format.
// Header layout mirrors the spreadsheet supplied by the client's accountant:
//   row 1-2: Property identification + period
//   row 4+:  Income block, then Expense block, then Loss/Profit
import ExcelJS from 'exceljs'
import { INCOME_LABEL, EXPENSE_LABEL, type MtdTransaction, type MtdQuarter, summariseQuarter } from './mtd'

export async function buildMtdXlsx(input: {
  property: { nickname: string; address: string; furnished?: boolean }
  quarter: MtdQuarter
  transactions: MtdTransaction[]
}): Promise<Buffer> {
  const summary = summariseQuarter(input.property.nickname, input.transactions, input.quarter)

  // The summariseQuarter helper expects matching property_id — replay with the real id from the first tx
  const propId = input.transactions[0]?.property_id ?? input.property.nickname
  const s = summariseQuarter(propId, input.transactions, input.quarter)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Blake UK Homes'
  wb.created = new Date()

  const ws = wb.addWorksheet('Property', { views: [{ state: 'frozen', ySplit: 3 }] })

  // Column widths
  ws.columns = [{ width: 38 }, { width: 18 }, { width: 18 }]

  // Title block
  ws.getCell('A1').value = 'UK Property Income and Expenses'
  ws.getCell('A1').font = { bold: true, size: 14 }
  ws.getCell('A2').value = `Period Ended: ${input.quarter.end.toLocaleDateString('en-GB', { dateStyle: 'long' })}`
  ws.getCell('A2').font = { italic: true, color: { argb: 'FF6B7280' } }
  ws.getCell('A3').value = `Address of Property: ${input.property.address}`
  ws.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }

  // Property Furnished header
  ws.getCell('A5').value = `Property ${input.property.furnished ? 'Furnished' : ''}`.trim() || 'Property'
  ws.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B8E47' } }
  ws.getCell('A5').font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getCell('B5').value = '£'
  ws.getCell('B5').alignment = { horizontal: 'right' }
  ws.getCell('B5').font = { bold: true, underline: true }

  // Income section
  let row = 6
  ws.getCell(`A${row}`).value = 'Income'
  ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } }
  ws.getCell(`A${row}`).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row++

  // Always render the 4 HMRC income categories, even if zero
  const incomeRows: { key: string; label: string }[] = [
    { key: 'other_income',  label: 'Other Income' },
    { key: 'period_amount', label: 'Period Amount' },
    { key: 'rent_a_room',   label: 'Rent A Room' },
    { key: 'tax_deducted',  label: 'Tax Deducted' },
  ]
  for (const r of incomeRows) {
    const found = s.income.find((x) => x.category === r.key as any)
    ws.getCell(`B${row}`).value = r.label
    ws.getCell(`C${row}`).value = found?.total ?? 0
    ws.getCell(`C${row}`).numFmt = '#,##0.00'
    row++
  }
  ws.getCell(`C${row}`).value = s.totalIncome
  ws.getCell(`C${row}`).numFmt = '#,##0.00'
  ws.getCell(`C${row}`).font = { bold: true }
  ws.getCell(`C${row}`).border = { top: { style: 'thin' }, bottom: { style: 'double' } }
  row += 2

  // Expense section
  ws.getCell(`A${row}`).value = 'Expenses'
  ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } }
  ws.getCell(`A${row}`).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row++

  // 24 HMRC expense categories — order matches the template
  const expenseRows: { key: string; label: string }[] = [
    { key: 'other',                     label: 'Other' },
    { key: 'council_tax',               label: 'Council Tax' },
    { key: 'light_and_heat',            label: 'Light & Heat' },
    { key: 'water_rates',               label: 'Water Rates' },
    { key: 'white_goods',               label: 'White goods' },
    { key: 'insurance',                 label: 'Insurance' },
    { key: 'window_cleaning',           label: 'Window Cleaning' },
    { key: 'general_cleaning',          label: 'General Cleaning' },
    { key: 'oven_cleaning',             label: 'Oven Cleaning' },
    { key: 'gardening',                 label: 'Gardening' },
    { key: 'premise_running_costs',     label: 'Premise Running Costs' },
    { key: 'telephone',                 label: 'Telephone' },
    { key: 'professional_fees',         label: 'Professional Fees' },
    { key: 'legal_fees',                label: 'Legal Fees' },
    { key: 'rent_a_room_expense',       label: 'Rent A Room' },
    { key: 'redecorating',              label: 'Redecorating' },
    { key: 'ground_rent',               label: 'Ground Rent' },
    { key: 'service_charges',           label: 'Service Charges' },
    { key: 'repairs_and_maintenance',   label: 'Repairs and Maintenance' },
    { key: 'btl_mortgage_interest',     label: 'Residential BTL Mortgage Interest' },
    { key: 'other_finance_costs',       label: 'Other finance costs' },
    { key: 'accountancy_fees',          label: 'Accountancy fees' },
    { key: 'bank_charges',              label: 'Bank Charges' },
    { key: 'travel_costs',              label: 'Travel Costs' },
  ]
  for (const r of expenseRows) {
    const found = s.expenses.find((x) => x.category === r.key as any)
    ws.getCell(`B${row}`).value = r.label
    ws.getCell(`C${row}`).value = found?.total ?? 0
    ws.getCell(`C${row}`).numFmt = '#,##0.00'
    row++
  }
  ws.getCell(`C${row}`).value = s.totalExpenses
  ws.getCell(`C${row}`).numFmt = '#,##0.00'
  ws.getCell(`C${row}`).font = { bold: true }
  ws.getCell(`C${row}`).border = { top: { style: 'thin' }, bottom: { style: 'double' } }
  row += 2

  // Loss / Profit
  ws.getCell(`A${row}`).value = s.net >= 0 ? 'Profit' : 'Loss'
  ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } }
  ws.getCell(`A${row}`).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getCell(`C${row}`).value = s.net
  ws.getCell(`C${row}`).numFmt = '#,##0.00;-#,##0.00'
  ws.getCell(`C${row}`).font = { bold: true, color: { argb: s.net >= 0 ? 'FF15803D' : 'FFB91C1C' } }
  ws.getCell(`C${row}`).border = { top: { style: 'thin' }, bottom: { style: 'thin' } }

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
    { header: 'Kind', width: 12 },
    { header: 'Amount', width: 14 },
    { header: 'Supplier / Payer', width: 28 },
  ]
  ws.getRow(1).font = { bold: true }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }

  for (const t of input.transactions) {
    const label = t.kind === 'income'
      ? INCOME_LABEL[t.income_category!]
      : EXPENSE_LABEL[t.expense_category!]
    ws.addRow([
      new Date(t.transaction_date),
      t.description ?? '',
      label,
      t.kind,
      Number(t.amount),
      t.supplier_or_payer ?? '',
    ])
  }
  ws.getColumn(1).numFmt = 'dd/mm/yyyy'
  ws.getColumn(5).numFmt = '#,##0.00'

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf as ArrayBuffer)
}
