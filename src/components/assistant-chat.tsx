'use client'
import { useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

const SUGGESTIONS = [
  'Portfolio overview',
  'My properties',
  'Reminders',
  'Active leases',
  'Overdue rent',
  'MTD quarter summary',
]

interface ChatMessage {
  role: 'user' | 'assistant'
  body: string
}

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  async function send(text: string) {
    if (!text.trim() || busy) return
    const userMsg: ChatMessage = { role: 'user', body: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.body })) }),
      })
      const data = await res.json()
      setMessages([...next, { role: 'assistant', body: data.reply ?? 'No reply.' }])
    } catch (e: any) {
      setMessages([...next, { role: 'assistant', body: `Sorry, I couldn't reach the AI service right now. (${e?.message ?? 'error'})` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-[480px] flex-col">
      {/* Conversation */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-500">Try one of these</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-700 ring-1 ring-inset ring-ink-200 hover:bg-accent-50 hover:text-accent-700 hover:ring-accent-500/30"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'flex',
                m.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
                  m.role === 'user'
                    ? 'bg-accent-500 text-white'
                    : 'bg-ink-50 text-ink-900 ring-1 ring-ink-100'
                )}
              >
                {m.role === 'assistant' && (
                  <p className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent-700">
                    <Sparkles className="h-3 w-3" /> Nick
                  </p>
                )}
                <p>{m.body}</p>
              </div>
            </div>
          ))
        )}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-ink-50 px-4 py-2.5 text-sm text-ink-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-500" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-500" style={{ animationDelay: '0.2s' }} />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-500" style={{ animationDelay: '0.4s' }} />
                Nick is thinking
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input) }}
        className="mt-4 flex items-center gap-2 border-t hairline border-t-ink-100 pt-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-lg border-0 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-ink-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
