import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { isDemoMode } from '@/lib/demo/client'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const supabase = createClient()
  const { data: profiles = [] } = await supabase.from('profiles').select('*').neq('role', 'tenant').order('full_name')

  async function inviteMember(formData: FormData) {
    'use server'
    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const role  = String(formData.get('role') ?? 'readonly')
    const full_name = String(formData.get('full_name') ?? '').trim()
    if (!email) return

    if (isDemoMode()) {
      // Demo: no-op; the page will still render with the existing demo profiles
      return
    }

    // Create a profile row with the chosen role. The real invitation email
    // goes via Supabase admin in production (requires service-role client).
    const supabase = createClient()
    await supabase.from('profiles').insert({
      id: crypto.randomUUID(),
      email,
      full_name: full_name || null,
      role,
    } as any)
    revalidatePath('/settings/team')
  }

  async function changeRole(formData: FormData) {
    'use server'
    const supabase = createClient()
    await supabase.from('profiles').update({ role: String(formData.get('role')) }).eq('id', String(formData.get('user_id')))
    revalidatePath('/settings/team')
  }

  return (
    <>
      <PageHeader
        title="Team access"
        subtitle="Invite a manager, read-only viewer, or property manager. Tenants get unique portal URLs, not logins."
        actions={<Link href="/settings"><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>}
      />
      <div className="p-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Anyone with portfolio access (excluding tenants).</CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            {(profiles ?? []).length === 0 ? (
              <p className="px-6 py-8 text-sm text-ink-500">No team members yet. Invite one on the right.</p>
            ) : (
              <ul className="divide-y hairline divide-ink-100">
                {(profiles as any[]).map((p) => (
                  <li key={p.id} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink-900">{p.full_name ?? p.email}</p>
                        <p className="text-xs text-ink-500">{p.email}</p>
                      </div>
                      <form action={changeRole} className="flex items-center gap-2">
                        <input type="hidden" name="user_id" value={p.id} />
                        <Select name="role" defaultValue={p.role} className="w-36">
                          <option value="owner">Owner</option>
                          <option value="manager">Manager</option>
                          <option value="readonly">Read only</option>
                        </Select>
                        <Button type="submit" size="sm" variant="secondary">Save</Button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle><UserPlus className="inline h-5 w-5 mr-1 -mt-1" />Invite a member</CardTitle>
            <CardDescription>They receive an email link to set a password (live mode only).</CardDescription>
          </CardHeader>
          <CardBody>
            <form action={inviteMember} className="grid gap-3">
              <div><Label htmlFor="full_name">Name</Label><Input id="full_name" name="full_name" /></div>
              <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select id="role" name="role" defaultValue="readonly">
                  <option value="manager">Manager — full visibility, limited edits</option>
                  <option value="readonly">Read only — view only, for solicitors</option>
                </Select>
              </div>
              <Button type="submit">Send invitation</Button>
              {isDemoMode() && (
                <p className="text-xs text-ink-500">Demo mode: this won't send a real email or create a profile row.</p>
              )}
            </form>

            <div className="mt-6 border-t hairline border-t-ink-100 pt-4 text-xs">
              <p className="mb-2 font-semibold text-ink-700">Role permissions</p>
              <div className="space-y-2">
                <div className="flex gap-2"><Badge tone="info">Owner</Badge><span className="text-ink-600">Full access. Manage team. Delete records. Generate legal docs.</span></div>
                <div className="flex gap-2"><Badge tone="success">Manager</Badge><span className="text-ink-600">Full visibility. Cannot delete or generate legal documents.</span></div>
                <div className="flex gap-2"><Badge tone="neutral">Read only</Badge><span className="text-ink-600">View only. No edit functions. Suitable for solicitors.</span></div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
