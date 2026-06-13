'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Building2,
  ShieldCheck,
  Banknote,
  Wrench,
  FolderArchive,
  Users,
  Bell,
  Settings,
  LogOut,
  FileSignature,
  Receipt,
  MessageSquare,
  FileBarChart,
  Sparkles,
  UserSquare,
  AlertTriangle,
} from 'lucide-react'
import { Logo } from './logo'
import { cn } from '@/lib/cn'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard',   label: 'Dashboard',  icon: Home },
  { href: '/properties',  label: 'Properties', icon: Building2 },
  { href: '/contacts',    label: 'Contacts',   icon: UserSquare },
  { href: '/messages',    label: 'Messages',   icon: MessageSquare },
  { href: '/compliance',  label: 'Compliance', icon: ShieldCheck },
  { href: '/rent',        label: 'Rent',       icon: Banknote },
  { href: '/invoices',    label: 'Invoices',   icon: Receipt },
  { href: '/mtd',         label: 'MTD tax',    icon: FileBarChart },
  { href: '/maintenance', label: 'Maintenance',icon: Wrench },
  { href: '/faults',      label: 'Faults',     icon: AlertTriangle },
  { href: '/documents',   label: 'Documents',  icon: FolderArchive },
  { href: '/reports',     label: 'Reports',    icon: FileBarChart },
  { href: '/assistant',   label: 'AI Hudson',    icon: Sparkles },
  { href: '/tenants',     label: 'Tenants',    icon: Users },
  { href: '/notices',     label: 'Notices',    icon: FileSignature },
  { href: '/notifications', label: 'Alerts',   icon: Bell },
]

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode
  user?: { email: string; full_name: string | null }
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r hairline border-r-ink-200 bg-white">
          <div className="px-5 py-4">
            <Link href="/dashboard"><Logo /></Link>
          </div>
          <nav className="flex-1 px-3 pb-4">
            {NAV.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-ink-950 text-white'
                      : 'text-ink-700 hover:bg-ink-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t hairline border-t-ink-200 p-3">
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
            {user && (
              <div className="mt-3 px-3 text-xs text-ink-500">
                <p className="truncate font-medium text-ink-700">{user.full_name || user.email}</p>
                <p className="truncate">{user.email}</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-5 border-t hairline border-t-ink-200 bg-white">
        {NAV.slice(0, 5).map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-2 text-[10px]',
                active ? 'text-ink-950' : 'text-ink-500'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b hairline border-b-ink-200 bg-white px-6 py-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-ink-950">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
