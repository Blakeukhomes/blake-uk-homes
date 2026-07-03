import Link from 'next/link'
import { Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DocumentRow } from '@/lib/types'
import { DocumentUploader } from '@/components/document-uploader'
import { DeleteDocumentButton } from '@/components/delete-document-button'

export const dynamic = 'force-dynamic'

export default async function PropertyDocumentsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('id, nickname').eq('id', params.id).single()
  const { data: docs = [] } = await supabase
    .from('documents').select('*').eq('property_id', params.id).order('created_at', { ascending: false })
  if (!property) return null

  return (
    <>
      <PageHeader title={`${property.nickname}, Documents`} subtitle="Upload tenancy agreement, deposit certificate, How to Rent, invoices. Hudson summarises automatically." />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload</CardTitle>
            <CardDescription>PDFs, images, Word docs. Hudson generates a summary for searchable PDFs.</CardDescription>
          </CardHeader>
          <CardBody>
            <DocumentUploader propertyId={params.id} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stored</CardTitle></CardHeader>
          <CardBody className="p-0">
            {(docs ?? []).length === 0 ? (
              <p className="px-6 py-6 text-sm text-ink-500">No documents stored yet.</p>
            ) : (
              <ul className="divide-y hairline divide-ink-100">
                {(docs as DocumentRow[]).map((d) => (
                  <li key={d.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-900">{d.title}</p>
                        <p className="text-xs text-ink-500">
                          {d.mime_type ?? 'file'} · {Math.round((d.file_size ?? 0) / 1024)} KB ·
                          uploaded {new Date(d.created_at).toLocaleDateString('en-GB')}
                        </p>
                        {d.ai_summary && (
                          <div className="mt-2 rounded-lg bg-accent-50 p-3 text-xs leading-5 text-ink-700">
                            <p className="mb-1 font-medium text-accent-700">Hudson summary</p>
                            {d.ai_summary}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          href={`/api/documents/${d.id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-accent-700 ring-1 ring-inset ring-accent-500/30 hover:bg-accent-50"
                          title="View document"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>
                        <Badge tone={d.visible_to_tenant ? 'info' : 'neutral'}>
                          {d.visible_to_tenant ? 'Visible to tenant' : 'Private'}
                        </Badge>
                        <DeleteDocumentButton documentId={d.id} title={d.title} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
