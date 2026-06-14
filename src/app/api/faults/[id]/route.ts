// Delete a resolved/closed fault including its events, contractor bookings,
// and all uploaded media in Supabase Storage. Open faults cannot be deleted.
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKET = 'fault-media'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  // Auth gate
  const auth = createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const sb = createServiceClient()

  // Confirm the fault exists and is in a deletable state
  const { data: fault, error: fErr } = await sb
    .from('fault_reports')
    .select('id, property_id, current_state')
    .eq('id', params.id)
    .maybeSingle()

  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 })
  if (!fault) return NextResponse.json({ error: 'Fault not found' }, { status: 404 })

  if (fault.current_state !== 'resolved' && fault.current_state !== 'closed') {
    return NextResponse.json(
      { error: 'Only resolved or closed faults can be deleted.' },
      { status: 400 },
    )
  }

  // 1) Delete all media from Storage (photos + videos)
  for (const kind of ['photo', 'video'] as const) {
    const folder = `${params.id}/${kind}`
    const { data: rows } = await sb.storage.from(BUCKET).list(folder, { limit: 500 })
    if (rows && rows.length > 0) {
      const paths = (rows as { name: string }[])
        .filter((r) => r.name && !r.name.endsWith('/'))
        .map((r) => `${folder}/${r.name}`)
      if (paths.length > 0) {
        await sb.storage.from(BUCKET).remove(paths)
      }
    }
  }

  // 2) Delete child rows (events + contractor bookings). If on delete cascade
  // is set in the schema this is a no-op, but doing it explicitly is safe.
  await sb.from('fault_events').delete().eq('fault_id', params.id)
  await sb.from('contractor_bookings').delete().eq('fault_id', params.id)

  // 3) Delete the fault row itself
  const { error: delErr } = await sb.from('fault_reports').delete().eq('id', params.id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  revalidatePath('/faults')
  revalidatePath('/dashboard')
  if (fault.property_id) revalidatePath(`/properties/${fault.property_id}/faults`)

  return NextResponse.json({ ok: true })
}
