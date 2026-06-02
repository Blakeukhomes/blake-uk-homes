// PDF helpers that run on the server (Node runtime). jsPDF works there too.
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const COURT_FOOTER =
  'All entries timestamped at point of submission. Cannot be retrospectively altered. Suitable for county court submission.'

function header(doc: jsPDF, title: string) {
  doc.setFont('helvetica', 'bold').setFontSize(18)
  doc.text('Blake UK Homes', 14, 18)
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(120)
  doc.text(new Date().toLocaleString('en-GB'), 196, 18, { align: 'right' })
  doc.setDrawColor(220).line(14, 22, 196, 22)

  doc.setTextColor(20).setFont('helvetica', 'bold').setFontSize(14)
  doc.text(title, 14, 32)
}

function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'italic').setFontSize(8).setTextColor(110)
    doc.text(COURT_FOOTER, 14, 287, { maxWidth: 182 })
    doc.text(`Page ${i} of ${pageCount}`, 196, 292, { align: 'right' })
  }
}

export function faultTranscriptPdf(input: {
  property: { nickname: string; address: string }
  tenant: { name: string; email?: string | null; phone?: string | null } | null
  fault: { reference: string; category: string; severity: string; description: string; reported_at: string; current_state: string }
  events: { occurred_at: string; state: string; actor_role: string | null; actor_name: string | null; note: string | null }[]
  bookings: { contractor_name: string; trade: string | null; scheduled_for: string; notes: string | null }[]
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  header(doc, 'Fault transcript — Court submission')

  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(20)
  doc.text(`Reference: ${input.fault.reference}`, 14, 42)
  doc.text(`Reported:  ${new Date(input.fault.reported_at).toLocaleString('en-GB')}`, 14, 48)
  doc.text(`Category:  ${input.fault.category} (${input.fault.severity})`, 14, 54)
  doc.text(`Status:    ${input.fault.current_state.replace('_', ' ')}`, 14, 60)

  doc.setFont('helvetica', 'bold').text('Property', 14, 72)
  doc.setFont('helvetica', 'normal').text(`${input.property.nickname} — ${input.property.address}`, 14, 78, { maxWidth: 182 })

  doc.setFont('helvetica', 'bold').text('Tenant', 14, 90)
  doc.setFont('helvetica', 'normal').text(
    input.tenant ? `${input.tenant.name}${input.tenant.email ? ' · ' + input.tenant.email : ''}${input.tenant.phone ? ' · ' + input.tenant.phone : ''}` : '—',
    14, 96,
  )

  doc.setFont('helvetica', 'bold').text('Description', 14, 108)
  doc.setFont('helvetica', 'normal').text(input.fault.description, 14, 114, { maxWidth: 182 })

  autoTable(doc, {
    startY: 130,
    head: [['Timestamp', 'State', 'Actor', 'Note']],
    body: input.events.map((e) => [
      new Date(e.occurred_at).toLocaleString('en-GB'),
      e.state.replace('_', ' '),
      `${e.actor_name ?? '—'} (${e.actor_role ?? '—'})`,
      e.note ?? '',
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [11, 16, 32], textColor: 255 },
    margin: { left: 14, right: 14 },
  })

  if (input.bookings.length > 0) {
    autoTable(doc, {
      head: [['Contractor', 'Trade', 'Scheduled for', 'Notes']],
      body: input.bookings.map((b) => [
        b.contractor_name,
        b.trade ?? '',
        new Date(b.scheduled_for).toLocaleString('en-GB'),
        b.notes ?? '',
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [11, 16, 32], textColor: 255 },
      margin: { left: 14, right: 14 },
    })
  }

  footer(doc)
  return Buffer.from(doc.output('arraybuffer'))
}

export function arrearsPdf(input: {
  property: { nickname: string; address: string; monthly_rent: number }
  tenant: { name: string } | null
  payments: { period_start: string; due_date: string; amount_due: number; amount_paid: number; received_on: string | null; status: string; notes: string | null }[]
  arrearsTotal: number
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  header(doc, 'Rent arrears statement — Section 8 evidence')

  doc.setFontSize(10)
  doc.text(`Property: ${input.property.nickname} — ${input.property.address}`, 14, 42, { maxWidth: 182 })
  doc.text(`Tenant:   ${input.tenant?.name ?? '—'}`, 14, 52)
  doc.text(`Monthly rent: £${input.property.monthly_rent.toFixed(2)}`, 14, 58)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total arrears: £${input.arrearsTotal.toFixed(2)}`, 14, 68)
  doc.setFont('helvetica', 'normal')

  autoTable(doc, {
    startY: 78,
    head: [['Period', 'Due', 'Amount due', 'Paid', 'Received', 'Status', 'Notes']],
    body: input.payments.map((p) => [
      new Date(p.period_start).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      new Date(p.due_date).toLocaleDateString('en-GB'),
      `£${Number(p.amount_due).toFixed(2)}`,
      `£${Number(p.amount_paid).toFixed(2)}`,
      p.received_on ? new Date(p.received_on).toLocaleDateString('en-GB') : '—',
      p.status,
      p.notes ?? '',
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [11, 16, 32], textColor: 255 },
    margin: { left: 14, right: 14 },
  })

  footer(doc)
  return Buffer.from(doc.output('arraybuffer'))
}

export function messagesPdf(input: {
  contact_name: string
  property_name?: string
  category: string
  messages: { sender: string; sender_name: string | null; body: string; sent_at: string }[]
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  header(doc, `Message transcript, ${input.contact_name}`)

  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(20)
  doc.text(`Category: ${input.category}`, 14, 42)
  if (input.property_name) doc.text(`Property: ${input.property_name}`, 14, 48)

  autoTable(doc, {
    startY: 56,
    head: [['Timestamp', 'Sender', 'Message']],
    body: input.messages.map((m) => [
      new Date(m.sent_at).toLocaleString('en-GB'),
      `${m.sender_name ?? m.sender} (${m.sender})`,
      m.body,
    ]),
    styles: { fontSize: 9, cellPadding: 2.5, valign: 'top' },
    headStyles: { fillColor: [99, 102, 241], textColor: 255 },
    columnStyles: { 0: { cellWidth: 36 }, 1: { cellWidth: 40 } },
    margin: { left: 14, right: 14 },
  })

  footer(doc)
  return Buffer.from(doc.output('arraybuffer'))
}

export function mtdQuarterPdf(input: {
  property: { nickname: string; address: string }
  quarter: { label: string; start: string; end: string }
  income: { label: string; total: number }[]
  expenses: { label: string; total: number }[]
  totalIncome: number
  totalExpenses: number
  net: number
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  header(doc, 'UK Property Income and Expenses (MTD ITSA)')

  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(20)
  doc.text(`Period Ended: ${new Date(input.quarter.end).toLocaleDateString('en-GB', { dateStyle: 'long' })}`, 14, 42)
  doc.text(`Quarter: ${input.quarter.label}`, 14, 48)
  doc.text(`Address of Property: ${input.property.nickname}, ${input.property.address}`, 14, 54, { maxWidth: 182 })

  // Income table
  autoTable(doc, {
    startY: 66,
    head: [['Income', '£']],
    body: [
      ...input.income.map((r) => [r.label, r.total.toFixed(2)]),
      [{ content: 'Total income', styles: { fontStyle: 'bold' } }, { content: input.totalIncome.toFixed(2), styles: { fontStyle: 'bold' } }],
    ],
    styles: { fontSize: 10, cellPadding: 2.5 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 130 }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  // Expenses table
  autoTable(doc, {
    head: [['Expenses', '£']],
    body: [
      ...input.expenses.map((r) => [r.label, r.total.toFixed(2)]),
      [{ content: 'Total expenses', styles: { fontStyle: 'bold' } }, { content: input.totalExpenses.toFixed(2), styles: { fontStyle: 'bold' } }],
    ],
    styles: { fontSize: 10, cellPadding: 2.5 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 130 }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  // Net
  autoTable(doc, {
    body: [[{ content: input.net >= 0 ? 'Profit' : 'Loss', styles: { fontStyle: 'bold', fontSize: 12 } },
            { content: input.net.toFixed(2), styles: { halign: 'right', fontStyle: 'bold', fontSize: 12, textColor: input.net >= 0 ? [21, 128, 61] : [185, 28, 28] } }]],
    columnStyles: { 0: { cellWidth: 130 }, 1: {} },
    margin: { left: 14, right: 14 },
    theme: 'plain',
  })

  footer(doc)
  return Buffer.from(doc.output('arraybuffer'))
}

export function section13Pdf(input: {
  landlord: { name: string; address: string }
  tenant: { name: string }
  property: { address: string }
  currentRent: number
  newRent: number
  effectiveDate: string
  reason?: string | null
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  header(doc, 'Section 13 — Notice of rent increase')

  let y = 42
  const line = (t: string, h = 6) => { doc.text(t, 14, y, { maxWidth: 182 }); y += h }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold'); line('Form 4 — Landlord\'s Notice proposing a new rent under the Housing Act 1988, s.13(2).')
  doc.setFont('helvetica', 'normal'); y += 2

  line(`To: ${input.tenant.name}`)
  line(`Of: ${input.property.address}`)
  y += 2
  line(`From: ${input.landlord.name}`)
  line(`Of:   ${input.landlord.address}`)
  y += 4

  doc.setFont('helvetica', 'bold'); line('1. Property')
  doc.setFont('helvetica', 'normal'); line(input.property.address, 8)

  doc.setFont('helvetica', 'bold'); line('2. New rent proposed')
  doc.setFont('helvetica', 'normal')
  line(`Existing rent: £${input.currentRent.toFixed(2)} per calendar month.`)
  line(`Proposed rent: £${input.newRent.toFixed(2)} per calendar month.`)
  line(`Effective from: ${new Date(input.effectiveDate).toLocaleDateString('en-GB', { dateStyle: 'long' })}.`, 8)

  if (input.reason) {
    doc.setFont('helvetica', 'bold'); line('3. Reason for the increase')
    doc.setFont('helvetica', 'normal'); line(input.reason, 8)
  }

  doc.setFont('helvetica', 'bold'); line('Tenant\'s right to challenge')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  line('If you, the tenant, believe the proposed rent is more than a private landlord could expect to obtain for the property in the open market, you may refer this notice to the First-tier Tribunal (Property Chamber) before the effective date stated above. The Tribunal will decide a market rent in accordance with section 14 of the Housing Act 1988.', 4)
  y += 4
  line('You should seek independent advice before referring this notice. Citizens Advice, Shelter, and your local housing aid centre can help.', 4)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold'); line('Signed (Landlord):')
  doc.setFont('helvetica', 'normal')
  doc.rect(14, y - 2, 90, 18).stroke()
  y += 22
  line(`${input.landlord.name}    Date: ____ / ____ / ______`)

  y += 6
  doc.setFont('helvetica', 'bold'); line('Acknowledged by tenant (optional):')
  doc.setFont('helvetica', 'normal')
  doc.rect(14, y - 2, 90, 18).stroke()
  y += 22
  line(`${input.tenant.name}    Date: ____ / ____ / ______`)

  y += 8
  doc.setFontSize(8).setTextColor(110)
  doc.text('Serve this notice by recorded delivery or in person. Retain proof of service.', 14, y, { maxWidth: 182 })

  footer(doc)
  return Buffer.from(doc.output('arraybuffer'))
}
