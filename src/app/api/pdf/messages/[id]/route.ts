import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { messagesPdf } from '@/lib/pdf'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: conv } = await supabase
    .from('conversations')
    .select('*, contacts(full_name), properties(nickname)')
    .eq('id', params.id).maybeSingle()
  if (!conv) return new NextResponse('Not found', { status: 404 })

  const { data: messages = [] } = await supabase
    .from('messages').select('*').eq('conversation_id', params.id).order('sent_at')

  const c = conv as any
  const pdf = messagesPdf({
    contact_name: c.contacts?.full_name ?? 'Unknown',
    property_name: c.properties?.nickname,
    category: c.category,
    messages: (messages as any[]).map((m) => ({
      sender: m.sender, sender_name: m.sender_name, body: m.body, sent_at: m.sent_at,
    })),
  })

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="messages-${params.id}.pdf"`,
    },
  })
}
