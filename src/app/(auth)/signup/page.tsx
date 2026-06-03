'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2, Loader2, Home, Banknote, Wrench, Users } from 'lucide-react'
import { Logo } from '@/components/logo'
import { WelcomeHouse } from '@/components/house'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/cn'

function passwordScore(p: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!p) return { score: 0, label: '' }
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++
  const labels = ['Too short', 'Weak', 'Okay', 'Strong', 'Excellent']
  return { score: Math.min(4, s) as any, label: labels[Math.min(4, s)] }
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const strength = useMemo(() => passwordScore(password), [password])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${location.origin}/dashboard`,
      },
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo />

          <div className="mt-12">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              A private workspace for your portfolio.
            </p>
          </div>

          {success ? (
            <div className="mt-8 rounded-xl border border-success-500/30 bg-success-50 p-5 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success-500" />
              <h3 className="mt-3 text-base font-semibold text-success-700">Check your inbox</h3>
              <p className="mt-1 text-sm text-success-700">
                We sent a confirmation link to <strong>{email}</strong>. Click it and you will be signed in automatically.
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink-800">Full name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
                    <input
                      id="name"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full rounded-lg border-0 bg-white pl-9 pr-3 py-2 text-sm text-ink-900 shadow-sm ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-inset focus:ring-accent-500"
                      placeholder="Sam Blake"
                    />
                  </div>
                </div>

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
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-800">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border-0 bg-white pl-9 pr-10 py-2 text-sm text-ink-900 shadow-sm ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-inset focus:ring-accent-500"
                      placeholder="At least 8 characters"
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

                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              'h-1 flex-1 rounded-full transition-colors',
                              i <= strength.score
                                ? strength.score <= 1 ? 'bg-danger-500'
                                : strength.score === 2 ? 'bg-warning-500'
                                : strength.score === 3 ? 'bg-accent-500'
                                : 'bg-success-500'
                                : 'bg-ink-100'
                            )}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-[11px] text-ink-500">{strength.label}</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account</>
                    : 'Create account'}
                </Button>
              </form>

              <p className="mt-6 text-sm text-ink-500">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-accent-600 hover:text-accent-700">
                  Sign in
                </Link>
              </p>

              <p className="mt-12 text-[11px] text-ink-400">
                By creating an account you confirm this workspace is for your own portfolio.
              </p>
            </>
          )}
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
      <div className="absolute inset-0 opacity-[0.07] bg-grid" />

      <div className="relative z-10 max-w-md">
        <div className="flex justify-center">
          <WelcomeHouse streetName="Your Street" className="h-48 w-48" />
        </div>

        <h2 className="mt-6 text-center font-display text-3xl font-semibold leading-tight tracking-tight text-white">
          Set up in minutes.
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-ink-400">
          A few clicks and you are tracking compliance, rent, and HMRC quarterly tax across your whole portfolio.
        </p>

        <ul className="mt-10 space-y-3">
          <Step n="1" icon={<Home className="h-4 w-4" />}     title="Add your properties"          body="Eight houses or eighty, no limit." />
          <Step n="2" icon={<Users className="h-4 w-4" />}    title="Invite your tenants"          body="Each gets a private portal URL, no login needed." />
          <Step n="3" icon={<Wrench className="h-4 w-4" />}   title="Log compliance and repairs"   body="Auto-reminders, photo evidence, court-ready PDFs." />
          <Step n="4" icon={<Banknote className="h-4 w-4" />} title="Export MTD quarterly"         body="One click to your accountant in their exact format." />
        </ul>

        <p className="mt-12 text-center text-[11px] uppercase tracking-[0.2em] text-ink-600">
          Blake UK Homes
        </p>
      </div>
    </div>
  )
}

function Step({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
        {n}
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
          <span className="text-accent-300">{icon}</span>
          {title}
        </p>
        <p className="mt-0.5 text-xs text-ink-400">{body}</p>
      </div>
    </li>
  )
}
