import Link from 'next/link'
import {
  FileText, Building, BarChart3, ListTree, Users2, Banknote,
  Clock, AlertTriangle, Receipt, ShieldCheck, ArrowRight, Sparkles
} from 'lucide-react'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { TicketTabs } from '@/components/ticket-tabs'

export const dynamic = 'force-dynamic'

type ReportCategory = 'all' | 'accounting' | 'rent' | 'expenses' | 'property_management' | 'compliance' | 'custom'

interface Report {
  title: string
  description: string
  icon: any
  href?: string // direct PDF route if implemented
  category: Exclude<ReportCategory, 'all'>
  status?: 'ready' | 'coming_soon'
}

const REPORTS: Report[] = [
  // Accounting
  { title: 'Income & Expense Statement', description: 'Comprehensive breakdown of all income and expenses over a period.', icon: BarChart3, category: 'accounting', status: 'coming_soon' },
  { title: 'Property Income & Expense',  description: 'Summary of financial performance grouped by property.',           icon: Building,  category: 'accounting', status: 'coming_soon' },
  { title: 'P&L Summary',                description: 'High-level profit and loss overview.',                            icon: BarChart3, category: 'accounting', status: 'coming_soon' },
  { title: 'Breakdown Statement',        description: 'Detailed itemized list of all financial transactions.',           icon: ListTree,  category: 'accounting', status: 'coming_soon' },
  { title: 'Account Transactions',       description: 'Full ledger of all account activity.',                            icon: ListTree,  category: 'accounting', status: 'coming_soon' },
  { title: 'Supplier Expenses',          description: 'Expenses grouped by supplier or contractor.',                     icon: Users2,    category: 'expenses',   status: 'coming_soon' },
  { title: 'Bank Reconciliation',        description: 'Overview of bank transaction matching status.',                   icon: ListTree,  category: 'accounting', status: 'coming_soon' },

  // Rent
  { title: 'Rent Ledger',                description: 'Complete history of rent charges and payments per property.',     icon: Banknote, category: 'rent' },
  { title: 'Overdue Rent Payments',      description: 'Outstanding tenant balances and late fees. Section 8 ready PDF.', icon: AlertTriangle, category: 'rent' },
  { title: 'Upcoming Rent Payments',     description: 'Scheduled rent due dates and expected totals.',                   icon: Clock,    category: 'rent', status: 'coming_soon' },

  // Property management
  { title: 'Fault Transcript',           description: 'Court-ready timestamped fault chronology, per fault.',             icon: FileText, category: 'property_management' },
  { title: 'Section 13 Notice',          description: 'Print-ready rent increase notice with full statutory wording.',    icon: FileText, category: 'property_management' },
  { title: 'Tenancy Journey',            description: 'Status of every tenancy from setup to deposit resolution.',        icon: ListTree, category: 'property_management', status: 'coming_soon' },

  // Compliance
  { title: 'Compliance Status',          description: 'Per-property Gas Safety, EICR, EPC, Buildings Insurance status.', icon: ShieldCheck, category: 'compliance', status: 'coming_soon' },

  // MTD (under accounting)
  { title: 'MTD Quarterly Summary',      description: 'HMRC ITSA categories per property for the chosen quarter.',       icon: Receipt,  category: 'accounting' },

  // Custom
  { title: 'Custom report',              description: 'Build your own report with the AI assistant.',                    icon: Sparkles, category: 'custom', status: 'coming_soon' },
]

const TABS: { value: string; label: string }[] = [
  { value: 'all',                  label: 'All' },
  { value: 'accounting',           label: 'Accounting' },
  { value: 'rent',                 label: 'Rent payments' },
  { value: 'expenses',             label: 'Expenses' },
  { value: 'property_management',  label: 'Property management' },
  { value: 'compliance',           label: 'Compliance' },
  { value: 'custom',               label: 'Custom' },
]

export default function ReportsPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const category = (searchParams.status ?? 'all') as ReportCategory
  const query = (searchParams.q ?? '').toLowerCase()

  let rows = REPORTS
  if (category !== 'all') rows = rows.filter((r) => r.category === category)
  if (query) rows = rows.filter((r) =>
    r.title.toLowerCase().includes(query) ||
    r.description.toLowerCase().includes(query)
  )

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="View, generate, and export your property and financial reports."
      />
      <div className="p-6 space-y-6">
        <Card>
          <CardBody>
            <TicketTabs tabs={TABS} selected={category} q={query} />
          </CardBody>
        </Card>

        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => {
            const Icon = r.icon
            const isReady = r.status !== 'coming_soon'
            const card = (
              <Card className={`h-full transition-shadow ${isReady ? 'hover:shadow-elevated' : 'opacity-75'}`}>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink-900">{r.title}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{r.description}</p>
                    </div>
                    {isReady && <ArrowRight className="h-4 w-4 text-accent-600" />}
                    {!isReady && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">Soon</span>}
                  </div>
                </CardBody>
              </Card>
            )

            // Wire known PDF routes
            if (r.title === 'Rent Ledger' || r.title === 'Overdue Rent Payments') {
              return <Link key={r.title} href={`/rent`}>{card}</Link>
            }
            if (r.title === 'Fault Transcript') {
              return <Link key={r.title} href={`/faults`}>{card}</Link>
            }
            if (r.title === 'Section 13 Notice') {
              return <Link key={r.title} href={`/notices`}>{card}</Link>
            }
            if (r.title === 'MTD Quarterly Summary') {
              return <Link key={r.title} href={`/mtd`}>{card}</Link>
            }
            return <div key={r.title}>{card}</div>
          })}
        </div>
      </div>
    </>
  )
}
