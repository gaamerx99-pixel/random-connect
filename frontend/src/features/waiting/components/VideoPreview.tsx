import { useEffect, useRef } from 'react'
import { MicrophoneIcon, VideoCameraSlashIcon, UserIcon } from '@heroicons/react/24/outline'

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
}

export function VideoPreview({
  emptyDescription = 'Avatar mode is active',
  emptyTitle = 'No camera detected',
  isAudioMuted = false,
  isVideoMuted = false,
  label = 'You (Shivam)',
  muted = true,
  stream,
  userInitial = 'S',
  isAvatarMode = false,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const hasRealVideoTrack =
    stream &&
    stream.getVideoTracks().length > 0 &&
    !isAvatarMode &&
    !isVideoMuted

  return (
    <div className="relative flex h-full min-h-[300px] sm:min-h-[380px] w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-gray-800 bg-[#141520] shadow-sm">
      {/* 1. Real Video Stream */}
      {hasRealVideoTrack ? (
        <video
          autoPlay
          className="h-full w-full object-cover"
          muted={muted}
          playsInline
          ref={videoRef}
        />
      ) : isVideoMuted ? (
        /* Video Muted State */
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            <VideoCameraSlashIcon className="h-8 w-8" />
          </div>
          <p className="text-sm font-semibold text-gray-200">Camera is off</p>
          <p className="text-xs text-gray-400">Click the camera button below to turn it back on</p>
        </div>
      ) : (
        /* Friendly No Camera / Avatar Mode Fallback */
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white">
          {/* Circular Avatar */}
          <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600/30 text-white border-2 border-indigo-500/40">
            <span className="text-2xl font-bold">{userInitial}</span>
            <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 border border-gray-700 text-gray-300">
              <VideoCameraSlashIcon className="h-3.5 w-3.5" />
            </span>
          </div>

          <p className="text-sm font-semibold text-gray-200">{emptyTitle}</p>
          <p className="mt-0.5 text-xs text-gray-400">{emptyDescription}</p>
        </div>
      )}

      {/* Label and Mute badges */}
      <div className="absolute left-4 top-4 flex items-center gap-2 z-10">
        <span className="rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm border border-white/10">
          {label}
        </span>
        {isAudioMuted && (
          <span className="flex items-center gap-1 rounded-md bg-red-600/80 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <MicrophoneIcon className="h-3 w-3" />
            Muted
          </span>
        )}
      </div>
    </div>
  )
}
