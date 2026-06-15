'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Mic, MicOff } from 'lucide-react'
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
  const [listening, setListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const baseInputRef = useRef('')

  // Set up Web Speech API once. Falls back silently on browsers that don't support it (Firefox).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-GB'
    rec.onresult = (e: any) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      if (final) baseInputRef.current = (baseInputRef.current + ' ' + final).trim()
      const combined = (baseInputRef.current + (interim ? ' ' + interim : '')).trim()
      setInput(combined)
    }
    rec.onend = () => setListening(false)
    rec.onerror = (e: any) => {
      const msg = e?.error === 'not-allowed'
        ? 'Microphone permission denied. Allow it in your browser settings and try again.'
        : `Microphone error: ${e?.error ?? 'unknown'}`
      setVoiceError(msg)
      setListening(false)
    }
    recognitionRef.current = rec
    return () => { try { rec.stop() } catch {} }
  }, [])

  const voiceSupported = typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

  function toggleMic() {
    setVoiceError(null)
    if (!recognitionRef.current) {
      setVoiceError('Voice input is not supported in this browser. Try Chrome, Edge, or Safari.')
      return
    }
    if (listening) {
      try { recognitionRef.current.stop() } catch {}
      setListening(false)
    } else {
      baseInputRef.current = input
      try {
        recognitionRef.current.start()
        setListening(true)
      } catch (e: any) {
        setVoiceError('Could not start microphone. Please refresh the page.')
      }
    }
  }

  async function send(text: string) {
    if (!text.trim() || busy) return
    // Stop listening before sending so it doesn't keep adding text after submit
    if (listening && recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      setListening(false)
    }
    baseInputRef.current = ''
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
            {voiceSupported && (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1.5 text-[11px] text-accent-700">
                <Mic className="h-3 w-3" /> Tip: tap the mic to speak instead of type
              </p>
            )}
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
                    <Sparkles className="h-3 w-3" /> Hudson
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
                Hudson is thinking
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Voice status / error */}
      {listening && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-500 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-danger-500"></span>
          </span>
          Listening... speak naturally. Tap the mic again to stop.
        </div>
      )}
      {voiceError && !listening && (
        <p className="mt-2 text-xs text-danger-700">{voiceError}</p>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input) }}
        className="mt-4 flex items-center gap-2 border-t hairline border-t-ink-100 pt-3"
      >
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleMic}
            className={cn(
              'shrink-0 rounded-lg p-2 transition-colors',
              listening
                ? 'bg-danger-500 text-white shadow-sm'
                : 'bg-ink-100 text-ink-700 hover:bg-accent-100 hover:text-accent-700'
            )}
            aria-label={listening ? 'Stop listening' : 'Speak to Hudson'}
            title={listening ? 'Stop listening' : 'Speak to Hudson'}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? 'Listening...' : 'Type your message or tap the mic...'}
          className="flex-1 rounded-lg border-0 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-ink-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
