import {
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ForwardIcon,
} from '@heroicons/react/24/outline'

type ControlBarProps = {
  isAudioMuted: boolean
  isChatOpen: boolean
  isConnected: boolean
  isSearching: boolean
  isVideoMuted: boolean
  onLeave: () => void
  onSkip: () => void
  onToggleAudio: () => void
  onToggleChat: () => void
  onToggleVideo: () => void
  unreadCount?: number
}

export function ControlBar({
  isAudioMuted,
  isChatOpen,
  isConnected,
  isSearching,
  isVideoMuted,
  onLeave,
  onSkip,
  onToggleAudio,
  onToggleChat,
  onToggleVideo,
  unreadCount = 0,
}: ControlBarProps) {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6 py-2">
      {/* 1. Mic Control */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onToggleAudio}
          className={`flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full border shadow-sm transition active:scale-95 cursor-pointer ${
            isAudioMuted
              ? 'border-red-200 bg-red-50 text-red-500'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
          type="button"
        >
          <MicrophoneIcon className="h-5 w-5" />
        </button>
        <span className="text-[11px] font-medium text-gray-500">Mic</span>
      </div>

      {/* 2. Camera Control */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onToggleVideo}
          className={`flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full border shadow-sm transition active:scale-95 cursor-pointer ${
            isVideoMuted
              ? 'border-red-200 bg-red-50 text-red-500'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title={isVideoMuted ? 'Turn camera on' : 'Turn camera off'}
          aria-label={isVideoMuted ? 'Turn camera on' : 'Turn camera off'}
          type="button"
        >
          {isVideoMuted ? (
            <VideoCameraSlashIcon className="h-5 w-5" />
          ) : (
            <VideoCameraIcon className="h-5 w-5" />
          )}
        </button>
        <span className="text-[11px] font-medium text-gray-500">Camera</span>
      </div>

      {/* 3. Next Stranger (Central prominent purple button) */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onSkip}
          disabled={isSearching}
          className="flex h-12 sm:h-13 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 sm:px-8 font-bold text-white shadow-sm hover:bg-indigo-700 transition active:scale-95 disabled:opacity-60 cursor-pointer"
          title="Connect with next stranger"
          aria-label="Next stranger"
          type="button"
        >
          <ForwardIcon className={`h-5 w-5 ${isSearching ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-semibold">
            {isSearching ? 'Searching...' : 'Next Stranger'}
          </span>
        </button>
        <span className="text-[11px] text-transparent select-none">Next</span>
      </div>

      {/* 4. Chat Control */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onToggleChat}
          className={`relative flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full border shadow-sm transition active:scale-95 cursor-pointer ${
            isChatOpen
              ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Toggle chat"
          aria-label="Toggle chat"
          type="button"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        <span className="text-[11px] font-medium text-gray-500">Chat</span>
      </div>

      {/* 5. End Call Control */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onLeave}
          className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-red-600 text-white shadow-sm hover:bg-red-700 transition active:scale-95 cursor-pointer"
          title="End Call and return to dashboard"
          aria-label="End call"
          type="button"
        >
          <PhoneXMarkIcon className="h-5 w-5" />
        </button>
        <span className="text-[11px] font-medium text-red-600">End Call</span>
      </div>
    </div>
  )
}
