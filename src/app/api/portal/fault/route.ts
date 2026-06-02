import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Public endpoint authenticated via portal token. Service role bypasses RLS.
export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData()
    const token     = String(fd.get('token') ?? '')
    const tenant_id = String(fd.get('tenant_id') ?? '')
    if (!token || !tenant_id) return new NextResponse('Missing token', { status: 400 })

    const sb = createServiceClient()
    const { data: tenant } = await sb.from('tenants')
      .select('id, property_id, portal_token').eq('portal_token', token).maybeSingle()
    if (!tenant || tenant.id !== tenant_id) return new NextResponse('Invalid token', { status: 401 })

    const photos = fd.getAll('photo') as File[]
    const videos = fd.getAll('video') as File[]
    if (photos.length === 0 || videos.length === 0) {
      return new NextResponse('Photos and video required', { status: 400 })
    }

    // Create fault row
    const { data: fault, error: fErr } = await sb.from('fault_reports').insert({
      property_id: tenant.property_id,
      tenant_id: tenant.id,
      category: String(fd.get('category')),
      severity: String(fd.get('severity')) as any,
      description: String(fd.get('description')),
      reporter_name: String(fd.get('reporter_name')),
      reporter_phone: (fd.get('reporter_phone') as string) || null,
      reporter_email: (fd.get('reporter_email') as string) || null,
      current_state: 'reported',
    }).select('id, reference, reported_at').single()
    if (fErr) return new NextResponse(fErr.message, { status: 500 })

    // First event row
    await sb.from('fault_events').insert({
      fault_id: fault!.id,
      state: 'reported',
      actor_role: 'tenant',
      actor_name: String(fd.get('reporter_name')),
      note: `Fault reported via portal. ${photos.length} photo(s), ${videos.length} video(s) attached.`,
    })

    // Upload media
    const uploadOne = async (file: File, kind: 'photo' | 'video') => {
      const path = `${fault!.id}/${kind}/${crypto.randomUUID()}-${file.name}`
      await sb.storage.from('fault-media').upload(path, file, { contentType: file.type, upsert: false })
    }
    for (const f of photos) await uploadOne(f, 'photo')
    for (const v of videos) await uploadOne(v, 'video')

    // Auto-acknowledge event (system action)
    await sb.from('fault_events').insert({
      fault_id: fault!.id,
      state: 'acknowledged',
      actor_role: 'owner',
      actor_name: 'Blake UK Homes (auto)',
      note: 'System auto-acknowledgement on receipt.',
    })

    return NextResponse.json({ reference: fault!.reference, reported_at: fault!.reported_at })
  } catch (e: any) {
    return new NextResponse(e?.message ?? 'Server error', { status: 500 })
  }
}
