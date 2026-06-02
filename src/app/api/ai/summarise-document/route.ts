import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SYSTEM_PROMPT = `You are a private assistant for a UK residential landlord.
Summarise the supplied property document for the landlord's records.

For tenancy agreements, return:
  Tenancy type, start date, end / break date, parties, monthly rent, due day,
  deposit amount + scheme, notice period, pets / smoking clauses, key obligations.

For compliance certificates (Gas Safety, EICR, EPC, Buildings Insurance), return:
  Issued by, issue date, expiry date, reference number, any defects / observations,
  insurance policy number and cover limits where applicable.

For invoices, return: supplier, total, VAT, work performed, dates.

Write 5–10 short lines, plain prose, no markdown headings.
If the document is unreadable or empty, say so plainly.`

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { document_id } = await req.json()
    if (!document_id) return new NextResponse('document_id required', { status: 400 })

    const { data: doc } = await supabase.from('documents').select('*').eq('id', document_id).single()
    if (!doc) return new NextResponse('Document not found', { status: 404 })

    // Pull the file from storage (service client; bucket is private)
    const sb = createServiceClient()
    const { data: blob, error: dlErr } = await sb.storage.from('property-documents').download(doc.storage_path)
    if (dlErr || !blob) return new NextResponse(dlErr?.message ?? 'Download failed', { status: 500 })
    const bytes = Buffer.from(await blob.arrayBuffer())

    let extractedText = ''
    if (doc.mime_type === 'application/pdf' || doc.storage_path.toLowerCase().endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse')).default
      try {
        const parsed = await pdfParse(bytes)
        extractedText = (parsed.text || '').trim()
      } catch {
        extractedText = ''
      }
    } else if (doc.mime_type?.startsWith('text/')) {
      extractedText = bytes.toString('utf8')
    }

    // Build the Claude message. If we have text, send text. Otherwise send the file as an image (Claude vision) for images.
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

    const messageContent: any[] = []
    if (extractedText) {
      messageContent.push({
        type: 'text',
        text: `Document title: ${doc.title}\nDocument kind: ${doc.kind}\n\n--- DOCUMENT TEXT ---\n${extractedText.slice(0, 60_000)}`,
      })
    } else if (doc.mime_type?.startsWith('image/')) {
      messageContent.push({
        type: 'image',
        source: { type: 'base64', media_type: doc.mime_type, data: bytes.toString('base64') },
      })
      messageContent.push({ type: 'text', text: `Document title: ${doc.title}\nDocument kind: ${doc.kind}` })
    } else {
      return new NextResponse('Unsupported file type for summarisation', { status: 415 })
    }

    const resp = await anthropic.messages.create({
      model,
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: messageContent }],
    })

    const summary = resp.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as any).text)
      .join('\n')
      .trim()

    await supabase.from('documents').update({
      ai_summary: summary,
      ai_summary_at: new Date().toISOString(),
    }).eq('id', document_id)

    return NextResponse.json({ summary })
  } catch (e: any) {
    return new NextResponse(e?.message ?? 'Server error', { status: 500 })
  }
}
