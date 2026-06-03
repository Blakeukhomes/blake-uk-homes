import Link from 'next/link'
import { Search, MessageSquare, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import type { Contact, Conversation, Message } from '@/lib/types'

export const dynamic = 'force-dynamic'

const TABS: { value: string; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'tenant',   label: 'Tenants' },
  { value: 'enquiry',  label: 'Enquiries' },
  { value: 'viewing',  label: 'Viewings' },
  { value: 'archived', label: 'Archived' },
]

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { c?: string; tab?: string }
}) {
  const supabase = createClient()
  const tab = searchParams.tab ?? 'all'

  let convQuery = supabase.from('conversations').select('*').order('last_message_at', { ascending: false })
  if (tab === 'archived') convQuery = convQuery.eq('is_archived', true)
  else if (tab !== 'all') convQuery = convQuery.eq('category', tab).eq('is_archived', false)
  else convQuery = convQuery.eq('is_archived', false)

  const { data: conversations = [] } = await convQuery
  const { data: contacts = [] } = await supabase.from('contacts').select('id, full_name, kind')
  const convs = (conversations ?? []) as Conversation[]
  const contactMap = new Map<string, Contact>((contacts ?? []).map((c: any) => [c.id as string, c as Contact]))

  // Active conversation (default: first one)
  const activeId = searchParams.c ?? convs[0]?.id ?? null
  let messages: Message[] = []
  let activeConv: Conversation | null = null
  if (activeId) {
    const { data: msgs = [] } = await supabase.from('messages').select('*').eq('conversation_id', activeId).order('sent_at')
    messages = (msgs ?? []) as Message[]
    activeConv = convs.find((c) => c.id === activeId) ?? null
  }

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle="Tenant, enquiry, and viewing conversations in one place."
        actions={<Link href="/messages/new"><Button><Plus className="h-4 w-4" />New message</Button></Link>}
      />

      <div className="p-6">
        <Card>
          <CardBody className="p-0">
            <div className="grid h-[640px] grid-cols-1 md:grid-cols-[320px_1fr]">
              {/* Sidebar */}
              <aside className="flex flex-col border-r hairline border-r-ink-100">
                <div className="border-b hairline border-b-ink-100 p-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
                    <input
                      placeholder="Search conversations"
                      className="w-full rounded-lg border-0 bg-ink-50 pl-9 pr-3 py-2 text-sm ring-1 ring-inset ring-ink-200 focus:bg-white focus:outline-none focus:ring-accent-500"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {TABS.map((t) => (
                      <Link
                        key={t.value}
                        href={`?tab=${t.value}`}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-medium',
                          tab === t.value
                            ? 'bg-accent-100 text-accent-700'
                            : 'text-ink-600 hover:bg-ink-100'
                        )}
                      >
                        {t.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {convs.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                      <MessageSquare className="h-8 w-8 text-ink-300" />
                      <p className="mt-2 text-sm text-ink-500">No conversations found</p>
                    </div>
                  ) : (
                    <ul>
                      {convs.map((c) => {
                        const contact = c.contact_id ? contactMap.get(c.contact_id) : null
                        return (
                          <li key={c.id}>
                            <Link
                              href={`?tab=${tab}&c=${c.id}`}
                              className={cn(
                                'flex gap-3 border-b hairline border-b-ink-100 px-3 py-3 text-left transition-colors hover:bg-ink-50',
                                activeId === c.id && 'bg-accent-50'
                              )}
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-100 text-xs font-bold text-accent-700">
                                {(contact?.full_name ?? '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-ink-900">{contact?.full_name ?? 'Unknown'}</p>
                                <p className="truncate text-xs text-ink-500">{c.subject ?? c.category}</p>
                                {c.last_message_at && (
                                  <p className="mt-0.5 text-[10px] text-ink-400">
                                    {new Date(c.last_message_at).toLocaleDateString('en-GB')}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </aside>

              {/* Reading pane */}
              <section className="flex flex-col">
                {activeConv ? (
                  <>
                    <div className="flex items-center justify-between border-b hairline border-b-ink-100 px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-ink-900">
                          {activeConv.contact_id ? contactMap.get(activeConv.contact_id)?.full_name ?? 'Unknown' : 'Direct'}
                        </p>
                        <p className="text-xs text-ink-500">{activeConv.subject ?? activeConv.category}</p>
                      </div>
                      <Link href={`/api/pdf/messages/${activeConv.id}`} target="_blank" className="text-xs font-semibold text-accent-700 underline">
                        Export PDF
                      </Link>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto bg-ink-50/40 px-6 py-4">
                      {messages.length === 0 ? (
                        <p className="text-center text-sm text-ink-500">No messages yet.</p>
                      ) : (
                        messages.map((m) => (
                          <div
                            key={m.id}
                            className={cn(
                              'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                              m.sender === 'landlord'
                                ? 'ml-auto bg-accent-500 text-white'
                                : m.sender === 'system'
                                ? 'mx-auto bg-ink-100 text-xs italic text-ink-600'
                                : 'mr-auto bg-white text-ink-900 ring-1 ring-ink-100'
                            )}
                          >
                            {m.sender !== 'system' && (
                              <p className={cn('mb-0.5 text-[10px] font-bold uppercase tracking-wider', m.sender === 'landlord' ? 'text-accent-100' : 'text-ink-400')}>
                                {m.sender_name ?? m.sender}
                              </p>
                            )}
                            <p>{m.body}</p>
                            {m.sender !== 'system' && (
                              <p className={cn('mt-1 text-[10px]', m.sender === 'landlord' ? 'text-accent-100' : 'text-ink-400')}>
                                {new Date(m.sent_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t hairline border-t-ink-100 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          placeholder="Type a message..."
                          className="flex-1 rounded-lg border-0 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-ink-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                        />
                        <Button size="sm">Send</Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <div className="rounded-2xl bg-accent-100 p-4 text-accent-500">
                      <MessageSquare className="h-7 w-7" />
                    </div>
                    <p className="mt-4 text-sm font-bold text-ink-900">Select a conversation</p>
                    <p className="mt-1 max-w-xs text-xs text-ink-500">
                      Choose a conversation from the sidebar to view messages. Start a new chat with a tenant using the button above.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
