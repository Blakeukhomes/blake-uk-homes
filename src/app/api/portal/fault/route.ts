import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Public endpoint authenticated via portal token. Service role bypasses RLS.
export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData()
    const token     = String(fd.get('token') ?? '')
    const tenant_id = String(fd.get('tenant_id') ?? '')
    if (!token || !tenant_id) return new NextResponse('Missing token', { status: 400 })

    const sb = createServiceClient()
    const { data: tenant } = await sb.from('tenants')
      .select('id, property_id, portal_token, full_name, email, phone, is_active')
      .eq('portal_token', token).maybeSingle()
    if (!tenant || tenant.id !== tenant_id || !tenant.is_active) {
      return new NextResponse('Invalid or inactive portal token', { status: 401 })
    }

    // Accept media under the 'media' field (multiple). Bucket into photos vs videos by mime.
    const media = fd.getAll('media') as File[]
    const photos: File[] = []
    const videos: File[] = []
    for (const f of media) {
      if (f && f.size > 0) {
        if ((f.type || '').startsWith('video/')) videos.push(f)
        else photos.push(f)
      }
    }
    if (photos.length === 0 && videos.length === 0) {
      return new NextResponse('At least one photo or video is required', { status: 400 })
    }

    // Create fault row. Fall back to tenant info if reporter fields weren't sent.
    const category = String(fd.get('category') ?? 'Other')
    const description = String(fd.get('description') ?? '')
    const severity = (String(fd.get('severity') ?? 'normal') as any)
    const reporter_name  = (fd.get('reporter_name') as string)  || tenant.full_name || 'Tenant'
    const reporter_phone = (fd.get('reporter_phone') as string) || tenant.phone || null
    const reporter_email = (fd.get('reporter_email') as string) || tenant.email || null

    const { data: fault, error: fErr } = await sb.from('fault_reports').insert({
      property_id: tenant.property_id,
      tenant_id: tenant.id,
      category,
      severity,
      description,
      reporter_name,
      reporter_phone,
      reporter_email,
      current_state: 'reported',
    }).select('id, reference, reported_at').single()
    if (fErr) return new NextResponse(fErr.message, { status: 500 })

    // First event row
    await sb.from('fault_events').insert({
      fault_id: fault!.id,
      state: 'reported',
      actor_role: 'tenant',
      actor_name: reporter_name,
      note: `Fault reported via portal. ${photos.length} photo(s), ${videos.length} video(s) attached.`,
    })

    // Upload media (non-fatal — fault is already recorded even if upload fails)
    const uploadOne = async (file: File, kind: 'photo' | 'video') => {
      try {
        const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, '_')
        const path = `${fault!.id}/${kind}/${crypto.randomUUID()}-${safeName}`
        await sb.storage.from('fault-media').upload(path, file, { contentType: file.type, upsert: false })
      } catch {
        // skip — fault still exists in the DB
      }
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
