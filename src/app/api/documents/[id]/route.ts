// Delete a document: removes the file from Supabase Storage and the row from the documents table.
// RLS ensures only owners / managers can delete; we still verify the user is signed in.
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: doc, error: getErr } = await supabase
    .from('documents')
    .select('id, property_id, storage_path')
    .eq('id', params.id)
    .single()
  if (getErr || !doc) {
    return NextResponse.json({ error: getErr?.message ?? 'Document not found' }, { status: 404 })
  }

  // Remove the file from storage (service client; the private bucket needs it)
  try {
    const sb = createServiceClient()
    await sb.storage.from('property-documents').remove([doc.storage_path])
  } catch {
    // Non-fatal — proceed to delete the row even if the file was already gone
  }

  // Delete the documents row (RLS enforces permission)
  const { error: delErr } = await supabase.from('documents').delete().eq('id', params.id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  // Revalidate the affected pages so the deleted row disappears immediately
  revalidatePath('/documents')
  revalidatePath(`/properties/${doc.property_id}/documents`)
  revalidatePath(`/properties/${doc.property_id}`)

  return NextResponse.json({ ok: true })
}
