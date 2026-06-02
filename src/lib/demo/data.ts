// Sample portfolio data for demo mode. Hydrates every page without a backend.
import { addDays, addMonths, format, startOfMonth, subDays, subMonths } from 'date-fns'

const today = new Date()
const iso = (d: Date) => d.toISOString()
const ymd = (d: Date) => format(d, 'yyyy-MM-dd')

export const DEMO_USER_ID = 'demo-owner-1'

const PROP_1 = 'demo-prop-1'
const PROP_2 = 'demo-prop-2'
const PROP_3 = 'demo-prop-3'

const TEN_1 = 'demo-tenant-1'
const TEN_2 = 'demo-tenant-2'

const FAULT_1 = 'demo-fault-1'
const FAULT_2 = 'demo-fault-2'

// ---- profiles ----
const profiles = [
  { id: DEMO_USER_ID, email: 'demo@blakeukhomes.local', full_name: 'Sam Blake', role: 'owner', phone: '07700 900100', created_at: iso(subMonths(today, 9)), updated_at: iso(today) },
]

// ---- properties ----
const properties = [
  {
    id: PROP_1, owner_id: DEMO_USER_ID,
    nickname: 'Hollow Lane Flat',
    address_line_1: '37 Hollow Lane', address_line_2: 'Flat 3',
    city: 'Manchester', postcode: 'M14 6PQ',
    property_type: 'flat', bedrooms: 2,
    monthly_rent: 1450, rent_due_day: 1,
    status: 'tenanted', hero_image_url: null, notes: null,
    created_at: iso(subMonths(today, 8)), updated_at: iso(today),
  },
  {
    id: PROP_2, owner_id: DEMO_USER_ID,
    nickname: 'Saxon Court',
    address_line_1: '12 Saxon Court', address_line_2: null,
    city: 'Leeds', postcode: 'LS6 1AB',
    property_type: 'house', bedrooms: 3,
    monthly_rent: 1875, rent_due_day: 15,
    status: 'tenanted', hero_image_url: null, notes: null,
    created_at: iso(subMonths(today, 14)), updated_at: iso(today),
  },
  {
    id: PROP_3, owner_id: DEMO_USER_ID,
    nickname: 'Marlow Studio',
    address_line_1: '4 Marlow Mews', address_line_2: null,
    city: 'Sheffield', postcode: 'S1 4AX',
    property_type: 'studio', bedrooms: 0,
    monthly_rent: 875, rent_due_day: 1,
    status: 'vacant', hero_image_url: null, notes: 'Awaiting redecoration before re-let.',
    created_at: iso(subMonths(today, 3)), updated_at: iso(today),
  },
]

// ---- tenants ----
const tenants = [
  {
    id: TEN_1, property_id: PROP_1, full_name: 'Jasmin Patel',
    email: 'jasmin.patel@example.com', phone: '07700 900201',
    auth_user_id: null, portal_token: 'demo-token-patel-37hollow',
    tenancy_start: ymd(subMonths(today, 7)), tenancy_end: ymd(addMonths(today, 5)),
    deposit_amount: 1673, deposit_scheme: 'DPS', is_active: true,
    created_at: iso(subMonths(today, 7)),
    // joined for portal queries
    properties: { nickname: 'Hollow Lane Flat', address_line_1: '37 Hollow Lane', city: 'Manchester', postcode: 'M14 6PQ' },
  },
  {
    id: TEN_2, property_id: PROP_2, full_name: 'Tom & Aleksandra Walsh',
    email: 'walsh.family@example.com', phone: '07700 900202',
    auth_user_id: null, portal_token: 'demo-token-walsh-saxon',
    tenancy_start: ymd(subMonths(today, 13)), tenancy_end: ymd(subMonths(today, 1)),
    deposit_amount: 2161, deposit_scheme: 'mydeposits', is_active: true,
    created_at: iso(subMonths(today, 13)),
    properties: { nickname: 'Saxon Court', address_line_1: '12 Saxon Court', city: 'Leeds', postcode: 'LS6 1AB' },
  },
]

// ---- compliance certificates ----
// Mix of valid, due-soon, and one expired to populate alerts
const compliance_certificates = [
  // Prop 1, all valid except gas safety due soon
  { id: 'cert-1', property_id: PROP_1, type: 'gas_safety',
    completed_on: ymd(subDays(today, 310)), expires_on: ymd(addDays(today, 55)),
    document_id: null, issued_by: 'Northwood Gas Ltd', reference: 'NG-2025-4421', notes: null,
    created_at: iso(subDays(today, 310)) },
  { id: 'cert-2', property_id: PROP_1, type: 'eicr',
    completed_on: ymd(subMonths(today, 18)), expires_on: ymd(addMonths(today, 42)),
    document_id: null, issued_by: 'Volt Sparks', reference: 'VS-2024-103', notes: null,
    created_at: iso(subMonths(today, 18)) },
  { id: 'cert-3', property_id: PROP_1, type: 'epc',
    completed_on: ymd(subMonths(today, 36)), expires_on: ymd(addMonths(today, 84)),
    document_id: null, issued_by: 'EnergyAssess UK', reference: 'EA-2023-9912', notes: 'Band C' as any,
    created_at: iso(subMonths(today, 36)) },
  { id: 'cert-4', property_id: PROP_1, type: 'buildings_insurance',
    completed_on: ymd(subMonths(today, 6)), expires_on: ymd(addMonths(today, 6)),
    document_id: null, issued_by: 'Aviva', reference: 'BI-AV-77123', notes: null,
    created_at: iso(subMonths(today, 6)) },

  // Prop 2, gas safety EXPIRED to show danger state
  { id: 'cert-5', property_id: PROP_2, type: 'gas_safety',
    completed_on: ymd(subDays(today, 400)), expires_on: ymd(subDays(today, 35)),
    document_id: null, issued_by: 'Yorkshire Gas Services', reference: 'YGS-2024-880', notes: null,
    created_at: iso(subDays(today, 400)) },
  { id: 'cert-6', property_id: PROP_2, type: 'eicr',
    completed_on: ymd(subMonths(today, 30)), expires_on: ymd(addMonths(today, 30)),
    document_id: null, issued_by: 'Volt Sparks', reference: 'VS-2023-440', notes: null,
    created_at: iso(subMonths(today, 30)) },
  { id: 'cert-7', property_id: PROP_2, type: 'buildings_insurance',
    completed_on: ymd(subMonths(today, 10)), expires_on: ymd(addMonths(today, 2)),
    document_id: null, issued_by: 'Direct Line', reference: 'BI-DL-44023', notes: null,
    created_at: iso(subMonths(today, 10)) },

  // Prop 3, only EPC, missing others (so dashboard shows missing state)
  { id: 'cert-8', property_id: PROP_3, type: 'epc',
    completed_on: ymd(subMonths(today, 12)), expires_on: ymd(addMonths(today, 108)),
    document_id: null, issued_by: 'EnergyAssess UK', reference: 'EA-2025-3301', notes: 'Band D' as any,
    created_at: iso(subMonths(today, 12)) },
]

// ---- rent payments ----
// 6 months for the two tenanted properties, mostly paid, one late, one missing
function makePayments(propertyId: string, tenantId: string, monthlyRent: number, dueDay: number) {
  const out: any[] = []
  for (let i = 5; i >= 0; i--) {
    const period = startOfMonth(subMonths(today, i))
    const due = new Date(period); due.setDate(Math.min(dueDay, 28))
    let status: 'paid' | 'partial' | 'late' | 'missing' = 'paid'
    let amount_paid = monthlyRent
    let received_on: string | null = ymd(addDays(due, 1))
    let notes: string | null = null
    if (i === 0) { status = 'late'; amount_paid = 0; received_on = null; notes = 'Tenant messaged saying salary delayed.' }
    if (i === 2) { status = 'partial'; amount_paid = Math.round(monthlyRent * 0.6); received_on = ymd(addDays(due, 3)); notes = 'Partial, balance promised next week.' }
    out.push({
      id: `pay-${propertyId}-${i}`,
      property_id: propertyId, tenant_id: tenantId,
      period_start: ymd(period), due_date: ymd(due),
      amount_due: monthlyRent, amount_paid, received_on,
      status, notes,
      created_at: iso(period), updated_at: iso(today),
    })
  }
  return out
}
const rent_payments = [
  ...makePayments(PROP_1, TEN_1, 1450, 1),
  ...makePayments(PROP_2, TEN_2, 1875, 15),
]

// ---- maintenance tasks ----
const maintenance_tasks = [
  { id: 'mt-1', property_id: PROP_1, kind: 'inspection',
    title: 'Quarterly inspection', description: 'Standard 120-day inspection visit.',
    due_on: ymd(addDays(today, 21)), completed_on: null, recur_days: 120, notes: null,
    created_at: iso(subDays(today, 99)) },
  { id: 'mt-2', property_id: PROP_2, kind: 'inspection',
    title: 'Quarterly inspection', description: '',
    due_on: ymd(subDays(today, 4)), completed_on: null, recur_days: 120, notes: null,
    created_at: iso(subDays(today, 124)) },
  { id: 'mt-3', property_id: PROP_1, kind: 'task',
    title: 'Service boiler, annual', description: 'Booked with Northwood Gas.',
    due_on: ymd(addDays(today, 9)), completed_on: null, recur_days: null, notes: null,
    priority: 'high', status: 'scheduled', contractor_id: 'ct-4',
    created_at: iso(subDays(today, 4)) },
  { id: 'mt-5', property_id: PROP_1, kind: 'task',
    title: 'Repair leaking kitchen tap', description: 'Tenant reported dripping when fully closed.',
    due_on: ymd(addDays(today, 1)), completed_on: null, recur_days: null, notes: null,
    priority: 'urgent', status: 'in_progress', contractor_id: 'ct-3',
    created_at: iso(subDays(today, 2)) },
  { id: 'mt-6', property_id: PROP_2, kind: 'task',
    title: 'Boiler fault code F22', description: 'Hot water out. Engineer scheduled for tomorrow.',
    due_on: ymd(addDays(today, 1)), completed_on: null, recur_days: null, notes: null,
    priority: 'urgent', status: 'open', contractor_id: 'ct-4',
    created_at: iso(today) },
  { id: 'mt-4', property_id: PROP_2, kind: 'inspection',
    title: 'Quarterly inspection', description: '',
    due_on: ymd(subDays(today, 124)), completed_on: ymd(subDays(today, 123)),
    recur_days: 120, notes: 'All in order. Two minor scuffs in hallway noted.',
    created_at: iso(subDays(today, 240)) },
]

// ---- fault reports ----
const fault_reports = [
  {
    id: FAULT_1, reference: 'FR-3A92B1F0',
    property_id: PROP_1, tenant_id: TEN_1,
    category: 'Plumbing', severity: 'standard',
    description: 'Kitchen tap drips constantly even when fully closed. Started two days ago.',
    reporter_name: 'Jasmin Patel', reporter_phone: '07700 900201', reporter_email: 'jasmin.patel@example.com',
    current_state: 'contractor_booked',
    reported_at: iso(subDays(today, 2)),
    resolved_at: null,
    // joined fields for fault detail page
    properties: { nickname: 'Hollow Lane Flat', address_line_1: '37 Hollow Lane', city: 'Manchester', postcode: 'M14 6PQ' },
    tenants: { full_name: 'Jasmin Patel', email: 'jasmin.patel@example.com', phone: '07700 900201' },
  },
  {
    id: FAULT_2, reference: 'FR-7C04D2E1',
    property_id: PROP_2, tenant_id: TEN_2,
    category: 'Heating / Boiler', severity: 'urgent',
    description: 'No hot water since this morning. Boiler showing fault code F22.',
    reporter_name: 'Tom Walsh', reporter_phone: '07700 900202', reporter_email: 'walsh.family@example.com',
    current_state: 'reported',
    reported_at: iso(subDays(today, 0)),
    resolved_at: null,
    properties: { nickname: 'Saxon Court', address_line_1: '12 Saxon Court', city: 'Leeds', postcode: 'LS6 1AB' },
    tenants: { full_name: 'Tom & Aleksandra Walsh', email: 'walsh.family@example.com', phone: '07700 900202' },
  },
]

// ---- fault events (court-evidence chain) ----
const fault_events = [
  { id: 'fe-1', fault_id: FAULT_1, occurred_at: iso(subDays(today, 2)),
    actor_role: 'tenant', actor_name: 'Jasmin Patel', state: 'reported',
    note: 'Fault reported via portal. 3 photos, 1 video attached.', created_at: iso(subDays(today, 2)) },
  { id: 'fe-2', fault_id: FAULT_1, occurred_at: iso(subDays(today, 2)),
    actor_role: 'owner', actor_name: 'Blake UK Homes (auto)', state: 'acknowledged',
    note: 'System auto-acknowledgement on receipt.', created_at: iso(subDays(today, 2)) },
  { id: 'fe-3', fault_id: FAULT_1, occurred_at: iso(subDays(today, 1)),
    actor_role: 'owner', actor_name: 'Sam Blake', state: 'contractor_booked',
    note: 'Booked O\'Connor Plumbing for tomorrow 10:00–12:00.', created_at: iso(subDays(today, 1)) },

  { id: 'fe-4', fault_id: FAULT_2, occurred_at: iso(subDays(today, 0)),
    actor_role: 'tenant', actor_name: 'Tom Walsh', state: 'reported',
    note: 'Fault reported via portal. 2 photos, 1 video attached.', created_at: iso(today) },
  { id: 'fe-5', fault_id: FAULT_2, occurred_at: iso(subDays(today, 0)),
    actor_role: 'owner', actor_name: 'Blake UK Homes (auto)', state: 'acknowledged',
    note: 'System auto-acknowledgement on receipt.', created_at: iso(today) },
]

// ---- contractor bookings ----
const contractor_bookings = [
  { id: 'cb-1', fault_id: FAULT_1, property_id: PROP_1,
    contractor_name: "O'Connor Plumbing", trade: 'Plumber',
    phone: '07700 900303',
    scheduled_for: iso(addDays(today, 1)),
    notes: 'Will replace cartridge if needed.', created_at: iso(subDays(today, 1)) },
]

// ---- documents ----
const documents = [
  { id: 'doc-1', property_id: PROP_1, uploaded_by: DEMO_USER_ID,
    kind: 'tenancy_agreement', title: 'AST 2026, Patel',
    storage_path: 'demo/ast-patel.pdf', mime_type: 'application/pdf', file_size: 482_300,
    ai_summary: 'AST, 12 months from 1 Apr 2026. Rent £1,450 pcm due 1st. Deposit £1,673 (DPS, ref DPS-4XF92K). Pets not permitted without consent. Smoking prohibited. Tenant responsible for utilities and council tax. Break clause month 6 with 2 months\' notice.',
    ai_summary_at: iso(subMonths(today, 7)),
    visible_to_tenant: true, created_at: iso(subMonths(today, 7)) },
  { id: 'doc-2', property_id: PROP_1, uploaded_by: DEMO_USER_ID,
    kind: 'deposit_certificate', title: 'DPS deposit certificate, Patel',
    storage_path: 'demo/dps-patel.pdf', mime_type: 'application/pdf', file_size: 88_120,
    ai_summary: 'DPS custodial scheme. Deposit £1,673 received 24 Mar 2026. Reference DPS-4XF92K. Prescribed information served within 30 days.',
    ai_summary_at: iso(subMonths(today, 7)),
    visible_to_tenant: true, created_at: iso(subMonths(today, 7)) },
  { id: 'doc-3', property_id: PROP_1, uploaded_by: DEMO_USER_ID,
    kind: 'gas_safety', title: 'Gas Safety 2025, 37 Hollow Lane',
    storage_path: 'demo/gas-37hollow.pdf', mime_type: 'application/pdf', file_size: 142_300,
    ai_summary: 'Annual Gas Safety Certificate. Issued by Northwood Gas Ltd, engineer Mark Reeve (Gas Safe 401-321). No defects. Valid until 14 months from completion.',
    ai_summary_at: iso(subDays(today, 308)),
    visible_to_tenant: true, created_at: iso(subDays(today, 310)) },
  { id: 'doc-4', property_id: PROP_2, uploaded_by: DEMO_USER_ID,
    kind: 'tenancy_agreement', title: 'AST 2025, Walsh',
    storage_path: 'demo/ast-walsh.pdf', mime_type: 'application/pdf', file_size: 511_900,
    ai_summary: 'AST, 14 months from 1 Sep 2025. Rent £1,875 pcm due 15th. Deposit £2,161 (mydeposits, ref MD-77123). Pets permitted (one cat). Subletting prohibited.',
    ai_summary_at: iso(subMonths(today, 13)),
    visible_to_tenant: true, created_at: iso(subMonths(today, 13)) },
  { id: 'doc-5', property_id: PROP_2, uploaded_by: DEMO_USER_ID,
    kind: 'invoice', title: 'Boiler service, Yorkshire Gas',
    storage_path: 'demo/invoice-boiler.pdf', mime_type: 'application/pdf', file_size: 64_200,
    ai_summary: 'Yorkshire Gas Services. Annual boiler service for Saxon Court. £125 + VAT. Work performed 12 Apr 2026. No remedial work required.',
    ai_summary_at: iso(subDays(today, 30)),
    visible_to_tenant: false, created_at: iso(subDays(today, 30)) },
]

// ---- tenancy journey ----
const tenancy_journey = [
  ...['property_setup', 'tenant_onboarding', 'tenancy_agreement', 'deposit', 'move_in_inventory', 'keys_handed_over', 'active_tenancy']
    .map((step, i) => ({
      id: `tj-${PROP_1}-${step}`,
      property_id: PROP_1, tenant_id: TEN_1,
      step,
      completed_on: iso(subMonths(today, 7 - i)),
      landlord_sign: true, tenant_sign: step !== 'active_tenancy',
      notes: null,
      created_at: iso(subMonths(today, 7 - i)),
    })),
]

// ---- notifications ----
const notifications = [
  { id: 'n-1', user_id: DEMO_USER_ID, property_id: PROP_2, channel: 'email',
    subject: 'Gas Safety EXPIRED', body: 'Gas Safety for Saxon Court expired 35 days ago. Action required.',
    sent_at: iso(subDays(today, 1)), read_at: null, created_at: iso(subDays(today, 1)) },
  { id: 'n-2', user_id: DEMO_USER_ID, property_id: PROP_1, channel: 'push',
    subject: 'Fault reported', body: 'Plumbing, FR-3A92B1F0', sent_at: iso(subDays(today, 2)),
    read_at: iso(subDays(today, 2)), created_at: iso(subDays(today, 2)) },
  { id: 'n-3', user_id: DEMO_USER_ID, property_id: PROP_1, channel: 'email',
    subject: 'Gas Safety due in 55 days', body: 'Renew Gas Safety for Hollow Lane Flat.',
    sent_at: iso(subDays(today, 0)), read_at: null, created_at: iso(today) },
]

// ---- MTD transactions ----
// Mirrors the totals from the HMRC quarterly property template:
//   Income: 7,200  Expenses: 11,210  Loss: -4,010 for the current quarter on PROP_1
// Plus a lighter set on PROP_2 to show multi-property roll-up.
// Clamp to ~45 days back so transactions land in the current MTD quarter
// regardless of when the demo is viewed within a quarter.
function inCurrentQuarter(daysAgo: number) {
  const clamped = Math.min(45, Math.max(2, daysAgo))
  return ymd(subDays(today, clamped))
}

const mtd_transactions = [
  // PROP_1 — matches the template exactly
  { id: 'mtd-1',  property_id: PROP_1, document_id: null, kind: 'income',  income_category: 'period_amount', expense_category: null,
    transaction_date: inCurrentQuarter(60), amount: 6000.00, description: 'Q1 rent received', supplier_or_payer: 'Jasmin Patel', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 60)) },
  { id: 'mtd-2',  property_id: PROP_1, document_id: null, kind: 'income',  income_category: 'rent_a_room',  expense_category: null,
    transaction_date: inCurrentQuarter(45), amount: 500.00, description: 'Rent A Room scheme', supplier_or_payer: 'Lodger', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 45)) },
  { id: 'mtd-3',  property_id: PROP_1, document_id: null, kind: 'income',  income_category: 'other_income', expense_category: null,
    transaction_date: inCurrentQuarter(30), amount: 100.00, description: 'Parking permit reimbursement', supplier_or_payer: 'Tenant', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 30)) },
  { id: 'mtd-4',  property_id: PROP_1, document_id: null, kind: 'income',  income_category: 'tax_deducted', expense_category: null,
    transaction_date: inCurrentQuarter(20), amount: 600.00, description: 'Tax deducted at source', supplier_or_payer: 'Letting agent', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 20)) },

  // PROP_1 expenses (24 categories from the template)
  { id: 'mtd-5',  property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'other',
    transaction_date: inCurrentQuarter(70), amount: 1000.00, description: 'Misc property expenses', supplier_or_payer: 'Various', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 70)) },
  { id: 'mtd-6',  property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'council_tax',
    transaction_date: inCurrentQuarter(65), amount: 200.00, description: 'Council Tax (void period)', supplier_or_payer: 'Manchester City Council', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 65)) },
  { id: 'mtd-7',  property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'light_and_heat',
    transaction_date: inCurrentQuarter(60), amount: 150.00, description: 'Gas and electricity', supplier_or_payer: 'British Gas', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 60)) },
  { id: 'mtd-8',  property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'water_rates',
    transaction_date: inCurrentQuarter(58), amount: 90.00, description: 'Water rates', supplier_or_payer: 'United Utilities', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 58)) },
  { id: 'mtd-9',  property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'white_goods',
    transaction_date: inCurrentQuarter(55), amount: 368.00, description: 'Replacement washing machine', supplier_or_payer: 'AO', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 55)) },
  { id: 'mtd-10', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'insurance',
    transaction_date: inCurrentQuarter(52), amount: 162.00, description: 'Buildings insurance quarterly', supplier_or_payer: 'Aviva', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 52)) },
  { id: 'mtd-11', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'window_cleaning',
    transaction_date: inCurrentQuarter(50), amount: 70.00, description: 'Window cleaning', supplier_or_payer: 'Crystal Clean', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 50)) },
  { id: 'mtd-12', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'general_cleaning',
    transaction_date: inCurrentQuarter(48), amount: 50.00, description: 'End of tenancy clean', supplier_or_payer: 'Sparkle Services', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 48)) },
  { id: 'mtd-13', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'oven_cleaning',
    transaction_date: inCurrentQuarter(46), amount: 25.00, description: 'Oven deep clean', supplier_or_payer: 'OvenPros', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 46)) },
  { id: 'mtd-14', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'gardening',
    transaction_date: inCurrentQuarter(44), amount: 210.00, description: 'Gardener Q1', supplier_or_payer: 'Greenscape', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 44)) },
  { id: 'mtd-15', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'premise_running_costs',
    transaction_date: inCurrentQuarter(42), amount: 1100.00, description: 'Premises running costs', supplier_or_payer: 'Various', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 42)) },
  { id: 'mtd-16', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'telephone',
    transaction_date: inCurrentQuarter(40), amount: 32.00, description: 'Property line', supplier_or_payer: 'BT', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 40)) },
  { id: 'mtd-17', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'professional_fees',
    transaction_date: inCurrentQuarter(38), amount: 1200.00, description: 'Letting agent fees', supplier_or_payer: 'NorthLets', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 38)) },
  { id: 'mtd-18', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'legal_fees',
    transaction_date: inCurrentQuarter(36), amount: 50.00, description: 'Legal advice', supplier_or_payer: 'Cooper & Co Solicitors', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 36)) },
  { id: 'mtd-19', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'rent_a_room_expense',
    transaction_date: inCurrentQuarter(34), amount: 1300.00, description: 'Rent A Room expenses', supplier_or_payer: 'Various', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 34)) },
  { id: 'mtd-20', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'redecorating',
    transaction_date: inCurrentQuarter(32), amount: 41.00, description: 'Paint and brushes', supplier_or_payer: 'B&Q', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 32)) },
  { id: 'mtd-21', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'ground_rent',
    transaction_date: inCurrentQuarter(30), amount: 60.00, description: 'Ground rent', supplier_or_payer: 'Freeholder', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 30)) },
  { id: 'mtd-22', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'service_charges',
    transaction_date: inCurrentQuarter(28), amount: 170.00, description: 'Block service charge', supplier_or_payer: 'Block Management', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 28)) },
  { id: 'mtd-23', property_id: PROP_1, document_id: 'doc-3', kind: 'expense', income_category: null, expense_category: 'repairs_and_maintenance',
    transaction_date: inCurrentQuarter(26), amount: 1400.00, description: 'Boiler service and tap repair', supplier_or_payer: 'Northwood Gas', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 26)) },
  { id: 'mtd-24', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'btl_mortgage_interest',
    transaction_date: inCurrentQuarter(24), amount: 1500.00, description: 'BTL mortgage interest', supplier_or_payer: 'Barclays', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 24)) },
  { id: 'mtd-25', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'other_finance_costs',
    transaction_date: inCurrentQuarter(22), amount: 20.00, description: 'Mortgage arrangement', supplier_or_payer: 'Barclays', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 22)) },
  { id: 'mtd-26', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'accountancy_fees',
    transaction_date: inCurrentQuarter(18), amount: 300.00, description: 'Quarterly accountancy', supplier_or_payer: 'Smith & Brown', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 18)) },
  { id: 'mtd-27', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'bank_charges',
    transaction_date: inCurrentQuarter(14), amount: 12.00, description: 'Business banking fee', supplier_or_payer: 'Barclays', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 14)) },
  { id: 'mtd-28', property_id: PROP_1, document_id: null, kind: 'expense', income_category: null, expense_category: 'travel_costs',
    transaction_date: inCurrentQuarter(10), amount: 1700.00, description: 'Property visits, mileage', supplier_or_payer: 'Mileage claim', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 10)) },

  // PROP_2 — a leaner set
  { id: 'mtd-29', property_id: PROP_2, document_id: null, kind: 'income',  income_category: 'period_amount', expense_category: null,
    transaction_date: inCurrentQuarter(50), amount: 5625.00, description: 'Q1 rent received', supplier_or_payer: 'Walsh', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 50)) },
  { id: 'mtd-30', property_id: PROP_2, document_id: 'doc-5', kind: 'expense', income_category: null, expense_category: 'repairs_and_maintenance',
    transaction_date: inCurrentQuarter(30), amount: 125.00, description: 'Boiler service', supplier_or_payer: 'Yorkshire Gas', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 30)) },
  { id: 'mtd-31', property_id: PROP_2, document_id: null, kind: 'expense', income_category: null, expense_category: 'btl_mortgage_interest',
    transaction_date: inCurrentQuarter(20), amount: 1100.00, description: 'BTL mortgage interest', supplier_or_payer: 'NatWest', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 20)) },
  { id: 'mtd-32', property_id: PROP_2, document_id: null, kind: 'expense', income_category: null, expense_category: 'insurance',
    transaction_date: inCurrentQuarter(15), amount: 180.00, description: 'Buildings insurance', supplier_or_payer: 'Direct Line', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 15)) },
]

// ---- contacts ----
const contacts = [
  { id: 'ct-1', owner_id: DEMO_USER_ID, kind: 'tenant',
    full_name: 'Jasmin Patel', company: null, trade: null,
    email: 'jasmin.patel@example.com', phone: '07700 900201',
    address: '37 Hollow Lane, Manchester M14 6PQ', notes: 'Current tenant at Hollow Lane Flat.',
    is_active: true, property_id: PROP_1,
    created_at: iso(subMonths(today, 7)), updated_at: iso(today) },
  { id: 'ct-2', owner_id: DEMO_USER_ID, kind: 'tenant',
    full_name: 'Tom Walsh', company: null, trade: null,
    email: 'walsh.family@example.com', phone: '07700 900202',
    address: '12 Saxon Court, Leeds LS6 1AB', notes: null,
    is_active: true, property_id: PROP_2,
    created_at: iso(subMonths(today, 13)), updated_at: iso(today) },
  { id: 'ct-3', owner_id: DEMO_USER_ID, kind: 'contractor',
    full_name: "Dave O'Connor", company: "O'Connor Plumbing", trade: 'Plumber',
    email: 'dave@oconnorplumbing.co.uk', phone: '07700 900303',
    address: 'Manchester', notes: 'Reliable, same-week call-outs.',
    is_active: true, property_id: null,
    created_at: iso(subMonths(today, 8)), updated_at: iso(today) },
  { id: 'ct-4', owner_id: DEMO_USER_ID, kind: 'contractor',
    full_name: 'Mark Reeve', company: 'Northwood Gas Ltd', trade: 'Gas Safe Engineer',
    email: 'mark@northwoodgas.co.uk', phone: '07700 900304',
    address: 'Manchester', notes: 'Gas Safe ref 401-321. Annual servicing.',
    is_active: true, property_id: null,
    created_at: iso(subMonths(today, 14)), updated_at: iso(today) },
  { id: 'ct-5', owner_id: DEMO_USER_ID, kind: 'contractor',
    full_name: 'Volt Sparks Ltd', company: 'Volt Sparks Ltd', trade: 'Electrician',
    email: 'office@voltsparks.co.uk', phone: '07700 900305',
    address: 'Leeds', notes: 'EICR provider.',
    is_active: true, property_id: null,
    created_at: iso(subMonths(today, 24)), updated_at: iso(today) },
  { id: 'ct-6', owner_id: DEMO_USER_ID, kind: 'supplier',
    full_name: 'British Gas Business', company: 'British Gas', trade: null,
    email: 'billing@britishgas.co.uk', phone: '0333 202 9802',
    address: null, notes: 'Energy supply for void periods.',
    is_active: true, property_id: null,
    created_at: iso(subMonths(today, 18)), updated_at: iso(today) },
  { id: 'ct-7', owner_id: DEMO_USER_ID, kind: 'agent',
    full_name: 'NorthLets', company: 'NorthLets Property', trade: 'Letting agent',
    email: 'lettings@northlets.co.uk', phone: '0161 555 0010',
    address: 'Manchester', notes: 'Manage Hollow Lane Flat tenant find.',
    is_active: true, property_id: PROP_1,
    created_at: iso(subMonths(today, 9)), updated_at: iso(today) },
  { id: 'ct-8', owner_id: DEMO_USER_ID, kind: 'agent',
    full_name: 'Smith & Brown', company: 'Smith & Brown Chartered Accountants', trade: 'Accountant',
    email: 'mike@smithbrown.co.uk', phone: '0161 555 0011',
    address: 'Manchester', notes: 'Quarterly accountancy for the portfolio.',
    is_active: true, property_id: null,
    created_at: iso(subMonths(today, 30)), updated_at: iso(today) },
  { id: 'ct-9', owner_id: DEMO_USER_ID, kind: 'other',
    full_name: 'Aviva Insurance', company: 'Aviva', trade: 'Insurer',
    email: 'claims@aviva.co.uk', phone: '0800 056 2192',
    address: null, notes: 'Buildings insurance ref BI-AV-77123.',
    is_active: true, property_id: PROP_1,
    created_at: iso(subMonths(today, 12)), updated_at: iso(today) },
]

// ---- invoices (outgoing) ----
const invoices = [
  { id: 'inv-1', owner_id: DEMO_USER_ID, contact_id: 'ct-1', property_id: PROP_1,
    invoice_number: 'INV-01001', type: 'rent', status: 'paid',
    contact_name: 'Jasmin Patel', contact_email: 'jasmin.patel@example.com', contact_address: '37 Hollow Lane, Manchester M14 6PQ',
    issue_date: ymd(subDays(today, 30)), due_date: ymd(subDays(today, 25)), payment_terms: 'On receipt',
    subtotal: 1450, vat_amount: 0, total: 1450, amount_paid: 1450, notes: null,
    sent_at: iso(subDays(today, 30)), paid_at: iso(subDays(today, 28)),
    created_at: iso(subDays(today, 30)), updated_at: iso(today) },
  { id: 'inv-2', owner_id: DEMO_USER_ID, contact_id: 'ct-2', property_id: PROP_2,
    invoice_number: 'INV-01002', type: 'rent', status: 'overdue',
    contact_name: 'Tom Walsh', contact_email: 'walsh.family@example.com', contact_address: '12 Saxon Court, Leeds LS6 1AB',
    issue_date: ymd(subDays(today, 25)), due_date: ymd(subDays(today, 5)), payment_terms: 'Net 20',
    subtotal: 1875, vat_amount: 0, total: 1875, amount_paid: 0, notes: 'Reminder sent.',
    sent_at: iso(subDays(today, 25)), paid_at: null,
    created_at: iso(subDays(today, 25)), updated_at: iso(today) },
  { id: 'inv-3', owner_id: DEMO_USER_ID, contact_id: 'ct-1', property_id: PROP_1,
    invoice_number: 'INV-01003', type: 'ad_hoc', status: 'sent',
    contact_name: 'Jasmin Patel', contact_email: 'jasmin.patel@example.com', contact_address: '37 Hollow Lane, Manchester M14 6PQ',
    issue_date: ymd(subDays(today, 3)), due_date: ymd(addDays(today, 27)), payment_terms: 'Net 30',
    subtotal: 75, vat_amount: 15, total: 90, amount_paid: 0,
    notes: 'Replacement front door key.',
    sent_at: iso(subDays(today, 3)), paid_at: null,
    created_at: iso(subDays(today, 3)), updated_at: iso(today) },
  { id: 'inv-4', owner_id: DEMO_USER_ID, contact_id: 'ct-2', property_id: PROP_2,
    invoice_number: 'INV-01004', type: 'ad_hoc', status: 'draft',
    contact_name: 'Tom Walsh', contact_email: 'walsh.family@example.com', contact_address: '12 Saxon Court, Leeds LS6 1AB',
    issue_date: ymd(today), due_date: ymd(addDays(today, 30)), payment_terms: 'Net 30',
    subtotal: 200, vat_amount: 0, total: 200, amount_paid: 0,
    notes: 'End of tenancy clean (cost split).',
    sent_at: null, paid_at: null,
    created_at: iso(today), updated_at: iso(today) },
]

const invoice_line_items = [
  { id: 'il-1', invoice_id: 'inv-1', description: 'May 2026 rent', quantity: 1, unit_price: 1450, vat_rate: 0, line_total: 1450, sort_order: 0, created_at: iso(subDays(today, 30)) },
  { id: 'il-2', invoice_id: 'inv-2', description: 'May 2026 rent', quantity: 1, unit_price: 1875, vat_rate: 0, line_total: 1875, sort_order: 0, created_at: iso(subDays(today, 25)) },
  { id: 'il-3', invoice_id: 'inv-3', description: 'Replacement front door key (incl VAT)', quantity: 1, unit_price: 75, vat_rate: 20, line_total: 90, sort_order: 0, created_at: iso(subDays(today, 3)) },
  { id: 'il-4', invoice_id: 'inv-4', description: 'Professional cleaning, partial recharge', quantity: 1, unit_price: 200, vat_rate: 0, line_total: 200, sort_order: 0, created_at: iso(today) },
]

// ---- conversations + messages ----
const conversations = [
  { id: 'cv-1', owner_id: DEMO_USER_ID, contact_id: 'ct-1', property_id: PROP_1,
    category: 'tenant', subject: 'Kitchen tap leak update', is_archived: false,
    last_message_at: iso(subDays(today, 1)), created_at: iso(subDays(today, 2)) },
  { id: 'cv-2', owner_id: DEMO_USER_ID, contact_id: 'ct-2', property_id: PROP_2,
    category: 'tenant', subject: 'Boiler engineer visit', is_archived: false,
    last_message_at: iso(subDays(today, 0)), created_at: iso(today) },
  { id: 'cv-3', owner_id: DEMO_USER_ID, contact_id: 'ct-3', property_id: null,
    category: 'other', subject: 'Pricing for tap repair', is_archived: false,
    last_message_at: iso(subDays(today, 1)), created_at: iso(subDays(today, 2)) },
]

const messages = [
  { id: 'mg-1', conversation_id: 'cv-1', sender: 'tenant', sender_name: 'Jasmin Patel',
    body: 'Hi, the kitchen tap is dripping constantly. I uploaded photos to the portal.',
    sent_at: iso(subDays(today, 2)), read_at: iso(subDays(today, 2)) },
  { id: 'mg-2', conversation_id: 'cv-1', sender: 'landlord', sender_name: 'Sam Blake',
    body: "Thanks for letting me know. I've booked O'Connor Plumbing for tomorrow 10am.",
    sent_at: iso(subDays(today, 1)), read_at: iso(subDays(today, 1)) },
  { id: 'mg-3', conversation_id: 'cv-1', sender: 'tenant', sender_name: 'Jasmin Patel',
    body: 'Brilliant, thank you. I will be home.',
    sent_at: iso(subDays(today, 1)), read_at: null },
  { id: 'mg-4', conversation_id: 'cv-2', sender: 'tenant', sender_name: 'Tom Walsh',
    body: 'No hot water this morning. Boiler shows F22.',
    sent_at: iso(subDays(today, 0)), read_at: iso(today) },
  { id: 'mg-5', conversation_id: 'cv-2', sender: 'landlord', sender_name: 'Sam Blake',
    body: "Acknowledged. Mark from Northwood Gas is on his way tomorrow morning.",
    sent_at: iso(today), read_at: null },
  { id: 'mg-6', conversation_id: 'cv-3', sender: 'landlord', sender_name: 'Sam Blake',
    body: 'Hi Dave, can you confirm pricing for the tap repair at Hollow Lane Flat?',
    sent_at: iso(subDays(today, 2)), read_at: iso(subDays(today, 2)) },
  { id: 'mg-7', conversation_id: 'cv-3', sender: 'tenant', sender_name: "Dave O'Connor",
    body: '£85 incl parts. Tomorrow 10am works.',
    sent_at: iso(subDays(today, 1)), read_at: iso(subDays(today, 1)) },
]

export const DEMO_DATA: Record<string, any[]> = {
  profiles,
  properties,
  tenants,
  compliance_certificates,
  rent_payments,
  maintenance_tasks,
  fault_reports,
  fault_events,
  contractor_bookings,
  documents,
  tenancy_journey,
  notifications,
  mtd_transactions,
  contacts,
  invoices,
  invoice_line_items,
  conversations,
  messages,
  push_subscriptions: [],
}
