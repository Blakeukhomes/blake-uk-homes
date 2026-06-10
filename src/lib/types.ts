// Database row types. Keep these aligned with the SQL migration.

export type UserRole = 'owner' | 'manager' | 'readonly' | 'tenant'
export type ContactKind = 'tenant' | 'contractor' | 'supplier' | 'agent' | 'other'
export type MortgageType = 'repayment' | 'interest_only' | 'part_and_part'
export type MortgageRateKind = 'fixed' | 'variable' | 'tracker' | 'discount'

export interface Mortgage {
  id: string
  property_id: string
  lender: string
  account_number: string | null
  mortgage_type: MortgageType
  rate_kind: MortgageRateKind
  interest_rate: number | null
  monthly_payment: number | null
  monthly_interest: number | null
  outstanding_balance: number | null
  fix_end_date: string | null
  start_date: string | null
  product_end_date: string | null
  statement_document_id: string | null
  offer_document_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  owner_id: string
  kind: ContactKind
  full_name: string
  company: string | null
  trade: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  property_id: string | null
  created_at: string
  updated_at: string
}
export type PropertyStatus = 'tenanted' | 'vacant' | 'legal_proceedings'
export type ComplianceType = 'gas_safety' | 'eicr' | 'epc' | 'buildings_insurance' | 'legionella' | 'ico_registration'
export type RentStatus = 'paid' | 'late' | 'missing' | 'partial'
export type MaintenanceKind = 'inspection' | 'task'
export type FaultSeverity = 'emergency' | 'urgent' | 'standard' | 'minor'
export type FaultState =
  | 'reported'
  | 'acknowledged'
  | 'contractor_booked'
  | 'in_progress'
  | 'resolved'
  | 'closed'
export type JourneyStep =
  | 'property_setup'
  | 'tenant_onboarding'
  | 'tenancy_agreement'
  | 'deposit'
  | 'move_in_inventory'
  | 'keys_handed_over'
  | 'active_tenancy'
  | 'move_out_inspection'
  | 'deposit_resolution'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  owner_id: string
  nickname: string
  address_line_1: string
  address_line_2: string | null
  city: string
  postcode: string
  property_type: string | null
  bedrooms: number | null
  monthly_rent: number | null
  rent_due_day: number
  status: PropertyStatus
  hero_image_url: string | null
  notes: string | null
  property_income_allowance?: boolean
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string
  property_id: string
  full_name: string
  email: string | null
  phone: string | null
  auth_user_id: string | null
  portal_token: string
  tenancy_start: string | null
  tenancy_end: string | null
  deposit_amount: number | null
  deposit_scheme: string | null
  is_active: boolean
  created_at: string
}

export interface ComplianceCertificate {
  id: string
  property_id: string
  type: ComplianceType
  completed_on: string
  expires_on: string
  document_id: string | null
  issued_by: string | null
  reference: string | null
  notes: string | null
  created_at: string
}

export interface RentPayment {
  id: string
  property_id: string
  tenant_id: string | null
  period_start: string
  due_date: string
  amount_due: number
  amount_paid: number
  received_on: string | null
  status: RentStatus
  notes: string | null
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'scheduled' | 'in_progress' | 'resolved' | 'overdue' | 'rejected' | 'archived' | 'cancelled'

export type ConversationCategory = 'tenant' | 'enquiry' | 'viewing' | 'other'
export type MessageSender = 'landlord' | 'tenant' | 'system'

export interface Conversation {
  id: string
  owner_id: string
  contact_id: string | null
  property_id: string | null
  category: ConversationCategory
  subject: string | null
  is_archived: boolean
  last_message_at: string | null
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender: MessageSender
  sender_name: string | null
  body: string
  sent_at: string
  read_at: string | null
}

export type InvoiceType = 'ad_hoc' | 'recurring' | 'rent' | 'deposit' | 'other'
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'overdue' | 'partial' | 'paid' | 'void'

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  vat_rate: number
  line_total: number
  sort_order: number
}

export interface Invoice {
  id: string
  owner_id: string
  contact_id: string | null
  property_id: string | null
  invoice_number: string
  type: InvoiceType
  status: InvoiceStatus
  contact_name: string
  contact_email: string | null
  contact_address: string | null
  issue_date: string
  due_date: string
  payment_terms: string | null
  subtotal: number
  vat_amount: number
  total: number
  amount_paid: number
  notes: string | null
  sent_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface MaintenanceTask {
  id: string
  property_id: string
  kind: MaintenanceKind
  title: string
  description: string | null
  due_on: string
  completed_on: string | null
  recur_days: number | null
  notes: string | null
  priority?: TicketPriority
  status?: TicketStatus
  contractor_id?: string | null
  reported_by?: string | null
  resolved_on?: string | null
}

export interface FaultReport {
  id: string
  reference: string
  property_id: string
  tenant_id: string | null
  category: string
  severity: FaultSeverity
  description: string
  reporter_name: string
  reporter_phone: string | null
  reporter_email: string | null
  current_state: FaultState
  reported_at: string
  resolved_at: string | null
}

export interface FaultEvent {
  id: string
  fault_id: string
  occurred_at: string
  actor_role: UserRole | null
  actor_name: string | null
  state: FaultState
  note: string | null
}

export interface ContractorBooking {
  id: string
  fault_id: string | null
  property_id: string
  contractor_name: string
  trade: string | null
  phone: string | null
  scheduled_for: string
  notes: string | null
}

export type DocumentKind =
  | 'gas_safety'
  | 'eicr'
  | 'epc'
  | 'buildings_insurance'
  | 'legionella'
  | 'ico_registration'
  | 'tenancy_agreement'
  | 'deposit_certificate'
  | 'how_to_rent'
  | 'inventory_move_in'
  | 'inventory_move_out'
  | 'invoice'
  | 'other'

export interface DocumentRow {
  id: string
  property_id: string
  uploaded_by: string | null
  kind: DocumentKind
  title: string
  storage_path: string
  mime_type: string | null
  file_size: number | null
  ai_summary: string | null
  ai_summary_at: string | null
  visible_to_tenant: boolean
  created_at: string
}

export interface TenancyJourney {
  id: string
  property_id: string
  tenant_id: string | null
  step: JourneyStep
  completed_on: string | null
  landlord_sign: boolean
  tenant_sign: boolean
  notes: string | null
}
