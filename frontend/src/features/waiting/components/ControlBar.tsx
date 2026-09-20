import {
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ForwardIcon,
  ArrowPathIcon,
  SparklesIcon,
  FaceSmileIcon,
  CameraIcon,
  Squares2X2Icon,
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
  onFlipCamera?: () => void
  isFlippingCamera?: boolean
  onToggleFilters?: () => void
  activeFilterName?: string
  onToggleReactions?: () => void
  onCaptureSnapshot?: () => void
  isPipMode?: boolean
  onToggleLayout?: () => void
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
  onFlipCamera,
  isFlippingCamera = false,
  onToggleFilters,
  activeFilterName = 'Natural',
  onToggleReactions,
  onCaptureSnapshot,
  isPipMode = false,
  onToggleLayout,
}: ControlBarProps) {
  const hasFilterApplied = activeFilterName && activeFilterName !== 'Natural'

  return (
    <div className="flex items-center justify-center gap-1 xs:gap-2 sm:gap-3.5 py-1.5 px-1.5 xs:px-2.5 sm:px-4 bg-white/95 sm:bg-white/85 backdrop-blur-md rounded-2xl border border-gray-200/90 shadow-lg max-w-full overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
      {/* 1. Mic Control */}
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={onToggleAudio}
          className={`flex h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border shadow-xs transition active:scale-90 cursor-pointer ${
            isAudioMuted
              ? 'border-red-200 bg-red-50 text-red-500'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title={isAudioMuted ? 'Unmute microphone (Space)' : 'Mute microphone (Space)'}
          aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
          type="button"
        >
          <MicrophoneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-gray-500">Mic</span>
      </div>

      {/* 2. Camera Control */}
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={onToggleVideo}
          className={`flex h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border shadow-xs transition active:scale-90 cursor-pointer ${
            isVideoMuted
              ? 'border-red-200 bg-red-50 text-red-500'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title={isVideoMuted ? 'Turn camera on (V)' : 'Turn camera off (V)'}
          aria-label={isVideoMuted ? 'Turn camera on' : 'Turn camera off'}
          type="button"
        >
          {isVideoMuted ? (
            <VideoCameraSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <VideoCameraIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>
        <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-gray-500">Camera</span>
      </div>

      {/* 3. WhatsApp Camera Flip Control */}
      {onFlipCamera && (
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={onFlipCamera}
            className={`flex h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-xs hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition active:scale-90 cursor-pointer ${
              isFlippingCamera ? 'ring-2 ring-indigo-500/40 text-indigo-600' : ''
            }`}
            title="Flip camera front or back (F)"
            aria-label="Flip camera front or back"
            type="button"
          >
            <ArrowPathIcon
              className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-500 ${
                isFlippingCamera ? 'rotate-180 text-indigo-600' : ''
              }`}
            />
          </button>
          <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-gray-500">Flip</span>
        </div>
      )}

      {/* 4. Central Next Stranger Button */}
      <div className="flex flex-col items-center gap-0.5 px-0.5">
        <button
          onClick={onSkip}
          disabled={isSearching}
          className="flex h-9 sm:h-12 items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-3 xs:px-4 sm:px-6 font-bold text-white shadow-md hover:from-indigo-700 hover:to-indigo-800 transition active:scale-95 disabled:opacity-60 cursor-pointer"
          title="Connect with next stranger"
          aria-label="Next stranger"
          type="button"
        >
          <ForwardIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${isSearching ? 'animate-pulse' : ''}`} />
          <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
            {isSearching ? 'Searching...' : 'Next'}
          </span>
        </button>
        <span className="text-[9px] xs:text-[10px] sm:text-[11px] text-transparent select-none hidden sm:inline">Next</span>
      </div>

      {/* 5. Video Enhancement Filters Control */}
      {onToggleFilters && (
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={onToggleFilters}
            className={`relative flex h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border shadow-xs transition active:scale-90 cursor-pointer ${
              hasFilterApplied
                ? 'border-indigo-400 bg-indigo-50 text-indigo-600 ring-2 ring-indigo-500/20'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title="Video filters & beautify"
            aria-label="Video filters"
            type="button"
          >
            <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            {hasFilterApplied && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>
          <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-gray-500">Filter</span>
        </div>
      )}

      {/* 6. Reactions Control (when in call) */}
      {onToggleReactions && isConnected && (
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={onToggleReactions}
            className="flex h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-xs hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition active:scale-90 cursor-pointer"
            title="Send live emoji reaction"
            aria-label="Send reaction"
            type="button"
          >
            <FaceSmileIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-gray-500">React</span>
        </div>
      )}

      {/* 7. Snapshot Photo Control (when in call) */}
      {onCaptureSnapshot && isConnected && (
        <div className="hidden sm:flex flex-col items-center gap-0.5">
          <button
            onClick={onCaptureSnapshot}
            className="flex h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition active:scale-90 cursor-pointer"
            title="Capture call snapshot"
            aria-label="Capture snapshot"
            type="button"
          >
            <CameraIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-gray-500">Photo</span>
        </div>
      )}

      {/* 8. Layout View Switcher (PiP vs Split) */}
      {onToggleLayout && isConnected && (
        <div className="hidden sm:flex flex-col items-center gap-0.5">
          <button
            onClick={onToggleLayout}
            className={`flex h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border shadow-xs transition active:scale-90 cursor-pointer ${
              isPipMode
                ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title={isPipMode ? 'Switch to Split Screen' : 'Switch to Floating Screen'}
            aria-label="Toggle layout mode"
            type="button"
          >
            <Squares2X2Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-gray-500">Layout</span>
        </div>
      )}

      {/* 9. Chat Control */}
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={onToggleChat}
          className={`relative flex h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border shadow-xs transition active:scale-90 cursor-pointer ${
            isChatOpen
              ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Toggle chat"
          aria-label="Toggle chat"
          type="button"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-gray-500">Chat</span>
      </div>

      {/* 10. End Call Control */}
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={onLeave}
          className="flex h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition active:scale-90 cursor-pointer"
          title="End Call and return to dashboard"
          aria-label="End call"
          type="button"
        >
          <PhoneXMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-medium text-red-600">End</span>
      </div>
    </div>
  )
}
