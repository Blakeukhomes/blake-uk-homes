// SendGrid email helper. Safe to import; throws only if you try to send without keys.
import sgMail from '@sendgrid/mail'

let configured = false
function ensure() {
  if (configured) return
  const key = process.env.SENDGRID_API_KEY
  if (!key) throw new Error('SENDGRID_API_KEY not set')
  sgMail.setApiKey(key)
  configured = true
}

export async function sendEmail({
  to, subject, text, html,
}: {
  to: string
  subject: string
  text: string
  html?: string
}) {
  ensure()
  await sgMail.send({
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL!,
      name: process.env.SENDGRID_FROM_NAME || 'Blake UK Homes',
    },
    subject,
    text,
    html: html ?? `<pre style="font-family: ui-sans-serif, system-ui;">${text}</pre>`,
  })
}
