import Link from 'next/link'
import { ArrowRight, ShieldCheck, Banknote, FileText, Users, Sparkles, Bell, Receipt } from 'lucide-react'
import { Logo } from '@/components/logo'
import { HeroHouse, House } from '@/components/house'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b hairline border-b-ink-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-700">
            <a href="#features" className="hover:text-ink-900">Features</a>
            <a href="#mtd"      className="hover:text-ink-900">MTD ready</a>
            <a href="#tenant"   className="hover:text-ink-900">Tenant portal</a>
            <a href="#court"    className="hover:text-ink-900">Court ready</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href="/signup"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent-600">Private landlord workspace</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-ink-900 md:text-5xl">
              Run your residential portfolio
              <span className="block text-accent-600">like a professional.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-600">
              Compliance, rent, tenant communication, and HMRC quarterly tax reporting in one private workspace. Built for UK landlords under Making Tax Digital and the Renters Rights Act 2025.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg">
                  Open your portfolio <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline">See what's inside</Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-4 text-xs text-ink-500">
              <Shield label="Court ready" />
              <Shield label="MTD ITSA" />
              <Shield label="PWA / offline" />
            </div>
          </div>

          {/* Hero house */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-8 -z-10 rounded-full bg-accent-100 blur-3xl opacity-60" />
              <HeroHouse className="h-[360px] w-[360px]" />
            </div>
          </div>
        </div>
      </section>

      {/* Street row preview */}
      <section className="border-y hairline border-y-ink-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-accent-600">Your whole street, one screen</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-900 md:text-3xl">
            Every property at a glance. Traffic lights tell you what needs you.
          </h2>

          <div className="mt-8 overflow-hidden rounded-xl2 border hairline border-ink-100 bg-ink-50 p-6">
            <div className="flex items-end justify-around gap-3 overflow-x-auto">
              <SamplePillar label="Hollow Lane" status="tenanted" alerts={0} />
              <SamplePillar label="Saxon Court" status="tenanted" alerts={1} />
              <SamplePillar label="Marlow"      status="vacant"   alerts={2} />
              <SamplePillar label="Turners Rd"  status="tenanted" alerts={0} />
              <SamplePillar label="Butterworth" status="legal_proceedings" alerts={1} />
            </div>
            <div className="-mx-6 mt-2 flex h-7 items-center gap-3 bg-ink-700 px-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-1 w-8 rounded-full bg-warning-500 opacity-80" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-accent-600">Everything in one place</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl">
            Compliance, rent, tax, tenants. One private workspace.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl2 border hairline border-ink-100 bg-white p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500 text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MTD section */}
      <section id="mtd" className="bg-ink-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent-300">Making Tax Digital, built in</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Quarterly submissions, ready to file.
            </h2>
            <p className="mt-4 max-w-xl text-ink-300">
              Every invoice you upload is tagged against the exact HMRC ITSA category. The MTD page rolls them into a clean quarterly summary per property, ready to feed your bridging software or your accountant.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ink-200">
              <li>Q1 6 Apr to 5 Jul, Q2 6 Jul to 5 Oct, Q3 6 Oct to 5 Jan, Q4 6 Jan to 5 Apr</li>
              <li>All 24 expense categories plus income (Period Amount, Rent A Room, Other, Tax Deducted)</li>
              <li>One-click quarterly PDF per property</li>
            </ul>
          </div>

          <div className="rounded-xl2 bg-white p-6 text-ink-900 shadow-elevated">
            <p className="text-xs uppercase tracking-wide text-ink-500">Quarter ending 5 Jul 2026</p>
            <p className="mt-1 text-lg font-semibold">Hollow Lane Flat</p>
            <table className="mt-4 w-full text-sm">
              <tbody>
                <Row label="Period Amount (rent)"        value="£4,350" tone="success" />
                <Row label="Other Income"                value="£100"   tone="success" />
                <Row label="Repairs and Maintenance"     value="£420"   />
                <Row label="Insurance"                   value="£162"   />
                <Row label="Council Tax"                 value="£200"   />
                <Row label="Light and Heat"              value="£150"   />
                <Row label="BTL Mortgage Interest"       value="£1,500" />
                <Row label="Accountancy fees"            value="£300"   />
              </tbody>
              <tfoot>
                <tr className="border-t hairline border-t-ink-200">
                  <td className="py-2 text-sm font-semibold">Net for quarter</td>
                  <td className="py-2 text-right text-sm font-semibold text-ink-900">£1,718</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* Tenant portal split */}
      <section id="tenant" className="bg-ink-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="mx-auto max-w-sm rounded-xl2 bg-ink-900 p-2 shadow-elevated">
              <div className="rounded-xl bg-white p-6">
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Blake UK Homes</p>
                  <p className="mt-1 text-sm text-ink-500">Hello, Kamran</p>
                  <p className="mt-1 text-xs text-ink-400">William Street, Luton</p>
                </div>
                <div className="my-6 flex justify-center">
                  <HeroHouse className="h-32 w-32" />
                </div>
                <div className="rounded-lg bg-warning-50 px-4 py-3 text-xs text-warning-700 ring-1 ring-warning-500/30">
                  <p className="font-semibold">Active repair</p>
                  <p>Plumbing, shower fault</p>
                  <p className="mt-1 text-ink-600">Dave's Plumbing, 2 June at 10am</p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-600">Tenant portal</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl">
              Your tenants get the same view you do.
            </h2>
            <p className="mt-4 max-w-xl text-ink-600">
              Every property gets a unique tenant portal. Tenants report faults with photos and video, see contractor bookings live, and follow the tenancy journey from move-in to move-out. Everything timestamped. Nothing hidden.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink-700">
              <li className="flex gap-3"><span className="text-accent-500">●</span> Guided fault reporting with mandatory photo and video</li>
              <li className="flex gap-3"><span className="text-accent-500">●</span> Reference number, timestamp, live status</li>
              <li className="flex gap-3"><span className="text-accent-500">●</span> Contractor name and appointment visible automatically</li>
              <li className="flex gap-3"><span className="text-accent-500">●</span> Shared tenancy journey, both sides see identical progress</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Court-ready */}
      <section id="court" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="rounded-xl2 border hairline border-ink-100 bg-white p-8 shadow-card">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-600">Court-ready evidence</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-ink-900">Fault transcript, PDF preview</h3>
            <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-ink-50 p-4 text-xs leading-5 text-ink-700">
{`PROPERTY      37 Hollow Lane, Manchester, M14 6PQ
TENANT        J. Patel
REFERENCE     FR-3A92B1F0
REPORTED      14 May 2026 09:12 by J. Patel (tenant)

CHRONOLOGY
 14 May 09:12  Fault reported. Photos x3, video x1 attached.
 14 May 09:14  Auto-acknowledged. Tenant emailed.
 14 May 11:02  Landlord acknowledged.
 14 May 14:55  Contractor booked: O'Connor Plumbing, 16 May 10:00.
 16 May 11:45  Contractor reports resolved. Parts replaced.
 16 May 17:21  Tenant confirms resolved.

All entries timestamped at point of submission. Cannot be
retrospectively altered. Suitable for county court submission.`}
            </pre>
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl">
              Every action timestamped. One button to print it.
            </h2>
            <p className="mt-4 max-w-xl text-ink-600">
              When a dispute reaches court, you need clean chronological evidence, not a trail of screenshots. Blake UK Homes generates print-ready PDFs for fault transcripts, rent arrears, and Section 13 rent increase notices, formatted for tribunal and county court submission.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t hairline border-t-ink-100 bg-ink-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 text-xs text-ink-500">
          <Logo />
          <p>© {new Date().getFullYear()} Blake UK Homes. A private portfolio tool.</p>
        </div>
      </footer>
    </div>
  )
}

const FEATURES = [
  { icon: ShieldCheck, title: 'Compliance tracker',
    body: 'Gas Safety, EICR, EPC, Buildings Insurance. Auto-calculated expiry, 60 to 90 day warnings, document attachment.' },
  { icon: Banknote, title: 'Rent ledger',
    body: 'Monthly rent log with paid, late, missing, partial. Arrears computed automatically. 6-month rolling history.' },
  { icon: Receipt, title: 'MTD quarterly tax',
    body: 'Income and expenses tagged to HMRC ITSA categories. Quarterly summary PDF per property, ready for your accountant.' },
  { icon: FileText, title: 'Section 13 generator',
    body: 'Print-ready rent increase notice. Effective date auto-calculated under the Renters Rights Act 2025.' },
  { icon: Users, title: 'Tenant portal',
    body: 'Per-property URL. Guided fault reporting with photos and video. Shared tenancy journey.' },
  { icon: Bell, title: 'Notifications',
    body: 'Email and push reminders for compliance, inspections, rent, and unresolved faults.' },
  { icon: Sparkles, title: 'Claude AI summaries',
    body: 'Drop any document. Claude extracts key dates, parties, obligations, and risks.' },
]

function Row({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
  return (
    <tr className="border-t hairline border-t-ink-100">
      <td className="py-2 text-sm text-ink-700">{label}</td>
      <td className={`py-2 text-right text-sm font-medium ${tone === 'success' ? 'text-success-700' : 'text-ink-900'}`}>{value}</td>
    </tr>
  )
}

function Shield({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 ring-1 ring-ink-200">
      <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
      {label}
    </span>
  )
}

function SamplePillar({ label, status, alerts }: { label: string; status: 'tenanted'|'vacant'|'legal_proceedings'; alerts: number }) {
  return (
    <div className="flex w-[100px] flex-col items-center">
      <House status={status} hasAlert={alerts > 0} />
      <p className="mt-2 truncate text-xs font-semibold text-ink-800">{label}</p>
      <p className="text-[10px] text-ink-500">
        {status === 'tenanted' ? 'Tenanted' : status === 'legal_proceedings' ? 'Legal' : 'Vacant'}
        {alerts > 0 && <span className="ml-1 text-warning-700">· {alerts} alert{alerts > 1 ? 's' : ''}</span>}
      </p>
    </div>
  )
}
