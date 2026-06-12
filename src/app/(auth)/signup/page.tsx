import Link from 'next/link'
import { ShieldCheck, Receipt, FileText, Lock } from 'lucide-react'
import { Logo } from '@/components/logo'
import { WelcomeHouse } from '@/components/house'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side — closed */}
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo />

          <div className="mt-12">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-50 text-accent-700">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink-900">
              By invitation only
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Blake UK Homes is a private workspace. New accounts are created by the portfolio owner. If you have been invited, sign in below.
            </p>
          </div>

          <div className="mt-8">
            <Link href="/login">
              <Button size="lg" className="w-full">Sign in</Button>
            </Link>
          </div>

          <p className="mt-12 text-[11px] text-ink-400">
            If you believe you should have access, contact the portfolio owner directly.
          </p>
        </div>
      </div>

      {/* Brand panel — kept consistent with login */}
      <BrandPanel />
    </div>
  )
}

function BrandPanel() {
  return (
    <div className="relative hidden lg:flex items-center justify-center overflow-hidden bg-ink-900 px-12 py-12">
      <div className="absolute inset-0 opacity-[0.07] bg-grid" />

      <div className="relative z-10 max-w-md text-center">
        <WelcomeHouse streetName="Your Street" className="mx-auto h-52 w-52" />

        <h2 className="mt-6 font-display text-3xl font-semibold leading-tight tracking-tight text-white">
          A private workspace.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-400">
          Compliance, rent, MTD quarterly tax, court-ready evidence. Access is restricted to the portfolio owner and their invited managers.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-3">
          <Feature icon={<ShieldCheck className="h-5 w-5" />} label="Compliance" />
          <Feature icon={<Receipt className="h-5 w-5" />}      label="MTD ITSA" />
          <Feature icon={<FileText className="h-5 w-5" />}     label="Court ready" />
        </div>

        <p className="mt-10 text-[11px] uppercase tracking-[0.2em] text-ink-600">
          Blake UK Homes
        </p>
      </div>
    </div>
  )
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/20 text-accent-300">
        {icon}
      </div>
      <p className="mt-2 text-[11px] font-semibold">{label}</p>
    </div>
  )
}
