import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MicrophoneIcon,
  SignalIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'

import { Button } from '../../components/ui/Button'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { useLocalMedia } from './useLocalMedia'
import { useWebRtcSignaling } from './useWebRtcSignaling'
import { StatusCard } from './components/StatusCard'
import { VideoPreview } from './components/VideoPreview'

function formatPermissionStatus(status: string) {
  if (status === 'checking') {
    return 'Checking'
  }

  return status
    .split(/[\s-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function statusTone(status: string) {
  if (status === 'granted' || status === 'ready' || status === 'connected') {
    return 'good'
  }

  if (status === 'denied' || status === 'blocked' || status === 'unsupported' || status === 'failed') {
    return 'warning'
  }

  return 'muted'
}

export function WaitingRoom() {
  const navigate = useNavigate()
  const {
    cameraStatus,
    connectionStatus,
    errorMessage,
    isRequesting,
    microphoneStatus,
    requestMedia,
    stream,
  } = useLocalMedia()
  const {
    errorMessage: signalingErrorMessage,
    findStranger,
    isSearching,
    remoteStream,
    signalingStatus,
  } = useWebRtcSignaling(stream)

  const canSearch = connectionStatus === 'ready'
  const connectionLabel = signalingStatus === 'idle' ? connectionStatus : signalingStatus

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#07080d_0%,#101014_54%,#07080d_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:py-8">
        <nav className="mb-8 flex items-center justify-between">
          <button
            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/[0.1]"
            onClick={() => navigate('/')}
            type="button"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Home
          </button>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-zinc-300 backdrop-blur-xl sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Waiting room
          </div>
        </nav>

        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.45 }}
        >
          <GlassPanel className="rounded-[2rem] p-4 sm:p-5">
            <div className="grid gap-4 xl:grid-cols-2">
              <VideoPreview stream={stream} />
              <VideoPreview
                emptyDescription="The stranger's stream will appear here after WebRTC connects."
                emptyTitle="Waiting for remote video"
                label="Remote video"
                muted={false}
                stream={remoteStream}
              />
            </div>
            {errorMessage || signalingErrorMessage ? (
              <div className="mt-4 rounded-3xl border border-amber-300/20 bg-amber-300/[0.08] p-4 text-sm leading-6 text-amber-100">
                {errorMessage || signalingErrorMessage}
              </div>
            ) : null}
          </GlassPanel>

          <div className="flex flex-col gap-5">
            <GlassPanel className="rounded-[2rem] p-6 sm:p-8">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm text-zinc-200">
                <BoltIcon className="h-4 w-4 text-amber-300" />
                Device check before matching
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">Ready your camera and mic.</h1>
              <p className="mt-4 leading-7 text-zinc-400">
                RandomConnect needs local camera and microphone access before you search. When matched, native WebRTC
                connects your local preview to the stranger's remote stream.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button className="w-full sm:w-auto" disabled={!canSearch || isSearching} onClick={findStranger}>
                  <SignalIcon className="h-5 w-5" />
                  {isSearching ? 'Finding Stranger...' : 'Find Stranger'}
                </Button>
                <Button className="w-full sm:w-auto" onClick={() => navigate('/')} variant="secondary">
                  <ArrowLeftIcon className="h-5 w-5" />
                  Back to Home
                </Button>
              </div>
              {!canSearch ? (
                <Button className="mt-3 w-full sm:w-auto" disabled={isRequesting} onClick={requestMedia} variant="ghost">
                  {isRequesting ? 'Requesting access...' : 'Request camera and mic access'}
                </Button>
              ) : null}
            </GlassPanel>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <StatusCard
                description="Camera permission is required to show your local preview."
                icon={cameraStatus === 'granted' ? CheckCircleIcon : VideoCameraIcon}
                label="Camera status"
                tone={statusTone(cameraStatus)}
                value={formatPermissionStatus(cameraStatus)}
              />
              <StatusCard
                description="Microphone permission is required before future video calls begin."
                icon={microphoneStatus === 'granted' ? CheckCircleIcon : MicrophoneIcon}
                label="Microphone status"
                tone={statusTone(microphoneStatus)}
                value={formatPermissionStatus(microphoneStatus)}
              />
              <StatusCard
                description="This reflects matchmaking, signaling, and native WebRTC peer connection state."
                icon={connectionLabel === 'blocked' || connectionLabel === 'failed' ? ExclamationTriangleIcon : SignalIcon}
                label="Connection status"
                tone={statusTone(connectionLabel)}
                value={formatPermissionStatus(connectionLabel)}
              />
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  )
}
