'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Receipt, FileText, Loader2 } from 'lucide-react'
import { Logo } from '@/components/logo'
import { WelcomeHouse } from '@/components/house'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo />

          <div className="mt-12">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Sign in to your private workspace.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-800">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border-0 bg-white pl-9 pr-3 py-2 text-sm text-ink-900 shadow-sm ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-inset focus:ring-accent-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-ink-800">Password</label>
                <Link href="/login" className="text-xs font-medium text-accent-600 hover:text-accent-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border-0 bg-white pl-9 pr-10 py-2 text-sm text-ink-900 shadow-sm ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-inset focus:ring-accent-500"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-2 rounded p-1 text-ink-400 hover:text-ink-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in</>
                : 'Sign in'}
            </Button>
          </form>

          <p className="mt-12 text-[11px] text-ink-400">
            By signing in you agree to keep your portfolio data private and secure.
          </p>
        </div>
      </div>

      {/* Brand side */}
      <BrandPanel />
    </div>
  )
}

function BrandPanel() {
  return (
    <div className="relative hidden lg:flex items-center justify-center overflow-hidden bg-ink-900 px-12 py-12">
      {/* Subtle background grid */}
      <div className="absolute inset-0 opacity-[0.07] bg-grid" />

      <div className="relative z-10 max-w-md text-center">
        <WelcomeHouse streetName="Your Street" className="mx-auto h-52 w-52" />

        <h2 className="mt-6 font-display text-3xl font-semibold leading-tight tracking-tight text-white">
          Your portfolio, fully in your control.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-400">
          Compliance, rent, MTD quarterly tax, court-ready evidence. One private workspace.
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
