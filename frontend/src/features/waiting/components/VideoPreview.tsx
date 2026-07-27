import { useEffect, useRef } from 'react'
import { VideoCameraSlashIcon } from '@heroicons/react/24/outline'

type VideoPreviewProps = {
  emptyDescription?: string
  emptyTitle?: string
  label?: string
  muted?: boolean
  stream: MediaStream | null
}

export function VideoPreview({
  emptyDescription = 'Allow camera access to preview your video.',
  emptyTitle = 'Camera preview unavailable',
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
    <div className="relative aspect-video overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-[0_30px_100px_rgba(0,0,0,0.42)]">
      {stream ? (
        <video
          autoPlay
          className="h-full w-full object-cover"
          muted={muted}
          playsInline
          ref={videoRef}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-[linear-gradient(145deg,#18181b,#111827_48%,#064e3b)] px-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
            <VideoCameraSlashIcon className="h-7 w-7 text-zinc-200" />
          </span>
          <div>
            <p className="font-semibold text-white">{emptyTitle}</p>
            <p className="mt-1 text-sm text-zinc-300">{emptyDescription}</p>
          </div>
        </div>
      )}
      <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs text-white/80 backdrop-blur-md">
        {label}
      </div>
    </div>
  )
}
