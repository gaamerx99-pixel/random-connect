import { FormEvent, useEffect, useRef, useState } from 'react'
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline'

import type { ChatMessageItem } from '../../../types/signaling'
import { GlassPanel } from '../../../components/ui/GlassPanel'

type ChatPanelProps = {
  isConnected: boolean
  messages: ChatMessageItem[]
  onClose: () => void
  onSendMessage: (text: string) => void
}

export function ChatPanel({ isConnected, messages, onClose, onSendMessage }: ChatPanelProps) {
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return
    onSendMessage(inputText)
    setInputText('')
  }

  return (
    <GlassPanel className="flex h-full max-h-[500px] w-full flex-col overflow-hidden rounded-[2rem] border border-white/10 p-4 sm:max-h-[600px] lg:max-h-none">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
          <h3 className="text-sm font-semibold text-white">Stranger Chat</h3>
        </div>
        <button
          className="rounded-full p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white"
          onClick={onClose}
          type="button"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-zinc-400">
            {isConnected
              ? 'Say hello! Messages stay private between you and the stranger.'
              : 'Match with a stranger to start chatting.'}
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === 'me'
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30'
                      : 'bg-white/10 text-zinc-100 border border-white/10'
                  }`}
                >
                  <p className="break-words">{msg.text}</p>
                </div>
                <span className="mt-1 px-1 text-[10px] text-zinc-500">{msg.timestamp}</span>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3" onSubmit={handleSubmit}>
        <input
          className="flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          disabled={!isConnected}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isConnected ? 'Type a message...' : 'Connect to a stranger to chat'}
          type="text"
          value={inputText}
        />
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 font-medium transition hover:bg-emerald-400 disabled:opacity-40"
          disabled={!isConnected || !inputText.trim()}
          type="submit"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
        </button>
      </form>
    </GlassPanel>
  )
}
