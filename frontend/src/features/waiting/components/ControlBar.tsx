import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
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
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {/* Mute Audio button */}
      <button
        className={`flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-xl transition-all sm:h-14 sm:w-14 ${
          isAudioMuted
            ? 'border-red-500/30 bg-red-500/20 text-red-300 hover:bg-red-500/30'
            : 'border-white/10 bg-white/10 text-white hover:bg-white/15'
        }`}
        onClick={onToggleAudio}
        title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        type="button"
      >
        <div className="relative flex items-center justify-center">
          <MicrophoneIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          {isAudioMuted && (
            <span className="absolute h-[2.5px] w-6 sm:w-7 rotate-[42deg] rounded-full bg-red-300 shadow-sm" />
          )}
        </div>
      </button>

      {/* Toggle Video button */}
      <button
        className={`flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-xl transition-all sm:h-14 sm:w-14 ${
          isVideoMuted
            ? 'border-red-500/30 bg-red-500/20 text-red-300 hover:bg-red-500/30'
            : 'border-white/10 bg-white/10 text-white hover:bg-white/15'
        }`}
        onClick={onToggleVideo}
        title={isVideoMuted ? 'Turn camera on' : 'Turn camera off'}
        type="button"
      >
        {isVideoMuted ? (
          <VideoCameraSlashIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        ) : (
          <VideoCameraIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        )}
      </button>

      {/* Skip / Next Stranger button */}
      <button
        className="flex min-h-12 items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/20 px-5 font-semibold text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.25)] backdrop-blur-xl transition-all hover:bg-emerald-500/30 active:scale-95 sm:min-h-14 sm:px-7 sm:text-base"
        disabled={isSearching}
        onClick={onSkip}
        title="Skip to next stranger"
        type="button"
      >
        <ArrowPathIcon className={`h-5 w-5 ${isSearching ? 'animate-spin' : ''}`} />
        <span>{isSearching ? 'Searching...' : isConnected ? 'Next Stranger' : 'Find Match'}</span>
      </button>

      {/* Chat panel toggle button */}
      <button
        className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-xl transition-all sm:h-14 sm:w-14 ${
          isChatOpen
            ? 'border-amber-400/40 bg-amber-400/20 text-amber-300'
            : 'border-white/10 bg-white/10 text-white hover:bg-white/15'
        }`}
        onClick={onToggleChat}
        title="Toggle text chat"
        type="button"
      >
        <ChatBubbleLeftRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        {unreadCount > 0 && !isChatOpen && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[11px] font-bold text-zinc-950">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Leave button */}
      <button
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 backdrop-blur-xl transition-all hover:bg-red-500/25 sm:h-14 sm:w-14"
        onClick={onLeave}
        title="Disconnect / Leave call"
        type="button"
      >
        <PhoneXMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    </div>
  )
}
