// Sample portfolio data for demo mode. Hydrates every page without a backend.
// Properties match the user's street-view mockup: 8 UK properties in Luton.
import { addDays, addMonths, format, startOfMonth, subDays, subMonths } from 'date-fns'

const today = new Date()
const iso = (d: Date) => d.toISOString()
const ymd = (d: Date) => format(d, 'yyyy-MM-dd')

export const DEMO_USER_ID = 'demo-owner-1'

// 8 property IDs from the street-view mockup
const PROP_TURNERS    = 'demo-prop-turners'
const PROP_RAMRIDGE   = 'demo-prop-ramridge'
const PROP_BIRCHEN    = 'demo-prop-birchen'
const PROP_HITCHIN    = 'demo-prop-hitchin'
const PROP_RIDGEWAY   = 'demo-prop-ridgeway'
const PROP_WILLIAM    = 'demo-prop-william'
const PROP_BUTTERWORTH = 'demo-prop-butterworth'
const PROP_KILBURN    = 'demo-prop-kilburn'

// Tenant IDs
const TEN_TURNERS = 'demo-tenant-turners'
const TEN_BIRCHEN = 'demo-tenant-birchen'
const TEN_WILLIAM = 'demo-tenant-william' // Kamran

// Faults
const FAULT_1 = 'demo-fault-william-shower'

// ---- profiles ----
const profiles = [
  { id: DEMO_USER_ID, email: 'demo@blakeukhomes.local', full_name: 'Sam Blake', role: 'owner', phone: '07700 900100', created_at: iso(subMonths(today, 24)), updated_at: iso(today) },
]

// ---- properties ----
const properties = [
  {
    id: PROP_TURNERS, owner_id: DEMO_USER_ID,
    nickname: 'Turners Road',
    address_line_1: 'Turners Road South', address_line_2: null,
    city: 'Luton', postcode: 'LU3 3DR',
    country: 'United Kingdom',
    listing_type: 'single_family',
    property_type: 'house', bedrooms: 3,
    monthly_rent: 950, rent_due_day: 1,
    status: 'tenanted', hero_image_url: null,
    notes: 'Owned via limited company.',
    created_at: iso(subMonths(today, 22)), updated_at: iso(today),
  },
  {
    id: PROP_RAMRIDGE, owner_id: DEMO_USER_ID,
    nickname: 'Ramridge Road',
    address_line_1: 'Ramridge Road', address_line_2: null,
    city: 'Luton', postcode: 'LU2 0RT',
    country: 'United Kingdom',
    listing_type: 'single_family',
    property_type: 'flat', bedrooms: 2,
    monthly_rent: 0, rent_due_day: 1,
    status: 'vacant', hero_image_url: null,
    notes: 'Awaiting redecoration. Personal ownership.',
    created_at: iso(subMonths(today, 18)), updated_at: iso(today),
  },
  {
    id: PROP_BIRCHEN, owner_id: DEMO_USER_ID,
    nickname: 'Birchengrove',
    address_line_1: 'Birchengrove', address_line_2: null,
    city: 'Luton', postcode: 'LU3 1LF',
    country: 'United Kingdom',
    listing_type: 'single_family',
    property_type: 'house', bedrooms: 3,
    monthly_rent: 1275, rent_due_day: 1,
    status: 'tenanted', hero_image_url: null,
    notes: 'Owned via limited company.',
    created_at: iso(subMonths(today, 30)), updated_at: iso(today),
  },
  {
    id: PROP_HITCHIN, owner_id: DEMO_USER_ID,
    nickname: 'Hitchin Road',
    address_line_1: 'Hitchin Road', address_line_2: null,
    city: 'Luton', postcode: 'LU2 7SF',
    country: 'United Kingdom',
    listing_type: 'single_family',
    property_type: 'house', bedrooms: 2,
    monthly_rent: 0, rent_due_day: 1,
    status: 'vacant', hero_image_url: null,
    notes: 'Personal ownership.',
    created_at: iso(subMonths(today, 14)), updated_at: iso(today),
  },
  {
    id: PROP_RIDGEWAY, owner_id: DEMO_USER_ID,
    nickname: 'Ridgeway Road',
    address_line_1: 'Ridgeway Road', address_line_2: null,
    city: 'Luton', postcode: 'LU2 7AT',
    country: 'United Kingdom',
    listing_type: 'single_family',
    property_type: 'flat', bedrooms: 2,
    monthly_rent: 0, rent_due_day: 1,
    status: 'vacant', hero_image_url: null,
    notes: 'Personal ownership.',
    created_at: iso(subMonths(today, 9)), updated_at: iso(today),
  },
  {
    id: PROP_WILLIAM, owner_id: DEMO_USER_ID,
    nickname: 'William Street',
    address_line_1: 'William Street', address_line_2: null,
    city: 'Luton', postcode: 'LU2 7RE',
    country: 'United Kingdom',
    listing_type: 'single_family',
    property_type: 'house', bedrooms: 3,
    monthly_rent: 1100, rent_due_day: 1,
    status: 'tenanted', hero_image_url: null,
    notes: 'Owned via limited company. Active repair in progress.',
    created_at: iso(subMonths(today, 28)), updated_at: iso(today),
  },
  {
    id: PROP_BUTTERWORTH, owner_id: DEMO_USER_ID,
    nickname: 'Butterworth Path',
    address_line_1: 'Butterworth Path', address_line_2: null,
    city: 'Luton', postcode: 'LU3 2AB',
    country: 'United Kingdom',
    listing_type: 'single_family',
    property_type: 'house', bedrooms: 3,
    monthly_rent: 0, rent_due_day: 1,
    status: 'legal_proceedings', hero_image_url: null,
    notes: 'Section 8 hearing scheduled. Owned via limited company.',
    created_at: iso(subMonths(today, 26)), updated_at: iso(today),
  },
  {
    id: PROP_KILBURN, owner_id: DEMO_USER_ID,
    nickname: 'Kilburn Road',
    address_line_1: 'Kilburn Road', address_line_2: null,
    city: 'Luton', postcode: 'LU3 2SX',
    country: 'United Kingdom',
    listing_type: 'single_family',
    property_type: 'flat', bedrooms: 1,
    monthly_rent: 0, rent_due_day: 1,
    status: 'vacant', hero_image_url: null,
    notes: 'Personal ownership. Awaiting compliance refresh.',
    created_at: iso(subMonths(today, 12)), updated_at: iso(today),
  },
]

// ---- tenants ----
const tenants = [
  {
    id: TEN_TURNERS, property_id: PROP_TURNERS, full_name: 'Robert Andrews',
    email: 'r.andrews@example.com', phone: '07700 900201',
    auth_user_id: null, portal_token: 'demo-token-andrews-turners',
    tenancy_start: ymd(subMonths(today, 14)), tenancy_end: ymd(addMonths(today, 10)),
    deposit_amount: 1096, deposit_scheme: 'DPS', is_active: true,
    created_at: iso(subMonths(today, 14)),
    properties: { nickname: 'Turners Road', address_line_1: 'Turners Road South', city: 'Luton', postcode: 'LU3 3DR' },
  },
  {
    id: TEN_BIRCHEN, property_id: PROP_BIRCHEN, full_name: 'Lauren Mitchell',
    email: 'lauren.mitchell@example.com', phone: '07700 900202',
    auth_user_id: null, portal_token: 'demo-token-mitchell-birchen',
    tenancy_start: ymd(subMonths(today, 22)), tenancy_end: ymd(addMonths(today, 2)),
    deposit_amount: 1471, deposit_scheme: 'mydeposits', is_active: true,
    created_at: iso(subMonths(today, 22)),
    properties: { nickname: 'Birchengrove', address_line_1: 'Birchengrove', city: 'Luton', postcode: 'LU3 1LF' },
  },
  {
    id: TEN_WILLIAM, property_id: PROP_WILLIAM, full_name: 'Kamran Shah',
    email: 'kamran.shah@example.com', phone: '07700 900203',
    auth_user_id: null, portal_token: 'demo-token-kamran-william',
    tenancy_start: ymd(subMonths(today, 19)), tenancy_end: ymd(addMonths(today, 5)),
    deposit_amount: 1269, deposit_scheme: 'DPS', is_active: true,
    created_at: iso(subMonths(today, 19)),
    properties: { nickname: 'William Street', address_line_1: 'William Street', city: 'Luton', postcode: 'LU2 7RE' },
  },
]

// ---- compliance certificates ----
// Reflects the alerts from your street-view mockup
const compliance_certificates = [
  // Turners Road - gas safety due in 28 days
  { id: 'cert-turners-gas', property_id: PROP_TURNERS, type: 'gas_safety',
    completed_on: ymd(subDays(today, 337)), expires_on: ymd(addDays(today, 28)),
    document_id: null, issued_by: 'Northwood Gas Ltd', reference: 'NG-2025-4421', notes: null,
    created_at: iso(subDays(today, 337)) },
  { id: 'cert-turners-eicr', property_id: PROP_TURNERS, type: 'eicr',
    completed_on: ymd(subMonths(today, 18)), expires_on: ymd(addMonths(today, 42)),
    document_id: null, issued_by: 'Volt Sparks', reference: 'VS-2024-103', notes: null,
    created_at: iso(subMonths(today, 18)) },
  { id: 'cert-turners-epc', property_id: PROP_TURNERS, type: 'epc',
    completed_on: ymd(subMonths(today, 36)), expires_on: ymd(addMonths(today, 84)),
    document_id: null, issued_by: 'EnergyAssess UK', reference: 'EA-2023-9912', notes: 'Band C',
    created_at: iso(subMonths(today, 36)) },
  { id: 'cert-turners-ins', property_id: PROP_TURNERS, type: 'buildings_insurance',
    completed_on: ymd(subMonths(today, 6)), expires_on: ymd(addMonths(today, 6)),
    document_id: null, issued_by: 'Aviva', reference: 'BI-AV-77123', notes: null,
    created_at: iso(subMonths(today, 6)) },

  // Birchengrove - all clear
  { id: 'cert-birchen-gas', property_id: PROP_BIRCHEN, type: 'gas_safety',
    completed_on: ymd(subDays(today, 90)), expires_on: ymd(addDays(today, 275)),
    document_id: null, issued_by: 'Northwood Gas Ltd', reference: 'NG-2025-7791', notes: null,
    created_at: iso(subDays(today, 90)) },
  { id: 'cert-birchen-eicr', property_id: PROP_BIRCHEN, type: 'eicr',
    completed_on: ymd(subMonths(today, 8)), expires_on: ymd(addMonths(today, 52)),
    document_id: null, issued_by: 'Volt Sparks', reference: 'VS-2025-220', notes: null,
    created_at: iso(subMonths(today, 8)) },
  { id: 'cert-birchen-epc', property_id: PROP_BIRCHEN, type: 'epc',
    completed_on: ymd(subMonths(today, 18)), expires_on: ymd(addMonths(today, 102)),
    document_id: null, issued_by: 'EnergyAssess UK', reference: 'EA-2024-1102', notes: 'Band C',
    created_at: iso(subMonths(today, 18)) },
  { id: 'cert-birchen-ins', property_id: PROP_BIRCHEN, type: 'buildings_insurance',
    completed_on: ymd(subMonths(today, 3)), expires_on: ymd(addMonths(today, 9)),
    document_id: null, issued_by: 'Direct Line', reference: 'BI-DL-22001', notes: null,
    created_at: iso(subMonths(today, 3)) },

  // William Street - all clear (Kamran's property)
  { id: 'cert-william-gas', property_id: PROP_WILLIAM, type: 'gas_safety',
    completed_on: ymd(subDays(today, 78)), expires_on: ymd(addDays(today, 287)),
    document_id: null, issued_by: 'Northwood Gas Ltd', reference: 'NG-2025-8810', notes: null,
    created_at: iso(subDays(today, 78)) },
  { id: 'cert-william-eicr', property_id: PROP_WILLIAM, type: 'eicr',
    completed_on: ymd(subDays(today, 920)), expires_on: ymd(addDays(today, 905)),
    document_id: null, issued_by: 'Volt Sparks', reference: 'VS-2023-440', notes: null,
    created_at: iso(subDays(today, 920)) },
  { id: 'cert-william-epc', property_id: PROP_WILLIAM, type: 'epc',
    completed_on: ymd(subMonths(today, 28)), expires_on: ymd(addMonths(today, 92)),
    document_id: null, issued_by: 'EnergyAssess UK', reference: 'EA-2023-3301', notes: 'Band D',
    created_at: iso(subMonths(today, 28)) },
  { id: 'cert-william-ins', property_id: PROP_WILLIAM, type: 'buildings_insurance',
    completed_on: ymd(subMonths(today, 4)), expires_on: ymd(addMonths(today, 8)),
    document_id: null, issued_by: 'Aviva', reference: 'BI-AV-99012', notes: null,
    created_at: iso(subMonths(today, 4)) },

  // Ridgeway Road - vacant but insurance expiring in 45 days
  { id: 'cert-ridgeway-ins', property_id: PROP_RIDGEWAY, type: 'buildings_insurance',
    completed_on: ymd(subDays(today, 320)), expires_on: ymd(addDays(today, 45)),
    document_id: null, issued_by: 'Aviva', reference: 'BI-AV-44022', notes: null,
    created_at: iso(subDays(today, 320)) },
  { id: 'cert-ridgeway-epc', property_id: PROP_RIDGEWAY, type: 'epc',
    completed_on: ymd(subMonths(today, 8)), expires_on: ymd(addMonths(today, 112)),
    document_id: null, issued_by: 'EnergyAssess UK', reference: 'EA-2025-7702', notes: 'Band D',
    created_at: iso(subMonths(today, 8)) },

  // Butterworth Path - legal proceedings, compliance current
  { id: 'cert-butterworth-gas', property_id: PROP_BUTTERWORTH, type: 'gas_safety',
    completed_on: ymd(subDays(today, 200)), expires_on: ymd(addDays(today, 165)),
    document_id: null, issued_by: 'Northwood Gas Ltd', reference: 'NG-2025-1102', notes: null,
    created_at: iso(subDays(today, 200)) },

  // The vacants (Ramridge, Hitchin, Kilburn) deliberately have NO compliance certs to show missing alerts
]

// ---- rent payments ----
function makePayments(propertyId: string, tenantId: string, monthlyRent: number, dueDay: number) {
  const out: any[] = []
  for (let i = 5; i >= 0; i--) {
    const period = startOfMonth(subMonths(today, i))
    const due = new Date(period); due.setDate(Math.min(dueDay, 28))
    let status: 'paid' | 'partial' | 'late' | 'missing' = 'paid'
    let amount_paid = monthlyRent
    let received_on: string | null = ymd(addDays(due, 1))
    let notes: string | null = null
    // Add a varied story
    if (i === 0 && propertyId === PROP_TURNERS) {
      status = 'late'; amount_paid = 0; received_on = null
      notes = 'Tenant messaged: bank transfer scheduled this week.'
    }
    if (i === 1 && propertyId === PROP_BIRCHEN) {
      status = 'partial'; amount_paid = Math.round(monthlyRent * 0.5); received_on = ymd(addDays(due, 5))
      notes = 'Half paid, balance promised next pay cycle.'
    }
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
  ...makePayments(PROP_TURNERS, TEN_TURNERS, 950, 1),
  ...makePayments(PROP_BIRCHEN, TEN_BIRCHEN, 1275, 1),
  ...makePayments(PROP_WILLIAM, TEN_WILLIAM, 1100, 1),
]

// ---- maintenance tasks ----
const maintenance_tasks = [
  { id: 'mt-1', property_id: PROP_TURNERS, kind: 'inspection',
    title: 'Quarterly inspection', description: '120-day visit.',
    due_on: ymd(addDays(today, 14)), completed_on: null, recur_days: 120, notes: null,
    priority: 'medium', status: 'scheduled', contractor_id: null,
    created_at: iso(subDays(today, 106)) },
  { id: 'mt-2', property_id: PROP_WILLIAM, kind: 'task',
    title: 'Repair shower (no water flow)', description: 'Tenant Kamran reported, no water from showerhead.',
    due_on: ymd(addDays(today, 4)), completed_on: null, recur_days: null, notes: null,
    priority: 'urgent', status: 'in_progress', contractor_id: 'ct-3',
    created_at: iso(subDays(today, 3)) },
  { id: 'mt-3', property_id: PROP_BIRCHEN, kind: 'inspection',
    title: 'Quarterly inspection', description: '',
    due_on: ymd(addDays(today, 35)), completed_on: null, recur_days: 120, notes: null,
    priority: 'medium', status: 'scheduled', contractor_id: null,
    created_at: iso(subDays(today, 85)) },
  { id: 'mt-4', property_id: PROP_TURNERS, kind: 'inspection',
    title: 'Quarterly inspection', description: 'All in order.',
    due_on: ymd(subDays(today, 105)), completed_on: ymd(subDays(today, 104)),
    recur_days: 120, notes: 'Minor scuff in living room noted.',
    priority: 'medium', status: 'resolved', contractor_id: null,
    created_at: iso(subDays(today, 220)) },
  { id: 'mt-5', property_id: PROP_BUTTERWORTH, kind: 'task',
    title: 'Property visit for legal hearing prep', description: 'Photograph state of property for court submission.',
    due_on: ymd(addDays(today, 7)), completed_on: null, recur_days: null, notes: null,
    priority: 'high', status: 'open', contractor_id: null,
    created_at: iso(subDays(today, 2)) },
  { id: 'mt-6', property_id: PROP_RAMRIDGE, kind: 'task',
    title: 'Redecorate before re-let', description: 'Paint walls, replace carpet, refresh kitchen.',
    due_on: ymd(addDays(today, 21)), completed_on: null, recur_days: null, notes: null,
    priority: 'medium', status: 'open', contractor_id: null,
    created_at: iso(subDays(today, 14)) },
]

// ---- fault reports ----
const fault_reports = [
  {
    id: FAULT_1, reference: 'FR-WIL-3A92',
    property_id: PROP_WILLIAM, tenant_id: TEN_WILLIAM,
    category: 'Plumbing', severity: 'urgent',
    description: 'Shower not producing water. Started this morning.',
    reporter_name: 'Kamran Shah', reporter_phone: '07700 900203', reporter_email: 'kamran.shah@example.com',
    current_state: 'contractor_booked',
    reported_at: iso(subDays(today, 3)),
    resolved_at: null,
    properties: { nickname: 'William Street', address_line_1: 'William Street', city: 'Luton', postcode: 'LU2 7RE' },
    tenants: { full_name: 'Kamran Shah', email: 'kamran.shah@example.com', phone: '07700 900203' },
  },
]

// ---- fault events ----
const fault_events = [
  { id: 'fe-1', fault_id: FAULT_1, occurred_at: iso(subDays(today, 3)),
    actor_role: 'tenant', actor_name: 'Kamran Shah', state: 'reported',
    note: 'Fault reported via portal. 2 photos, 1 video attached.', created_at: iso(subDays(today, 3)) },
  { id: 'fe-2', fault_id: FAULT_1, occurred_at: iso(subDays(today, 3)),
    actor_role: 'owner', actor_name: 'Blake UK Homes (auto)', state: 'acknowledged',
    note: 'System auto-acknowledgement on receipt.', created_at: iso(subDays(today, 3)) },
  { id: 'fe-3', fault_id: FAULT_1, occurred_at: iso(subDays(today, 2)),
    actor_role: 'owner', actor_name: 'Sam Blake', state: 'contractor_booked',
    note: "Booked Dave's Plumbing for 2 June at 10am.", created_at: iso(subDays(today, 2)) },
]

// ---- contractor bookings ----
const contractor_bookings = [
  { id: 'cb-1', fault_id: FAULT_1, property_id: PROP_WILLIAM,
    contractor_name: "Dave's Plumbing", trade: 'Plumber',
    phone: '07700 900303',
    scheduled_for: iso(addDays(today, 4)),
    notes: 'Inspect and repair shower head and supply line.', created_at: iso(subDays(today, 2)) },
]

// ---- documents ----
const documents = [
  { id: 'doc-1', property_id: PROP_WILLIAM, uploaded_by: DEMO_USER_ID,
    kind: 'tenancy_agreement', title: 'AST William Street, Kamran',
    storage_path: 'demo/ast-kamran.pdf', mime_type: 'application/pdf', file_size: 482_300,
    ai_summary: 'AST, 24 months from 1 Nov 2024. Rent £1,100 pcm due 1st. Deposit £1,269 (DPS, ref DPS-9914). Break clause month 12 with 2 months notice. Pets not permitted without consent. Smoking prohibited.',
    ai_summary_at: iso(subMonths(today, 19)),
    visible_to_tenant: true, created_at: iso(subMonths(today, 19)) },
  { id: 'doc-2', property_id: PROP_WILLIAM, uploaded_by: DEMO_USER_ID,
    kind: 'deposit_certificate', title: 'DPS deposit certificate Kamran',
    storage_path: 'demo/dps-kamran.pdf', mime_type: 'application/pdf', file_size: 88_120,
    ai_summary: 'DPS custodial scheme. Deposit £1,269 received 28 Oct 2024. Reference DPS-9914. Prescribed information served.',
    ai_summary_at: iso(subMonths(today, 19)),
    visible_to_tenant: true, created_at: iso(subMonths(today, 19)) },
  { id: 'doc-3', property_id: PROP_WILLIAM, uploaded_by: DEMO_USER_ID,
    kind: 'how_to_rent', title: 'How to Rent guide (May 2024)',
    storage_path: 'demo/how-to-rent.pdf', mime_type: 'application/pdf', file_size: 142_300,
    ai_summary: null, ai_summary_at: null,
    visible_to_tenant: true, created_at: iso(subMonths(today, 19)) },
  { id: 'doc-4', property_id: PROP_WILLIAM, uploaded_by: DEMO_USER_ID,
    kind: 'gas_safety', title: 'Gas Safety William Street 2025',
    storage_path: 'demo/gas-william.pdf', mime_type: 'application/pdf', file_size: 220_120,
    ai_summary: 'Annual Gas Safety Certificate. Issued by Northwood Gas Ltd. Engineer Mark Reeve (Gas Safe 401-321). No defects. Valid 12 months.',
    ai_summary_at: iso(subDays(today, 76)),
    visible_to_tenant: true, created_at: iso(subDays(today, 78)) },
  { id: 'doc-5', property_id: PROP_TURNERS, uploaded_by: DEMO_USER_ID,
    kind: 'tenancy_agreement', title: 'AST Turners Road, Andrews',
    storage_path: 'demo/ast-andrews.pdf', mime_type: 'application/pdf', file_size: 461_900,
    ai_summary: 'AST, 24 months from 1 Apr 2025. Rent £950 pcm due 1st. Deposit £1,096 (DPS).',
    ai_summary_at: iso(subMonths(today, 14)),
    visible_to_tenant: true, created_at: iso(subMonths(today, 14)) },
  { id: 'doc-6', property_id: PROP_BIRCHEN, uploaded_by: DEMO_USER_ID,
    kind: 'invoice', title: 'Boiler service Yorkshire Gas',
    storage_path: 'demo/invoice-birchen-boiler.pdf', mime_type: 'application/pdf', file_size: 64_200,
    ai_summary: 'Yorkshire Gas Services. Annual boiler service for Birchengrove. £125 + VAT. Work performed 12 Apr 2026.',
    ai_summary_at: iso(subDays(today, 30)),
    visible_to_tenant: false, created_at: iso(subDays(today, 30)) },
]

// ---- tenancy journey ----
const tenancy_journey = [
  ...['property_setup', 'tenant_onboarding', 'tenancy_agreement', 'deposit', 'move_in_inventory', 'keys_handed_over', 'active_tenancy']
    .map((step, i) => ({
      id: `tj-william-${step}`,
      property_id: PROP_WILLIAM, tenant_id: TEN_WILLIAM,
      step,
      completed_on: iso(subMonths(today, 19 - i * 0.05)),
      landlord_sign: true, tenant_sign: step !== 'active_tenancy',
      notes: null,
      created_at: iso(subMonths(today, 19)),
    })),
]

// ---- notifications ----
const notifications = [
  { id: 'n-1', user_id: DEMO_USER_ID, property_id: PROP_TURNERS, channel: 'email',
    subject: 'Gas Safety due in 28 days', body: 'Renew Gas Safety for Turners Road.',
    sent_at: iso(subDays(today, 1)), read_at: null, created_at: iso(subDays(today, 1)) },
  { id: 'n-2', user_id: DEMO_USER_ID, property_id: PROP_WILLIAM, channel: 'push',
    subject: 'Fault reported', body: 'Plumbing FR-WIL-3A92', sent_at: iso(subDays(today, 3)),
    read_at: iso(subDays(today, 3)), created_at: iso(subDays(today, 3)) },
  { id: 'n-3', user_id: DEMO_USER_ID, property_id: PROP_BUTTERWORTH, channel: 'email',
    subject: 'Legal hearing scheduled', body: 'Section 8 hearing 14 days away.',
    sent_at: iso(subDays(today, 0)), read_at: null, created_at: iso(today) },
  { id: 'n-4', user_id: DEMO_USER_ID, property_id: PROP_RIDGEWAY, channel: 'email',
    subject: 'Insurance expiring in 45 days', body: 'Renew Buildings Insurance for Ridgeway Road.',
    sent_at: iso(today), read_at: null, created_at: iso(today) },
]

// ---- contacts ----
const contacts = [
  { id: 'ct-1', owner_id: DEMO_USER_ID, kind: 'tenant',
    full_name: 'Kamran Shah', company: null, trade: null,
    email: 'kamran.shah@example.com', phone: '07700 900203',
    address: 'William Street, Luton LU2 7RE', notes: 'Current tenant at William Street.',
    is_active: true, property_id: PROP_WILLIAM,
    created_at: iso(subMonths(today, 19)), updated_at: iso(today) },
  { id: 'ct-2', owner_id: DEMO_USER_ID, kind: 'tenant',
    full_name: 'Robert Andrews', company: null, trade: null,
    email: 'r.andrews@example.com', phone: '07700 900201',
    address: 'Turners Road South, Luton LU3 3DR', notes: null,
    is_active: true, property_id: PROP_TURNERS,
    created_at: iso(subMonths(today, 14)), updated_at: iso(today) },
  { id: 'ct-7', owner_id: DEMO_USER_ID, kind: 'tenant',
    full_name: 'Lauren Mitchell', company: null, trade: null,
    email: 'lauren.mitchell@example.com', phone: '07700 900202',
    address: 'Birchengrove, Luton LU3 1LF', notes: null,
    is_active: true, property_id: PROP_BIRCHEN,
    created_at: iso(subMonths(today, 22)), updated_at: iso(today) },
  { id: 'ct-3', owner_id: DEMO_USER_ID, kind: 'contractor',
    full_name: "Dave O'Connor", company: "Dave's Plumbing", trade: 'Plumber',
    email: 'dave@daves-plumbing.co.uk', phone: '07700 900303',
    address: 'Luton', notes: 'Reliable, same-week call-outs.',
    is_active: true, property_id: null,
    created_at: iso(subMonths(today, 12)), updated_at: iso(today) },
  { id: 'ct-4', owner_id: DEMO_USER_ID, kind: 'contractor',
    full_name: 'Mark Reeve', company: 'Northwood Gas Ltd', trade: 'Gas Safe Engineer',
    email: 'mark@northwoodgas.co.uk', phone: '07700 900304',
    address: 'Luton', notes: 'Gas Safe ref 401-321. Annual servicing.',
    is_active: true, property_id: null,
    created_at: iso(subMonths(today, 18)), updated_at: iso(today) },
  { id: 'ct-5', owner_id: DEMO_USER_ID, kind: 'contractor',
    full_name: 'Volt Sparks Ltd', company: 'Volt Sparks Ltd', trade: 'Electrician',
    email: 'office@voltsparks.co.uk', phone: '07700 900305',
    address: 'Luton', notes: 'EICR provider.',
    is_active: true, property_id: null,
    created_at: iso(subMonths(today, 30)), updated_at: iso(today) },
  { id: 'ct-6', owner_id: DEMO_USER_ID, kind: 'supplier',
    full_name: 'British Gas Business', company: 'British Gas', trade: null,
    email: 'billing@britishgas.co.uk', phone: '0333 202 9802',
    address: null, notes: 'Energy supply for void periods.',
    is_active: true, property_id: null,
    created_at: iso(subMonths(today, 18)), updated_at: iso(today) },
  { id: 'ct-8', owner_id: DEMO_USER_ID, kind: 'agent',
    full_name: 'NorthLets', company: 'NorthLets Property', trade: 'Letting agent',
    email: 'lettings@northlets.co.uk', phone: '01582 555 0010',
    address: 'Luton', notes: 'Tenant finder for Turners Road.',
    is_active: true, property_id: PROP_TURNERS,
    created_at: iso(subMonths(today, 14)), updated_at: iso(today) },
  { id: 'ct-9', owner_id: DEMO_USER_ID, kind: 'agent',
    full_name: 'Smith & Brown', company: 'Smith & Brown Chartered Accountants', trade: 'Accountant',
    email: 'mike@smithbrown.co.uk', phone: '01582 555 0011',
    address: 'Luton', notes: 'Quarterly accountancy for the portfolio.',
    is_active: true, property_id: null,
    created_at: iso(subMonths(today, 36)), updated_at: iso(today) },
  { id: 'ct-10', owner_id: DEMO_USER_ID, kind: 'other',
    full_name: 'Aviva Insurance', company: 'Aviva', trade: 'Insurer',
    email: 'claims@aviva.co.uk', phone: '0800 056 2192',
    address: null, notes: 'Buildings insurance across multiple properties.',
    is_active: true, property_id: null,
    created_at: iso(subMonths(today, 24)), updated_at: iso(today) },
]

// ---- MTD transactions ----
// Mirrors the totals from the HMRC quarterly property template applied to William Street.
function inCurrentQuarter(daysAgo: number) {
  const clamped = Math.min(45, Math.max(2, daysAgo))
  return ymd(subDays(today, clamped))
}

const mtd_transactions = [
  // William Street income (the "main" example matching the template)
  { id: 'mtd-1',  property_id: PROP_WILLIAM, document_id: null, kind: 'income',  income_category: 'period_amount', expense_category: null,
    transaction_date: inCurrentQuarter(45), amount: 6000.00, description: 'Q1 rent received', supplier_or_payer: 'Kamran Shah', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 45)) },
  { id: 'mtd-2',  property_id: PROP_WILLIAM, document_id: null, kind: 'income',  income_category: 'rent_a_room',  expense_category: null,
    transaction_date: inCurrentQuarter(40), amount: 500.00, description: 'Rent A Room scheme', supplier_or_payer: 'Lodger', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 40)) },
  { id: 'mtd-3',  property_id: PROP_WILLIAM, document_id: null, kind: 'income',  income_category: 'other_income', expense_category: null,
    transaction_date: inCurrentQuarter(30), amount: 100.00, description: 'Parking permit reimbursement', supplier_or_payer: 'Tenant', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 30)) },
  { id: 'mtd-4',  property_id: PROP_WILLIAM, document_id: null, kind: 'income',  income_category: 'tax_deducted', expense_category: null,
    transaction_date: inCurrentQuarter(20), amount: 600.00, description: 'Tax deducted at source', supplier_or_payer: 'Letting agent', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 20)) },

  // William Street expenses (24 categories)
  { id: 'mtd-5',  property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'other',
    transaction_date: inCurrentQuarter(42), amount: 1000.00, description: 'Misc property expenses', supplier_or_payer: 'Various', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 42)) },
  { id: 'mtd-6',  property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'council_tax',
    transaction_date: inCurrentQuarter(40), amount: 200.00, description: 'Council Tax (void period)', supplier_or_payer: 'Luton Borough Council', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 40)) },
  { id: 'mtd-7',  property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'light_and_heat',
    transaction_date: inCurrentQuarter(38), amount: 150.00, description: 'Gas and electricity', supplier_or_payer: 'British Gas', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 38)) },
  { id: 'mtd-8',  property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'water_rates',
    transaction_date: inCurrentQuarter(36), amount: 90.00, description: 'Water rates', supplier_or_payer: 'Affinity Water', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 36)) },
  { id: 'mtd-9',  property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'white_goods',
    transaction_date: inCurrentQuarter(34), amount: 368.00, description: 'Replacement washing machine', supplier_or_payer: 'AO', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 34)) },
  { id: 'mtd-10', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'insurance',
    transaction_date: inCurrentQuarter(32), amount: 162.00, description: 'Buildings insurance quarterly', supplier_or_payer: 'Aviva', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 32)) },
  { id: 'mtd-11', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'window_cleaning',
    transaction_date: inCurrentQuarter(30), amount: 70.00, description: 'Window cleaning', supplier_or_payer: 'Crystal Clean', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 30)) },
  { id: 'mtd-12', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'general_cleaning',
    transaction_date: inCurrentQuarter(28), amount: 50.00, description: 'End of tenancy clean', supplier_or_payer: 'Sparkle Services', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 28)) },
  { id: 'mtd-13', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'oven_cleaning',
    transaction_date: inCurrentQuarter(26), amount: 25.00, description: 'Oven deep clean', supplier_or_payer: 'OvenPros', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 26)) },
  { id: 'mtd-14', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'gardening',
    transaction_date: inCurrentQuarter(24), amount: 210.00, description: 'Gardener Q1', supplier_or_payer: 'Greenscape', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 24)) },
  { id: 'mtd-15', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'premise_running_costs',
    transaction_date: inCurrentQuarter(22), amount: 1100.00, description: 'Premises running costs', supplier_or_payer: 'Various', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 22)) },
  { id: 'mtd-16', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'telephone',
    transaction_date: inCurrentQuarter(20), amount: 32.00, description: 'Property line', supplier_or_payer: 'BT', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 20)) },
  { id: 'mtd-17', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'professional_fees',
    transaction_date: inCurrentQuarter(18), amount: 1200.00, description: 'Letting agent fees', supplier_or_payer: 'NorthLets', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 18)) },
  { id: 'mtd-18', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'legal_fees',
    transaction_date: inCurrentQuarter(16), amount: 50.00, description: 'Legal advice', supplier_or_payer: 'Cooper & Co Solicitors', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 16)) },
  { id: 'mtd-19', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'rent_a_room_expense',
    transaction_date: inCurrentQuarter(15), amount: 1300.00, description: 'Rent A Room expenses', supplier_or_payer: 'Various', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 15)) },
  { id: 'mtd-20', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'redecorating',
    transaction_date: inCurrentQuarter(14), amount: 41.00, description: 'Paint and brushes', supplier_or_payer: 'B&Q', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 14)) },
  { id: 'mtd-21', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'ground_rent',
    transaction_date: inCurrentQuarter(13), amount: 60.00, description: 'Ground rent', supplier_or_payer: 'Freeholder', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 13)) },
  { id: 'mtd-22', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'service_charges',
    transaction_date: inCurrentQuarter(12), amount: 170.00, description: 'Block service charge', supplier_or_payer: 'Block Management', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 12)) },
  { id: 'mtd-23', property_id: PROP_WILLIAM, document_id: 'doc-4', kind: 'expense', income_category: null, expense_category: 'repairs_and_maintenance',
    transaction_date: inCurrentQuarter(10), amount: 1400.00, description: 'Boiler service and shower repair', supplier_or_payer: 'Northwood Gas + Dave\'s Plumbing', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 10)) },
  { id: 'mtd-24', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'btl_mortgage_interest',
    transaction_date: inCurrentQuarter(9), amount: 1500.00, description: 'BTL mortgage interest', supplier_or_payer: 'Barclays', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 9)) },
  { id: 'mtd-25', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'other_finance_costs',
    transaction_date: inCurrentQuarter(8), amount: 20.00, description: 'Mortgage arrangement', supplier_or_payer: 'Barclays', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 8)) },
  { id: 'mtd-26', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'accountancy_fees',
    transaction_date: inCurrentQuarter(7), amount: 300.00, description: 'Quarterly accountancy', supplier_or_payer: 'Smith & Brown', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 7)) },
  { id: 'mtd-27', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'bank_charges',
    transaction_date: inCurrentQuarter(5), amount: 12.00, description: 'Business banking fee', supplier_or_payer: 'Barclays', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 5)) },
  { id: 'mtd-28', property_id: PROP_WILLIAM, document_id: null, kind: 'expense', income_category: null, expense_category: 'travel_costs',
    transaction_date: inCurrentQuarter(3), amount: 1700.00, description: 'Property visits, mileage', supplier_or_payer: 'Mileage claim', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 3)) },

  // Turners Road (lighter)
  { id: 'mtd-29', property_id: PROP_TURNERS, document_id: null, kind: 'income', income_category: 'period_amount', expense_category: null,
    transaction_date: inCurrentQuarter(45), amount: 2850.00, description: 'Q1 rent', supplier_or_payer: 'Robert Andrews', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 45)) },
  { id: 'mtd-30', property_id: PROP_TURNERS, document_id: null, kind: 'expense', income_category: null, expense_category: 'btl_mortgage_interest',
    transaction_date: inCurrentQuarter(20), amount: 850.00, description: 'BTL mortgage interest', supplier_or_payer: 'NatWest', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 20)) },

  // Birchengrove (lighter)
  { id: 'mtd-31', property_id: PROP_BIRCHEN, document_id: null, kind: 'income', income_category: 'period_amount', expense_category: null,
    transaction_date: inCurrentQuarter(45), amount: 3825.00, description: 'Q1 rent', supplier_or_payer: 'Lauren Mitchell', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 45)) },
  { id: 'mtd-32', property_id: PROP_BIRCHEN, document_id: 'doc-6', kind: 'expense', income_category: null, expense_category: 'repairs_and_maintenance',
    transaction_date: inCurrentQuarter(30), amount: 125.00, description: 'Boiler service', supplier_or_payer: 'Yorkshire Gas', notes: null,
    created_by: DEMO_USER_ID, created_at: iso(subDays(today, 30)) },
]

// ---- invoices (outgoing) ----
const invoices = [
  { id: 'inv-1', owner_id: DEMO_USER_ID, contact_id: 'ct-1', property_id: PROP_WILLIAM,
    invoice_number: 'INV-01001', type: 'rent', status: 'paid',
    contact_name: 'Kamran Shah', contact_email: 'kamran.shah@example.com', contact_address: 'William Street, Luton LU2 7RE',
    issue_date: ymd(subDays(today, 30)), due_date: ymd(subDays(today, 25)), payment_terms: 'On receipt',
    subtotal: 1100, vat_amount: 0, total: 1100, amount_paid: 1100, notes: null,
    sent_at: iso(subDays(today, 30)), paid_at: iso(subDays(today, 28)),
    created_at: iso(subDays(today, 30)), updated_at: iso(today) },
  { id: 'inv-2', owner_id: DEMO_USER_ID, contact_id: 'ct-2', property_id: PROP_TURNERS,
    invoice_number: 'INV-01002', type: 'rent', status: 'overdue',
    contact_name: 'Robert Andrews', contact_email: 'r.andrews@example.com', contact_address: 'Turners Road South, Luton LU3 3DR',
    issue_date: ymd(subDays(today, 25)), due_date: ymd(subDays(today, 5)), payment_terms: 'Net 20',
    subtotal: 950, vat_amount: 0, total: 950, amount_paid: 0, notes: 'Reminder sent.',
    sent_at: iso(subDays(today, 25)), paid_at: null,
    created_at: iso(subDays(today, 25)), updated_at: iso(today) },
  { id: 'inv-3', owner_id: DEMO_USER_ID, contact_id: 'ct-7', property_id: PROP_BIRCHEN,
    invoice_number: 'INV-01003', type: 'ad_hoc', status: 'partial',
    contact_name: 'Lauren Mitchell', contact_email: 'lauren.mitchell@example.com', contact_address: 'Birchengrove, Luton LU3 1LF',
    issue_date: ymd(subDays(today, 20)), due_date: ymd(addDays(today, 10)), payment_terms: 'Net 30',
    subtotal: 1275, vat_amount: 0, total: 1275, amount_paid: 637.50, notes: 'Half paid.',
    sent_at: iso(subDays(today, 20)), paid_at: null,
    created_at: iso(subDays(today, 20)), updated_at: iso(today) },
  { id: 'inv-4', owner_id: DEMO_USER_ID, contact_id: 'ct-1', property_id: PROP_WILLIAM,
    invoice_number: 'INV-01004', type: 'ad_hoc', status: 'sent',
    contact_name: 'Kamran Shah', contact_email: 'kamran.shah@example.com', contact_address: 'William Street, Luton LU2 7RE',
    issue_date: ymd(subDays(today, 3)), due_date: ymd(addDays(today, 27)), payment_terms: 'Net 30',
    subtotal: 75, vat_amount: 15, total: 90, amount_paid: 0,
    notes: 'Replacement front door key.',
    sent_at: iso(subDays(today, 3)), paid_at: null,
    created_at: iso(subDays(today, 3)), updated_at: iso(today) },
  { id: 'inv-5', owner_id: DEMO_USER_ID, contact_id: 'ct-2', property_id: PROP_TURNERS,
    invoice_number: 'INV-01005', type: 'ad_hoc', status: 'draft',
    contact_name: 'Robert Andrews', contact_email: 'r.andrews@example.com', contact_address: 'Turners Road South, Luton LU3 3DR',
    issue_date: ymd(today), due_date: ymd(addDays(today, 30)), payment_terms: 'Net 30',
    subtotal: 200, vat_amount: 0, total: 200, amount_paid: 0,
    notes: 'End of tenancy clean (cost split).',
    sent_at: null, paid_at: null,
    created_at: iso(today), updated_at: iso(today) },
]

const invoice_line_items = [
  { id: 'il-1', invoice_id: 'inv-1', description: 'May 2026 rent', quantity: 1, unit_price: 1100, vat_rate: 0, line_total: 1100, sort_order: 0, created_at: iso(subDays(today, 30)) },
  { id: 'il-2', invoice_id: 'inv-2', description: 'May 2026 rent', quantity: 1, unit_price: 950, vat_rate: 0, line_total: 950, sort_order: 0, created_at: iso(subDays(today, 25)) },
  { id: 'il-3', invoice_id: 'inv-3', description: 'May 2026 rent', quantity: 1, unit_price: 1275, vat_rate: 0, line_total: 1275, sort_order: 0, created_at: iso(subDays(today, 20)) },
  { id: 'il-4', invoice_id: 'inv-4', description: 'Replacement front door key (incl VAT)', quantity: 1, unit_price: 75, vat_rate: 20, line_total: 90, sort_order: 0, created_at: iso(subDays(today, 3)) },
  { id: 'il-5', invoice_id: 'inv-5', description: 'Professional cleaning recharge', quantity: 1, unit_price: 200, vat_rate: 0, line_total: 200, sort_order: 0, created_at: iso(today) },
]

// ---- conversations + messages ----
const conversations = [
  { id: 'cv-1', owner_id: DEMO_USER_ID, contact_id: 'ct-1', property_id: PROP_WILLIAM,
    category: 'tenant', subject: 'Shower repair update', is_archived: false,
    last_message_at: iso(subDays(today, 2)), created_at: iso(subDays(today, 3)) },
  { id: 'cv-2', owner_id: DEMO_USER_ID, contact_id: 'ct-2', property_id: PROP_TURNERS,
    category: 'tenant', subject: 'Rent payment delay', is_archived: false,
    last_message_at: iso(subDays(today, 0)), created_at: iso(subDays(today, 1)) },
  { id: 'cv-3', owner_id: DEMO_USER_ID, contact_id: 'ct-3', property_id: null,
    category: 'other', subject: "Dave's Plumbing scheduling", is_archived: false,
    last_message_at: iso(subDays(today, 2)), created_at: iso(subDays(today, 3)) },
]

const messages = [
  { id: 'mg-1', conversation_id: 'cv-1', sender: 'tenant', sender_name: 'Kamran Shah',
    body: 'Hi, the shower is not producing any water. Started this morning. Uploaded photos.',
    sent_at: iso(subDays(today, 3)), read_at: iso(subDays(today, 3)) },
  { id: 'mg-2', conversation_id: 'cv-1', sender: 'landlord', sender_name: 'Sam Blake',
    body: "Sorry to hear that. I've booked Dave's Plumbing for 2 June at 10am.",
    sent_at: iso(subDays(today, 2)), read_at: iso(subDays(today, 2)) },
  { id: 'mg-3', conversation_id: 'cv-1', sender: 'tenant', sender_name: 'Kamran Shah',
    body: 'Brilliant, thank you. I will be home.',
    sent_at: iso(subDays(today, 2)), read_at: null },

  { id: 'mg-4', conversation_id: 'cv-2', sender: 'tenant', sender_name: 'Robert Andrews',
    body: 'Sorry, my bank transfer is delayed. Will pay this week.',
    sent_at: iso(subDays(today, 1)), read_at: iso(subDays(today, 1)) },
  { id: 'mg-5', conversation_id: 'cv-2', sender: 'landlord', sender_name: 'Sam Blake',
    body: 'Thanks for letting me know. Please confirm once paid.',
    sent_at: iso(today), read_at: null },

  { id: 'mg-6', conversation_id: 'cv-3', sender: 'landlord', sender_name: 'Sam Blake',
    body: 'Hi Dave, confirming William Street shower visit Wednesday 10am.',
    sent_at: iso(subDays(today, 3)), read_at: iso(subDays(today, 3)) },
  { id: 'mg-7', conversation_id: 'cv-3', sender: 'tenant', sender_name: "Dave O'Connor",
    body: 'Confirmed. Will bring spare cartridge and supply line just in case.',
    sent_at: iso(subDays(today, 2)), read_at: iso(subDays(today, 2)) },
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
