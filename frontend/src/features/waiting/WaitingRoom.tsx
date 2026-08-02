import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MicrophoneIcon,
  ShieldExclamationIcon,
  SignalIcon,
  VideoCameraIcon,
  HandRaisedIcon,
} from '@heroicons/react/24/outline'

import { GlassPanel } from '../../components/ui/GlassPanel'
import { useLocalMedia } from './useLocalMedia'
import { useWebRtcSignaling } from './useWebRtcSignaling'
import { ChatPanel } from './components/ChatPanel'
import { ControlBar } from './components/ControlBar'
import { StatusCard } from './components/StatusCard'
import { VideoPreview } from './components/VideoPreview'
import { blockUser, reportUser } from '../../services/api'

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
  const { getToken } = useAuth()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showStatusDetails, setShowStatusDetails] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('Inappropriate Behavior')
  const [reportDetails, setReportDetails] = useState('')

  const {
    cameraStatus,
    connectionStatus,
    errorMessage,
    isAudioMuted,
    isVideoMuted,
    isRequesting,
    microphoneStatus,
    requestMedia,
    stream,
    toggleAudio,
    toggleVideo,
  } = useLocalMedia()

  const {
    chatMessages,
    errorMessage: signalingErrorMessage,
    findStranger,
    isSearching,
    leaveRoom,
    peerProfile,
    remoteStream,
    sendChatMessage,
    signalingStatus,
    skipStranger,
  } = useWebRtcSignaling(stream)

  const canSearch = connectionStatus === 'ready'
  const isConnected = signalingStatus === 'connected' || signalingStatus === 'matched'
  const connectionLabel = signalingStatus === 'idle' ? connectionStatus : signalingStatus

  const handleSkip = () => {
    if (signalingStatus === 'idle') {
      findStranger()
    } else {
      skipStranger()
    }
  }

  const handleLeave = () => {
    leaveRoom()
    navigate('/dashboard')
  }

  const handleBlockUser = async () => {
    if (!peerProfile?.clerk_id) return
    try {
      const token = (await getToken()) || 'mock-dev-token'
      await blockUser(token, peerProfile.clerk_id)
      alert('User blocked successfully. Moving to next stranger...')
      skipStranger()
    } catch (err: any) {
      alert(`Block failed: ${err.message}`)
    }
  }

  const handleReportUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!peerProfile?.clerk_id) return
    try {
      const token = (await getToken()) || 'mock-dev-token'
      await reportUser(token, peerProfile.clerk_id, reportReason, reportDetails)
      alert('Report submitted. Thank you for keeping RandomConnect safe.')
      setShowReportModal(false)
      skipStranger()
    } catch (err: any) {
      alert(`Report failed: ${err.message}`)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#07080d] text-white">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#07080d_0%,#101014_54%,#07080d_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative flex flex-1 flex-col px-3 py-4 sm:px-6 lg:px-8">
        {/* Navigation Bar */}
        <nav className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/[0.1]"
              onClick={handleLeave}
              type="button"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>

          {/* Connection Status & Peer Info */}
          <div className="flex items-center gap-2">
            {isConnected && peerProfile && (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs text-indigo-200">
                <span className="font-semibold text-white">{peerProfile.name}</span>
                <span>• {peerProfile.gender} ({peerProfile.age})</span>
                <span>• {peerProfile.country}</span>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-medium sm:text-sm text-zinc-300 backdrop-blur-xl">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isConnected
                    ? 'bg-emerald-400 animate-pulse'
                    : isSearching
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-zinc-400'
                }`}
              />
              <span className="capitalize">
                {isSearching ? 'Searching Match...' : isConnected ? 'Connected to Stranger' : connectionLabel}
              </span>
            </div>

            {isConnected && (
              <>
                <button
                  className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 hover:bg-red-500/20"
                  onClick={() => setShowReportModal(true)}
                  title="Report Stranger"
                >
                  <ShieldExclamationIcon className="h-4 w-4" />
                  <span className="hidden md:inline">Report</span>
                </button>
                <button
                  className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 hover:bg-amber-500/20"
                  onClick={handleBlockUser}
                  title="Block Stranger"
                >
                  <HandRaisedIcon className="h-4 w-4" />
                  <span className="hidden md:inline">Block</span>
                </button>
              </>
            )}

            <button
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-zinc-300 backdrop-blur-xl hover:bg-white/10"
              onClick={() => setShowStatusDetails((prev) => !prev)}
              title="Toggle device details"
              type="button"
            >
              <InformationCircleIcon className="h-4 w-4 text-emerald-300" />
              <span className="hidden md:inline">Devices</span>
            </button>
          </div>
        </nav>

        {/* Device Status Info Drawer (Collapsible) */}
        {showStatusDetails && (
          <motion.div
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassPanel className="rounded-2xl p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatusCard
                  description="Camera access for local video."
                  icon={cameraStatus === 'granted' ? CheckCircleIcon : VideoCameraIcon}
                  label="Camera"
                  tone={statusTone(cameraStatus)}
                  value={formatPermissionStatus(cameraStatus)}
                />
                <StatusCard
                  description="Microphone access for audio call."
                  icon={microphoneStatus === 'granted' ? CheckCircleIcon : MicrophoneIcon}
                  label="Microphone"
                  tone={statusTone(microphoneStatus)}
                  value={formatPermissionStatus(microphoneStatus)}
                />
                <StatusCard
                  description="WebRTC signaling status."
                  icon={connectionLabel === 'blocked' || connectionLabel === 'failed' ? ExclamationTriangleIcon : SignalIcon}
                  label="Signaling"
                  tone={statusTone(connectionLabel)}
                  value={formatPermissionStatus(connectionLabel)}
                />
              </div>
              {!canSearch && (
                <button
                  className="mt-3 w-full rounded-xl bg-white/10 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  disabled={isRequesting}
                  onClick={requestMedia}
                  type="button"
                >
                  {isRequesting ? 'Requesting Permissions...' : 'Grant Camera & Mic Access'}
                </button>
              )}
            </GlassPanel>
          </motion.div>
        )}

        {/* Error Alert Banner */}
        {(errorMessage || signalingErrorMessage) && (
          <div className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-3 text-xs leading-5 text-amber-100 sm:text-sm">
            {errorMessage || signalingErrorMessage}
          </div>
        )}

        {/* MAIN VIDEO WORKSPACE & RESPONSIVE GRID */}
        <div className="relative flex flex-1 flex-col gap-4 lg:flex-row">
          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 p-2 backdrop-blur-xl sm:p-4">
            <div
              className={`grid flex-1 gap-3 sm:gap-4 ${
                isChatOpen ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
              } min-h-[55vh] sm:min-h-[62vh] lg:min-h-[68vh]`}
            >
              {/* Local User Video */}
              <div className="relative flex flex-1 flex-col overflow-hidden">
                <VideoPreview
                  isAudioMuted={isAudioMuted}
                  isVideoMuted={isVideoMuted}
                  label="You (Local)"
                  muted={true}
                  stream={stream}
                />
              </div>

              {/* Stranger Remote Video */}
              <div className="relative flex flex-1 flex-col overflow-hidden">
                <VideoPreview
                  emptyDescription={
                    isSearching
                      ? 'Matching with a stranger based on your preferences...'
                      : 'Click "Find Match" or "Next Stranger" to start video matching.'
                  }
                  emptyTitle={isSearching ? 'Matchmaking in progress' : 'No active stranger connection'}
                  label={peerProfile ? `Stranger (${peerProfile.name}, ${peerProfile.country})` : 'Stranger (Remote)'}
                  muted={false}
                  stream={remoteStream}
                />
              </div>
            </div>

            {/* FLOATING ACTION CONTROL BAR */}
            <div className="sticky bottom-2 z-30 mt-4 flex items-center justify-center sm:bottom-4">
              <GlassPanel className="rounded-full border border-white/15 px-3 py-2 shadow-2xl backdrop-blur-2xl sm:px-6 sm:py-3">
                <ControlBar
                  isAudioMuted={isAudioMuted}
                  isChatOpen={isChatOpen}
                  isConnected={isConnected}
                  isSearching={isSearching}
                  isVideoMuted={isVideoMuted}
                  onLeave={handleLeave}
                  onSkip={handleSkip}
                  onToggleAudio={toggleAudio}
                  onToggleChat={() => setIsChatOpen((prev) => !prev)}
                  onToggleVideo={toggleVideo}
                  unreadCount={chatMessages.length}
                />
              </GlassPanel>
            </div>
          </div>

          {/* RESPONSIVE TEXT CHAT DRAWER */}
          {isChatOpen && (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="w-full lg:w-[380px] xl:w-[420px] shrink-0"
              initial={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <ChatPanel
                isConnected={isConnected}
                messages={chatMessages}
                onClose={() => setIsChatOpen(false)}
                onSendMessage={sendChatMessage}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* REPORT USER MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <GlassPanel className="w-full max-w-md p-6 rounded-3xl">
            <h3 className="text-xl font-bold text-red-400 mb-2">Report Stranger</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Select the reason for reporting this user. Violations will be reviewed by admin.
            </p>

            <form className="space-y-4 text-xs" onSubmit={handleReportUserSubmit}>
              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Reason</label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none"
                  onChange={(e) => setReportReason(e.target.value)}
                  value={reportReason}
                >
                  <option value="Nudity / Inappropriate Content">Nudity / Explicit Content</option>
                  <option value="Harassment / Hate Speech">Harassment / Hate Speech</option>
                  <option value="Spam / Bot">Spam / Bot</option>
                  <option value="Underage User">Underage User (&lt; 18)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Additional Details (Optional)</label>
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  value={reportDetails}
                />
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-xl bg-white/10 py-2.5 font-semibold text-white hover:bg-white/15"
                  onClick={() => setShowReportModal(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 rounded-xl bg-red-600 py-2.5 font-semibold text-white hover:bg-red-500"
                  type="submit"
                >
                  Submit & Skip
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </main>
  )
}
