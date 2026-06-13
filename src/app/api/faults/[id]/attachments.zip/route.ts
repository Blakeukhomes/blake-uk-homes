// Stream all fault attachments (photos + videos) as a single zip.
// Auth-gated: only an authenticated landlord can hit this; we additionally
// confirm the fault row exists.
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKET = 'fault-media'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  // Auth gate
  const auth = createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const sb = createServiceClient()
  const { data: fault } = await sb.from('fault_reports').select('id, reference').eq('id', params.id).maybeSingle()
  if (!fault) return NextResponse.json({ error: 'Fault not found' }, { status: 404 })

  const zip = new JSZip()
  let fileCount = 0

  for (const kind of ['photo', 'video'] as const) {
    const folder = `${params.id}/${kind}`
    const { data: rows } = await sb.storage.from(BUCKET).list(folder, { limit: 500 })
    if (!rows) continue
    for (const row of rows) {
      if (!row.name || row.name.endsWith('/')) continue
      const path = `${folder}/${row.name}`
      const { data: blob } = await sb.storage.from(BUCKET).download(path)
      if (!blob) continue
      const buf = Buffer.from(await blob.arrayBuffer())
      const displayName = row.name.replace(/^[0-9a-f-]{36}-/, '') || row.name
      zip.file(`${kind}s/${displayName}`, buf)
      fileCount++
    }
  }

  if (fileCount === 0) {
    return NextResponse.json({ error: 'No attachments on this fault' }, { status: 404 })
  }

  const zipBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })

  const filename = `${(fault.reference || 'fault').replace(/[^a-zA-Z0-9._-]/g, '_')}-attachments.zip`
  return new NextResponse(new Uint8Array(zipBuf), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
