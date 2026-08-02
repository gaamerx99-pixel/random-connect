import { useEffect, useRef } from 'react'
import { MicrophoneIcon, VideoCameraSlashIcon } from '@heroicons/react/24/outline'

type VideoPreviewProps = {
  emptyDescription?: string
  emptyTitle?: string
  isAudioMuted?: boolean
  isVideoMuted?: boolean
  label?: string
  muted?: boolean
  stream: MediaStream | null
}

export function VideoPreview({
  emptyDescription = 'Allow camera access to preview your video.',
  emptyTitle = 'Camera preview unavailable',
  isAudioMuted = false,
  isVideoMuted = false,
  label = 'Local preview',
  muted = true,
  stream,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative flex h-full min-h-[260px] w-full flex-1 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-[0_30px_100px_rgba(0,0,0,0.42)]">
      {stream ? (
        <>
          <video
            autoPlay
            className={`h-full w-full object-cover ${isVideoMuted ? 'hidden' : 'block'}`}
            muted={muted}
            playsInline
            ref={videoRef}
          />
          {isVideoMuted && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-zinc-900/90 p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
                <VideoCameraSlashIcon className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-zinc-300">Camera is paused</p>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[linear-gradient(145deg,#18181b,#111827_48%,#064e3b)] p-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
            <VideoCameraSlashIcon className="h-7 w-7 text-zinc-200" />
          </span>
          <div>
            <p className="font-semibold text-white">{emptyTitle}</p>
            <p className="mt-1 text-sm text-zinc-300">{emptyDescription}</p>
          </div>
        </div>
      )}

      {/* Label and Mute badges */}
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className="rounded-full border border-white/10 bg-black/40 px-3.5 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
          {label}
        </span>
        {isAudioMuted && (
          <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/30 px-2.5 py-1 text-xs text-red-200 backdrop-blur-md">
            <MicrophoneIcon className="h-3.5 w-3.5 line-through" />
            Muted
          </span>
        )}
      </div>
    </div>
  )
}
