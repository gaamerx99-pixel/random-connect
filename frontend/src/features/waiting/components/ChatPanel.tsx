import { FormEvent, useEffect, useRef, useState } from 'react'
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline'

import type { ChatMessageItem } from '../../../types/signaling'

type ChatPanelProps = {
  isOpen?: boolean
  isConnected?: boolean
  peerName?: string
  messages: ChatMessageItem[]
  onClose: () => void
  onSendMessage: (text: string) => void
}

export function ChatPanel({
  isOpen = true,
  isConnected = true,
  peerName = 'Stranger',
  messages,
  onClose,
  onSendMessage,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!isOpen) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return
    onSendMessage(inputText)
    setInputText('')
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white border-l border-gray-200 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-gray-400'
            }`}
          />
          <div>
            <h3 className="text-xs font-bold text-gray-900">{peerName}</h3>
            <p className="text-[10px] text-gray-400">
              {isConnected ? 'Active in conversation' : 'Disconnected'}
            </p>
          </div>
        </div>
        <button
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          onClick={onClose}
          type="button"
          aria-label="Close chat"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-xs text-gray-400 px-4">
            <p className="font-semibold text-gray-600 mb-1">Say hello to {peerName}!</p>
            <p className="text-[11px] leading-relaxed">
              Messages are private between you and the stranger during this call.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === 'me'
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-gray-100 text-gray-800 rounded-bl-xs'
                  }`}
                >
                  <p className="break-words">{msg.text}</p>
                </div>
                <span className="mt-1 px-1 text-[9px] text-gray-400">
                  {msg.timestamp}
                </span>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        className="flex items-center gap-2 border-t border-gray-100 p-3 bg-white"
        onSubmit={handleSubmit}
      >
        <input
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
          disabled={!isConnected}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isConnected ? 'Type a message...' : 'Waiting for connection...'}
          type="text"
          value={inputText}
        />
        <button
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-medium transition hover:bg-indigo-700 disabled:opacity-40 shadow-sm"
          disabled={!isConnected || !inputText.trim()}
          type="submit"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  )
}
