import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  EllipsisVerticalIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'

import { Header } from '../components/common/Header'
import { BannerAd } from '../components/ads/BannerAd'

interface FriendItem {
  id: string
  name: string
  country: string
  isOnline: boolean
  avatarBg: string
  avatarInitial: string
}

const INITIAL_FRIENDS: FriendItem[] = [
  {
    id: 'f1',
    name: 'Priya',
    country: 'India',
    isOnline: true,
    avatarBg: 'bg-pink-500',
    avatarInitial: 'P',
  },
  {
    id: 'f2',
    name: 'Alex',
    country: 'United States',
    isOnline: false,
    avatarBg: 'bg-blue-500',
    avatarInitial: 'A',
  },
  {
    id: 'f3',
    name: 'Sara',
    country: 'Canada',
    isOnline: false,
    avatarBg: 'bg-purple-500',
    avatarInitial: 'S',
  },
  {
    id: 'f4',
    name: 'Daniel',
    country: 'UK',
    isOnline: false,
    avatarBg: 'bg-emerald-500',
    avatarInitial: 'D',
  },
]

export function FriendsPage() {
  const [friends, setFriends] = useState<FriendItem[]>(INITIAL_FRIENDS)
  const [activeMessageFriend, setActiveMessageFriend] = useState<string | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [messages, setMessages] = useState<Record<string, string[]>>({
    f1: ['Hey! Nice connecting on RandomConnect earlier!'],
  })

  const handleSendMessage = (friendId: string) => {
    if (!chatMessage.trim()) return
    setMessages((prev) => ({
      ...prev,
      [friendId]: [...(prev[friendId] || []), chatMessage.trim()],
    }))
    setChatMessage('')
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Friends</h1>
                <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
                  People you've connected with.
                </p>
              </div>

              <Link
                to="/waiting"
                className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-sm inline-flex items-center gap-1.5"
              >
                <UserPlusIcon className="h-4 w-4" />
                <span>Meet More</span>
              </Link>
            </div>

            {/* Friends List (Screen 6) */}
            <div className="divide-y divide-gray-100 mt-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between py-4 hover:bg-gray-50/60 transition px-2 rounded-lg"
                >
                  {/* Left: Avatar + Details */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${friend.avatarBg} text-base font-bold text-white shadow-sm`}
                    >
                      {friend.avatarInitial}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{friend.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <span>{friend.country}</span>
                        <span>•</span>
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            friend.isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                          }`}
                        />
                        <span className={friend.isOnline ? 'text-emerald-600 font-medium' : ''}>
                          {friend.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setActiveMessageFriend(
                          activeMessageFriend === friend.id ? null : friend.id,
                        )
                      }
                      className="rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
                    >
                      Message
                    </button>

                    <button
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                      aria-label="More options"
                    >
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Inline Message Drawer if active */}
            {activeMessageFriend && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-gray-700">
                    Chat with {friends.find((f) => f.id === activeMessageFriend)?.name}
                  </span>
                  <button
                    onClick={() => setActiveMessageFriend(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2 mb-3 max-h-36 overflow-y-auto text-xs">
                  {(messages[activeMessageFriend] || []).map((msg, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-lg border border-gray-200 text-gray-800">
                      {msg}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage(activeMessageFriend)
                    }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    onClick={() => handleSendMessage(activeMessageFriend)}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>

          <BannerAd slotId="friends-page-bottom" />
        </div>
      </main>
    </div>
  )
}
