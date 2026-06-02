import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label, Select, Textarea, Input } from '@/components/ui/input'
import type { Contact } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function NewMessagePage({ searchParams }: { searchParams: { contact?: string } }) {
  const supabase = createClient()
  const { data: contacts = [] } = await supabase.from('contacts').select('*').eq('is_active', true).order('full_name')
  const contactList = (contacts ?? []) as Contact[]

  async function create(formData: FormData) {
    'use server'
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const contactId = String(formData.get('contact_id') ?? '')
    const category  = String(formData.get('category') ?? 'tenant')
    const subject   = String(formData.get('subject') ?? '') || null
    const body      = String(formData.get('body') ?? '')

    const { data: conv, error: cErr } = await supabase.from('conversations').insert({
      owner_id: user.id,
      contact_id: contactId || null,
      category,
      subject,
      last_message_at: new Date().toISOString(),
    }).select('id').single()
    if (cErr) throw new Error(cErr.message)

    if (body) {
      await supabase.from('messages').insert({
        conversation_id: conv!.id,
        sender: 'landlord',
        body,
      })
    }

    revalidatePath('/messages')
    redirect(`/messages?c=${conv!.id}`)
  }

  const tenants = contactList.filter((c) => c.kind === 'tenant')
  const others  = contactList.filter((c) => c.kind !== 'tenant')

  return (
    <>
      <PageHeader title="New message" subtitle="Start a conversation with a tenant or contact." />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardBody>
            <form action={create} className="grid gap-4">
              <div>
                <Label htmlFor="contact_id">To</Label>
                <Select id="contact_id" name="contact_id" defaultValue={searchParams.contact ?? ''} required>
                  <option value="">Select a contact</option>
                  {tenants.length > 0 && (
                    <optgroup label="Tenants">
                      {tenants.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </optgroup>
                  )}
                  {others.length > 0 && (
                    <optgroup label="Other contacts">
                      {others.map((c) => <option key={c.id} value={c.id}>{c.full_name} ({c.kind})</option>)}
                    </optgroup>
                  )}
                </Select>
                {contactList.length === 0 && (
                  <p className="mt-1 text-xs text-ink-500">No contacts found. Add tenants in Contacts first.</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select id="category" name="category" defaultValue="tenant">
                    <option value="tenant">Tenant</option>
                    <option value="enquiry">Enquiry</option>
                    <option value="viewing">Viewing</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" />
                </div>
              </div>
              <div>
                <Label htmlFor="body">Message</Label>
                <Textarea id="body" name="body" rows={6} placeholder="Type your message..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="submit" size="lg">Send</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
