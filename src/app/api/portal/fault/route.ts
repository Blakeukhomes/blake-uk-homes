import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/notifications/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Public endpoint authenticated via portal token. Body is JSON (no file binary
// goes through the function — we hand back signed upload URLs and the browser
// uploads each file directly to Supabase Storage, sidestepping Vercel's 4.5MB
// function payload limit).
interface AttachmentMeta {
  name: string
  mime: string
  kind: 'photo' | 'video'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      token?: string
      tenant_id?: string
      category?: string
      severity?: 'emergency' | 'urgent' | 'standard' | 'minor'
      description?: string
      reporter_name?: string
      reporter_phone?: string
      reporter_email?: string
      attachments?: AttachmentMeta[]
    }

    if (!body.token || !body.tenant_id) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const attachments = Array.isArray(body.attachments) ? body.attachments : []
    if (attachments.length === 0) {
      return NextResponse.json({ error: 'At least one photo or video is required' }, { status: 400 })
    }

    const sb = createServiceClient()
    const { data: tenant } = await sb.from('tenants')
      .select('id, property_id, portal_token, full_name, email, phone, is_active')
      .eq('portal_token', body.token).maybeSingle()
    if (!tenant || tenant.id !== body.tenant_id || !tenant.is_active) {
      return NextResponse.json({ error: 'Invalid or inactive portal token' }, { status: 401 })
    }

    const reporter_name  = body.reporter_name  || tenant.full_name || 'Tenant'
    const reporter_phone = body.reporter_phone || tenant.phone || null
    const reporter_email = body.reporter_email || tenant.email || null

    // Insert the fault
    const { data: fault, error: fErr } = await sb.from('fault_reports').insert({
      property_id: tenant.property_id,
      tenant_id: tenant.id,
      category: body.category || 'Other',
      severity: body.severity || 'standard',
      description: body.description || '',
      reporter_name,
      reporter_phone,
      reporter_email,
      current_state: 'reported',
    }).select('id, reference, reported_at').single()
    if (fErr || !fault) {
      return NextResponse.json({ error: fErr?.message ?? 'Failed to create fault report' }, { status: 500 })
    }

    // First event row
    const photos = attachments.filter((a) => a.kind === 'photo').length
    const videos = attachments.filter((a) => a.kind === 'video').length
    await sb.from('fault_events').insert({
      fault_id: fault.id,
      state: 'reported',
      actor_role: 'tenant',
      actor_name: reporter_name,
      note: `Fault reported via portal. ${photos} photo(s), ${videos} video(s) attached.`,
    })

    // Pre-sign upload URLs (one per attachment). Browser PUTs the binary directly.
    const uploads: { signedUrl: string; path: string; token: string }[] = []
    for (const a of attachments) {
      const kind = a.kind === 'video' ? 'video' : 'photo'
      const safeName = (a.name || 'file').replace(/[^a-z0-9.\-_]/gi, '_')
      const path = `${fault.id}/${kind}/${crypto.randomUUID()}-${safeName}`
      const { data: signed, error: signErr } = await sb.storage
        .from('fault-media')
        .createSignedUploadUrl(path)
      if (signErr || !signed) continue
      uploads.push({ signedUrl: signed.signedUrl, path: signed.path, token: signed.token })
    }

    // Auto-acknowledge event (system action)
    await sb.from('fault_events').insert({
      fault_id: fault.id,
      state: 'acknowledged',
      actor_role: 'owner',
      actor_name: 'Blake UK Homes (auto)',
      note: 'System auto-acknowledgement on receipt.',
    })

    // Email the property owner immediately (best-effort, non-fatal)
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
      try {
        const { data: property } = await sb
          .from('properties')
          .select('owner_id, nickname, address_line_1, city, postcode')
          .eq('id', tenant.property_id)
          .maybeSingle()
        const { data: owner } = property?.owner_id
          ? await sb.from('profiles').select('email, full_name').eq('id', property.owner_id).maybeSingle()
          : { data: null }
        if (owner?.email) {
          const sev = (body.severity || 'standard').toUpperCase()
          const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://blakehomesuk.co.uk').replace(/\/$/, '')
          const faultUrl = `${siteUrl}/faults/${fault.id}#attachments`
          const lines = [
            `${sev} fault reported by ${reporter_name}`,
            ``,
            `Property: ${property?.nickname ?? 'Unknown'}`,
            `Address:  ${property?.address_line_1 ?? ''}, ${property?.city ?? ''} ${property?.postcode ?? ''}`,
            ``,
            `Category:    ${body.category || 'Other'}`,
            `Severity:    ${sev}`,
            `Description: ${body.description || '(none)'}`,
            ``,
            `Photos: ${photos}    Videos: ${videos}`,
            `View attachments: ${faultUrl}`,
            ``,
            `Reference: ${fault.reference}`,
            `Reported:  ${new Date(fault.reported_at).toLocaleString('en-GB')}`,
            ``,
            `Open fault in Blake UK Homes to schedule a contractor or message the tenant.`,
          ].join('\n')
          await sendEmail({
            to: owner.email,
            subject: `[${sev}] ${body.category || 'Fault'} reported - ${property?.nickname ?? 'property'}`,
            text: lines,
          })
        }
      } catch {
        // Non-fatal: the fault is already recorded
      }
    }

    return NextResponse.json({
      reference: fault.reference,
      reported_at: fault.reported_at,
      uploads,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 })
  }
}
