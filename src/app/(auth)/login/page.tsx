'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { HeroHouse } from '@/components/house'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-10 font-display text-3xl font-semibold text-ink-900">Sign in</h1>
          <p className="mt-2 text-sm text-ink-500">Welcome back to your portfolio.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="rounded bg-danger-100 px-3 py-2 text-sm text-danger-700">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-ink-500">
            No account yet? <Link href="/signup" className="font-medium text-ink-900 underline">Create one</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex relative overflow-hidden bg-ink-900 items-center justify-center">
        <div className="text-center text-white px-12">
          <HeroHouse className="mx-auto h-64 w-64" />
          <p className="mt-8 font-display text-2xl leading-tight">
            "All entries timestamped at point of submission. Cannot be retrospectively altered."
          </p>
          <p className="mt-4 text-sm text-ink-300">The standard court-ready footer on every Blake UK Homes PDF.</p>
        </div>
      </div>
    </div>
  )
}
