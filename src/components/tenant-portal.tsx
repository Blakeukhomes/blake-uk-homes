'use client'
import { useState } from 'react'
import { WelcomeHouse, HomeHouse } from '@/components/house'
import { cn } from '@/lib/cn'

type Screen = 'welcome' | 'home' | 'docs' | 'faults' | 'report' | 'confirm'

const CATEGORIES = [
  { label: 'Plumbing',     icon: '🚿' },
  { label: 'Electrical',   icon: '⚡' },
  { label: 'Heating',      icon: '🔥' },
  { label: 'Structural',   icon: '🏚️' },
  { label: 'Damp / Mould', icon: '💧' },
  { label: 'Appliance',    icon: '🔧' },
  { label: 'Security',     icon: '🔒' },
  { label: 'Other',        icon: '📋' },
]

const DOC_ICONS: Record<string, string> = {
  tenancy_agreement:   '📄',
  deposit_certificate: '🔐',
  how_to_rent:         '📖',
  gas_safety:          '🔥',
  epc:                 '🌿',
  eicr:                '⚡',
  legionella:          '💧',
  buildings_insurance: '🛡️',
  inventory_move_in:   '📋',
  inventory_move_out:  '📋',
  invoice:             '🧾',
  other:               '📄',
}
const DOC_LABEL: Record<string, string> = {
  tenancy_agreement:   'Tenancy Agreement',
  deposit_certificate: 'Deposit Certificate',
  how_to_rent:         'How to Rent Guide',
  gas_safety:          'Gas Safety Certificate',
  epc:                 'EPC Certificate',
  eicr:                'EICR',
  legionella:          'Legionella Assessment',
  buildings_insurance: 'Buildings Insurance',
  inventory_move_in:   'Move-in Inventory',
  inventory_move_out:  'Move-out Inventory',
  invoice:             'Invoice',
  other:               'Document',
}

export interface TenantPortalProps {
  tenantId: string
  portalToken: string
  firstName: string
  streetName: string
  fullAddress: string
  documents: { id: string; kind: string; title: string; created_at: string }[]
  activeFault: {
    category: string
    description: string
    status: string
    scheduled: { contractor: string; when: string } | null
    reported_at: string
  } | null
}

export function TenantPortal({
  tenantId, portalToken, firstName, streetName, fullAddress, documents, activeFault,
}: TenantPortalProps) {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [reportStep, setReportStep] = useState<1 | 2 | 3>(1)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ ref: string; date: string } | null>(null)

  function resetReport() {
    setReportStep(1); setCategory(''); setDescription(''); setFiles(null)
    setSubmitError(null); setSubmitting(false)
  }

  async function submitFault() {
    if (!files || files.length === 0) return
    setSubmitting(true); setSubmitError(null)
    try {
      const fd = new FormData()
      fd.set('token', portalToken)
      fd.set('tenant_id', tenantId)
      fd.set('category', category)
      fd.set('description', description)
      fd.set('severity', 'standard')
      fd.set('reporter_name', firstName)
      for (const f of Array.from(files)) fd.append('media', f)

      const res = await fetch('/api/portal/fault', { method: 'POST', body: fd })
      if (!res.ok) {
        const txt = await res.text().catch(() => 'Submission failed')
        throw new Error(txt || `Submission failed (${res.status})`)
      }
      const { reference, reported_at } = await res.json() as { reference: string; reported_at: string }
      const date = new Date(reported_at).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
      setConfirm({ ref: reference, date })
      setScreen('confirm')
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[440px] bg-ink-50 sm:max-w-[460px] md:max-w-[520px] lg:max-w-[560px]">
      {screen === 'welcome' && (
        <section className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center">
          <p className="mb-2.5 text-[10px] font-bold tracking-[0.2em] text-ink-400">BLAKE UK HOMES</p>
          <WelcomeHouse streetName={streetName} className="h-auto w-full max-w-[280px]" />
          <h1 className="mt-2 text-[26px] font-extrabold leading-none text-ink-900">Welcome home,</h1>
          <p className="mt-1 text-[24px] font-extrabold text-accent-500">{firstName}</p>
          <p className="mb-8 mt-1.5 text-sm text-ink-500">{fullAddress}</p>
          <button
            onClick={() => setScreen('home')}
            className="mt-6 w-full rounded-2xl bg-accent-500 px-4 py-4 text-[15px] font-bold text-white transition-colors hover:bg-accent-600"
          >
            Open My Portal
          </button>
          <p className="mt-4 text-xs leading-relaxed text-ink-400">
            Your documents and repairs, all in one place.<br />No login needed. Bookmark this page.
          </p>
        </section>
      )}

      {screen === 'home' && (
        <section>
          <header className="bg-ink-900 px-5 pt-5 pb-4">
            <p className="text-[10px] font-bold tracking-[0.1em] text-ink-600">BLAKE UK HOMES</p>
            <p className="mt-0.5 text-[18px] font-extrabold text-white">Hello, {firstName} 👋</p>
            <p className="mt-0.5 text-xs text-ink-500">{fullAddress}</p>
          </header>
          <div className="flex justify-center px-5 pt-5">
            <HomeHouse streetName={streetName} className="h-auto w-full max-w-[260px]" />
          </div>
          <div className="px-5 pt-4 pb-8">
            {activeFault && (
              <div className="mb-4 rounded-xl border-[1.5px] px-3.5 py-3.5" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                <p className="text-xs font-bold text-[#92400e]">🔧 Active Repair</p>
                <p className="mt-1 text-[13px] text-[#78350f]">{activeFault.category}, {activeFault.description.slice(0, 32)}{activeFault.description.length > 32 ? '...' : ''}</p>
                {activeFault.scheduled && (
                  <p className="mt-0.5 text-xs text-[#92400e]">📅 {activeFault.scheduled.contractor}, {activeFault.scheduled.when}</p>
                )}
                <button onClick={() => setScreen('faults')} className="mt-2 block text-xs font-bold text-accent-500">View details →</button>
              </div>
            )}

            <div className="mb-2.5 grid grid-cols-2 gap-2.5">
              <button onClick={() => setScreen('docs')} className="rounded-2xl border-[1.5px] border-ink-200 bg-white px-3 py-4 text-center transition-colors hover:border-accent-500">
                <p className="text-[28px]">📁</p>
                <p className="mt-1.5 text-[13px] font-bold text-ink-900">My Documents</p>
                <p className="mt-0.5 text-[11px] text-ink-400">{documents.length} document{documents.length === 1 ? '' : 's'}</p>
              </button>
              <button onClick={() => setScreen('faults')} className="rounded-2xl border-[1.5px] border-ink-200 bg-white px-3 py-4 text-center transition-colors hover:border-accent-500">
                <p className="text-[28px]">🔧</p>
                <p className="mt-1.5 text-[13px] font-bold text-ink-900">Report Fault</p>
                <p className="mt-0.5 text-[11px] text-ink-400">{activeFault ? '1 active' : 'Tap to start'}</p>
              </button>
            </div>

            <div className="rounded-xl border px-3 py-3 text-center text-xs text-[#0369a1]"
                 style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
              Need help? Report faults through the app, everything is recorded.
            </div>
          </div>
        </section>
      )}

      {screen === 'docs' && (
        <section>
          <BackHeader title="My Documents" sub={fullAddress} onBack={() => setScreen('home')} />
          <div className="p-4 pb-8">
            <p className="mb-3 text-[11px] font-bold tracking-wide text-ink-400">YOUR TENANCY DOCUMENTS</p>
            {documents.length === 0 ? (
              <p className="rounded-xl bg-white p-5 text-center text-sm text-ink-500 ring-1 ring-ink-100">No documents shared with you yet.</p>
            ) : (
              <>
                {documents.map((d) => (
                  <div key={d.id} className="mb-2.5 flex items-center justify-between rounded-xl border-[1.5px] border-ink-50 bg-white px-3.5 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-[22px]">{DOC_ICONS[d.kind] ?? '📄'}</span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-ink-900">{DOC_LABEL[d.kind] ?? d.title}</p>
                        <p className="mt-0.5 text-[11px] text-ink-400">
                          Added {new Date(d.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`/api/portal/${portalToken}/documents/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg bg-accent-500 px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-accent-600"
                    >
                      View
                    </a>
                  </div>
                ))}
                <div className="mt-2 rounded-xl border bg-success-50 px-3 py-3 text-center text-xs text-success-700"
                     style={{ borderColor: '#bbf7d0' }}>
                  All required documents are in order
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {screen === 'faults' && (
        <section>
          <BackHeader title="Repairs & Faults" sub={fullAddress} onBack={() => setScreen('home')} />
          <div className="p-4 pb-8">
            <button
              onClick={() => { resetReport(); setScreen('report') }}
              className="mb-5 w-full rounded-xl bg-accent-500 px-3 py-3.5 text-sm font-bold text-white hover:bg-accent-600"
            >
              + Report a New Fault
            </button>
            {activeFault ? (
              <>
                <p className="mb-2.5 text-[11px] font-bold tracking-wide text-ink-400">ACTIVE REPAIRS</p>
                <div className="rounded-xl border-[1.5px] bg-white p-3.5" style={{ borderColor: '#fde68a' }}>
                  <div className="mb-1.5 flex justify-between">
                    <span className="text-sm font-bold text-ink-900">{activeFault.category}</span>
                    <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: 'rgba(245,158,11,0.13)', color: '#92400e' }}>
                      {activeFault.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mb-2 text-xs text-ink-500">{activeFault.description}</p>
                  {activeFault.scheduled && (
                    <div className="rounded-lg bg-success-50 p-2.5">
                      <p className="text-xs font-bold text-success-700">🔧 Repair Scheduled</p>
                      <p className="text-xs text-[#166534]">{activeFault.scheduled.contractor}</p>
                      <p className="text-xs text-[#166534]">📅 {activeFault.scheduled.when}</p>
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-ink-400">
                    Reported {new Date(activeFault.reported_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-center text-sm text-ink-500">No active repairs.</p>
            )}
          </div>
        </section>
      )}

      {screen === 'report' && (
        <section>
          <header className="bg-accent-500 px-5 py-4">
            <button onClick={() => setScreen('faults')} className="mb-2 block text-[13px] font-bold text-white/70">← Cancel</button>
            <p className="text-base font-extrabold text-white">Report a Fault</p>
            <div className="mt-3.5 flex gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn('h-[3px] flex-1 rounded-sm', i <= reportStep ? 'bg-white' : 'bg-white/30')} />
              ))}
            </div>
          </header>

          <div className="p-5 pb-8">
            {reportStep === 1 && (
              <>
                <p className="mb-1 text-base font-extrabold text-ink-900">What's the issue?</p>
                <p className="mb-4 text-[13px] text-ink-500">Select the type of fault</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => { setCategory(c.label); setReportStep(2) }}
                      className={cn(
                        'rounded-xl border-[1.5px] px-2 py-3.5 text-center transition-colors',
                        category === c.label
                          ? 'border-accent-500 bg-accent-500 text-white'
                          : 'border-ink-200 bg-white text-ink-900 hover:border-accent-500'
                      )}
                    >
                      <p className="mb-1 text-[24px]">{c.icon}</p>
                      <p className="text-xs font-semibold">{c.label}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {reportStep === 2 && (
              <>
                <p className="mb-1 text-base font-extrabold text-ink-900">Describe the problem</p>
                <p className="mb-4 text-[13px] text-ink-500">The more detail the better. When it started, how bad it is.</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. The shower has no water. Started this morning."
                  className="min-h-[130px] w-full rounded-[10px] border-[1.5px] border-ink-200 p-3.5 text-sm"
                />
                <div className="mt-4 flex gap-2.5">
                  <button onClick={() => setReportStep(1)} className="flex-1 rounded-[10px] bg-ink-100 px-3 py-3.5 text-sm font-semibold text-ink-500">Back</button>
                  <button
                    onClick={() => setReportStep(3)}
                    disabled={description.length < 10}
                    className={cn(
                      'flex-[2] rounded-[10px] px-3 py-3.5 text-sm font-bold',
                      description.length >= 10
                        ? 'bg-accent-500 text-white hover:bg-accent-600'
                        : 'cursor-not-allowed bg-ink-200 text-ink-400'
                    )}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {reportStep === 3 && (
              <>
                <p className="mb-1 text-base font-extrabold text-ink-900">Add photos or videos</p>
                <p className="mb-4 text-[13px] text-ink-500">
                  At least one photo or video is <strong className="text-danger-500">required</strong>
                </p>
                <label className="mb-4 mt-2 block cursor-pointer rounded-xl border-2 border-dashed border-ink-300 px-4 py-8 text-center hover:border-accent-500">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    multiple
                    className="sr-only"
                    onChange={(e) => setFiles(e.target.files)}
                  />
                  <p className="mb-2 text-[36px]">📷</p>
                  <p className="text-sm font-bold text-accent-500">
                    {files?.length ? `${files.length} file${files.length === 1 ? '' : 's'} attached` : 'Tap to add photos or videos'}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-400">Photos auto-compressed · Videos max 8MB</p>
                </label>
                <div className="mb-4 rounded-[10px] border border-ink-200 bg-ink-50 px-3 py-3">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-500">SUMMARY</p>
                  <p className="text-[13px] text-ink-700"><strong>{streetName}</strong> · {category}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{description.slice(0, 70)}{description.length > 70 ? '...' : ''}</p>
                </div>

                {submitError && (
                  <div className="mb-3 rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2 text-xs text-danger-700">
                    {submitError}
                  </div>
                )}

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setReportStep(2)}
                    disabled={submitting}
                    className="flex-1 rounded-[10px] bg-ink-100 px-3 py-3.5 text-sm font-semibold text-ink-500 disabled:opacity-50"
                  >Back</button>
                  <button
                    onClick={submitFault}
                    disabled={!files || files.length === 0 || submitting}
                    className={cn(
                      'flex-[2] rounded-[10px] px-3 py-3.5 text-sm font-bold transition-colors',
                      files && files.length > 0 && !submitting
                        ? 'bg-accent-500 text-white hover:bg-accent-600'
                        : 'cursor-not-allowed bg-ink-200 text-ink-400'
                    )}
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {screen === 'confirm' && confirm && (
        <section className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center">
          <p className="mb-4 text-[60px]">✅</p>
          <p className="mb-2 text-[22px] font-extrabold text-ink-900">Fault Reported</p>
          <p className="mb-6 text-sm leading-relaxed text-ink-500">
            Your landlord has been notified and will respond shortly. You will be updated here as soon as a repair is scheduled.
          </p>
          <div className="mb-6 w-full rounded-xl border border-ink-200 bg-white p-4 text-left">
            <ConfirmRow k="Property" v={streetName} />
            <ConfirmRow k="Category" v={category} />
            <ConfirmRow k="Reported" v={confirm.date} />
            <ConfirmRow k="Reference" v={confirm.ref} />
          </div>
          <button
            onClick={() => { resetReport(); setScreen('home') }}
            className="w-full rounded-xl bg-accent-500 px-4 py-3.5 text-sm font-bold text-white hover:bg-accent-600"
          >
            Back to My Home
          </button>
        </section>
      )}
    </div>
  )
}

function BackHeader({ title, sub, onBack }: { title: string; sub: string; onBack: () => void }) {
  return (
    <header className="bg-ink-900 px-5 py-4">
      <button onClick={onBack} className="mb-2 block text-[13px] font-bold text-accent-500">← Back</button>
      <p className="text-[18px] font-extrabold text-white">{title}</p>
      <p className="mt-0.5 text-xs text-ink-500">{sub}</p>
    </header>
  )
}

function ConfirmRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-ink-50 py-1.5 text-[13px] last:border-b-0">
      <span className="text-ink-500">{k}</span>
      <span className="font-semibold text-ink-900">{v}</span>
    </div>
  )
}
