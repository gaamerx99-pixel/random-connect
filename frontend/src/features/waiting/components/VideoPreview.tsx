import { useEffect, useRef } from 'react'
import {
  MicrophoneIcon,
  VideoCameraSlashIcon,
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

type VideoPreviewProps = {
  emptyDescription?: string
  emptyTitle?: string
  isAudioMuted?: boolean
  isVideoMuted?: boolean
  label?: string
  muted?: boolean
  stream: MediaStream | null
  userInitial?: string
  isAvatarMode?: boolean
  filterCss?: string
  filterName?: string
  facingMode?: 'user' | 'environment'
  isFlippingCamera?: boolean
  onFlipCamera?: () => void
  onToggleExpand?: () => void
  isPip?: boolean
  onClick?: () => void
}

export function VideoPreview({
  emptyDescription = 'Avatar mode is active',
  emptyTitle = 'No camera detected',
  isAudioMuted = false,
  isVideoMuted = false,
  label = 'You',
  muted = true,
  stream,
  userInitial = 'S',
  isAvatarMode = false,
  filterCss = 'none',
  filterName,
  facingMode = 'user',
  isFlippingCamera = false,
  onFlipCamera,
  onToggleExpand,
  isPip = false,
  onClick,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Ensure video element always binds and plays stream seamlessly
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    if (stream) {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream
      }
      videoEl.play().catch(() => {
        // Autoplay may wait for user gesture
      })
    } else {
      videoEl.srcObject = null
    }
  }, [stream, isVideoMuted, isAvatarMode])

  const hasRealVideoTrack =
    stream &&
    stream.getVideoTracks().length > 0 &&
    !isAvatarMode &&
    !isVideoMuted

  // Mirror front-facing camera for natural selfie view; do not mirror back camera or remote peers
  const isFrontCamera = muted && facingMode === 'user'

  return (
    <div
      onClick={onClick}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-gray-800/80 bg-[#12131c] shadow-md select-none transition-all duration-300 ${
        isPip ? 'cursor-pointer hover:border-indigo-500/70 hover:shadow-indigo-500/10' : ''
      }`}
    >
      {/* 1. Real Video Stream Element (ALWAYS MOUNTED TO PREVENT RE-BIND BLACK SCREEN BUG) */}
      <video
        autoPlay
        playsInline
        muted={muted}
        ref={videoRef}
        style={{ filter: filterCss || 'none' }}
        className={`h-full w-full object-cover transition-transform duration-400 ${
          isFrontCamera ? 'scale-x-[-1]' : 'scale-x-100'
        } ${isFlippingCamera ? 'rotate-y-180 scale-95 opacity-50' : 'rotate-y-0 opacity-100'} ${
          !hasRealVideoTrack ? 'invisible absolute' : 'visible'
        }`}
      />

      {/* 2. Video Muted Overlay State */}
      {isVideoMuted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-center text-white bg-gradient-to-b from-[#181926] to-[#0f1019] z-10 animate-fade-in">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-red-500/15 text-red-400 border border-red-500/25 shadow-inner">
            <VideoCameraSlashIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-200">Camera is off</p>
            <p className="mt-0.5 text-xs text-gray-400">
              {isPip ? 'Tap to turn on' : 'Click the camera button below to turn it on'}
            </p>
          </div>
        </div>
      )}

      {/* 3. Avatar Mode / No Hardware Camera Detected Fallback */}
      {!hasRealVideoTrack && !isVideoMuted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white bg-gradient-to-b from-[#181a29] to-[#0d0e17] z-10">
          <div className="relative mb-3 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-indigo-600/30 text-white border-2 border-indigo-500/40 shadow-lg">
            <span className="text-2xl sm:text-3xl font-bold">{userInitial}</span>
            <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 border border-gray-700 text-gray-300">
              <VideoCameraSlashIcon className="h-3.5 w-3.5" />
            </span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-gray-200">{emptyTitle}</p>
          <p className="mt-0.5 text-[11px] sm:text-xs text-gray-400 max-w-[200px] sm:max-w-xs">{emptyDescription}</p>
        </div>
      )}

      {/* 4. Top Badges: Name Label, Audio Mute, and Active Quality Filter */}
      <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5 z-20 pointer-events-none">
        <span className="rounded-lg bg-black/65 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10 shadow-sm">
          {label}
        </span>

        {isAudioMuted && (
          <span className="flex items-center gap-1 rounded-lg bg-red-600/90 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-md shadow-xs">
            <MicrophoneIcon className="h-3 w-3" />
            Muted
          </span>
        )}

        {filterName && filterName !== 'Natural' && hasRealVideoTrack && (
          <span className="hidden sm:flex items-center gap-1 rounded-lg bg-indigo-600/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md border border-indigo-400/30">
            <SparklesIcon className="h-3 w-3 text-amber-300" />
            {filterName}
          </span>
        )}
      </div>

      {/* 5. Top Right Quick Actions (WhatsApp Style Camera Flip & Expand PiP) */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 z-20">
        {/* WhatsApp-style Camera Flip button on local video feed */}
        {onFlipCamera && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFlipCamera()
            }}
            type="button"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-md hover:bg-black/85 hover:border-indigo-400/60 transition active:scale-90 cursor-pointer"
            title="Flip camera (Front / Back)"
            aria-label="Flip camera front or back"
          >
            <ArrowPathIcon
              className={`h-4 w-4 sm:h-4.5 sm:w-4.5 transition-transform duration-500 ${
                isFlippingCamera ? 'rotate-180 text-indigo-400' : 'text-white'
              }`}
            />
          </button>
        )}

        {/* Expand / Swap view button when in PiP mode */}
        {onToggleExpand && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            type="button"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-md hover:bg-black/85 hover:text-indigo-300 transition active:scale-90 cursor-pointer"
            title="Swap or enlarge view"
            aria-label="Swap or enlarge view"
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
