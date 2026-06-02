import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { NickAvatar } from '@/components/nick-avatar'
import { AssistantChat } from '@/components/assistant-chat'

export const dynamic = 'force-dynamic'

export default function AssistantPage() {
  return (
    <>
      <PageHeader
        title="Nick, your AI assistant"
        subtitle="Chase rent, coordinate viewings, handle maintenance, and communicate with your tenants."
      />
      <div className="p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <NickAvatar className="h-32 w-32" />
            <p className="mt-4 max-w-md text-sm text-ink-600">
              Hi! I'm Nick. Ask me anything about your portfolio. I have context on your properties, tenants, compliance, rent, and MTD figures.
            </p>
          </div>

          <Card>
            <CardBody>
              <AssistantChat />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
