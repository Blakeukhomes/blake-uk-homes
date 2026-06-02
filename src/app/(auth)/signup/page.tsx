'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { HeroHouse } from '@/components/house'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-10 font-display text-3xl font-semibold text-ink-900">Create your account</h1>
          <p className="mt-2 text-sm text-ink-500">A private workspace for your portfolio.</p>

          {success ? (
            <div className="mt-8 rounded-lg bg-success-100 px-4 py-4 text-sm text-success-700">
              Check your inbox to confirm your email, then return here to sign in.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={8}
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <p className="mt-1 text-xs text-ink-500">Minimum 8 characters.</p>
              </div>
              {error && <p className="rounded bg-danger-100 px-3 py-2 text-sm text-danger-700">{error}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          )}

          <p className="mt-6 text-sm text-ink-500">
            Already have an account? <Link href="/login" className="font-medium text-ink-900 underline">Sign in</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex relative overflow-hidden bg-ink-900 items-center justify-center">
        <div className="text-center text-white px-12">
          <HeroHouse className="mx-auto h-64 w-64" />
          <p className="mt-8 font-display text-2xl leading-tight">
            Welcome to your portfolio.
          </p>
          <p className="mt-2 text-sm text-ink-300">Compliance, rent, MTD tax, all in one place.</p>
        </div>
      </div>
    </div>
  )
}
