import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  HandRaisedIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

import { useLocalMedia } from './useLocalMedia'
import { useWebRtcSignaling } from './useWebRtcSignaling'
import { ChatPanel } from './components/ChatPanel'
import { ControlBar } from './components/ControlBar'
import { VideoPreview } from './components/VideoPreview'
import { BannerAd } from '../../components/ads/BannerAd'
import {
  blockUser,
  reportUser,
  getMyProfile,
  updateMyProfile,
  getFemaleRewardState,
  completeFemaleRewardedAd,
  UserProfile,
  FemaleRewardState,
} from '../../services/api'
import { FemaleRewardModal } from '../../components/rewards/FemaleRewardModal'

export function WaitingRoom() {
  const navigate = useNavigate()
  const location = useLocation()
  const hasAutoStartedRef = useRef(false)
  const { getToken } = useAuth()
  const { user: clerkUser } = useUser()

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [femaleRewardState, setFemaleRewardState] = useState<FemaleRewardState | null>(null)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [rewardModalTitle, setRewardModalTitle] = useState<string | undefined>(undefined)
  const [rewardModalSubtitle, setRewardModalSubtitle] = useState<string | undefined>(undefined)

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showDevicesDrawer, setShowDevicesDrawer] = useState(false)
  const [showSafetyModal, setShowSafetyModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('Inappropriate Behavior')
  const [reportDetails, setReportDetails] = useState('')

  const [callDuration, setCallDuration] = useState(0)

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
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    selectVideoDevice,
    selectAudioDevice,
    isAvatarVideoActive,
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
    searchSeconds,
    timeoutLimit,
    isTimedOut,
    startTestMatch,
    isTestMode,
    rewardRequired,
    rewardRequiredMessage,
    clearRewardRequired,
  } = useWebRtcSignaling(stream)

  // Fetch profile and reward state on load
  useEffect(() => {
    let isMounted = true
    const loadProfile = async () => {
      const token = (await getToken()) || null
      if (!token) return
      try {
        const profile = await getMyProfile(token)
        if (isMounted) setUserProfile(profile)
        if (profile.gender?.toLowerCase() === 'male' && profile.looking_for === 'female') {
          const reward = await getFemaleRewardState(token)
          if (isMounted) setFemaleRewardState(reward)
        }
      } catch (err) {
        console.warn('Failed to load profile in WaitingRoom:', err)
      }
    }
    loadProfile()
    return () => {
      isMounted = false
    }
  }, [getToken])

  // Auto-start match when navigated from Dashboard with autoStart: true
  useEffect(() => {
    if (
      location.state?.autoStart &&
      connectionStatus === 'ready' &&
      signalingStatus === 'idle' &&
      !isSearching &&
      !hasAutoStartedRef.current
    ) {
      hasAutoStartedRef.current = true
      findStranger()
    }
  }, [location.state, connectionStatus, signalingStatus, isSearching, findStranger])

  // Track active call session
  const isConnected = signalingStatus === 'connected' || signalingStatus === 'matched'

  // Call duration counter
  useEffect(() => {
    let timer: any = null
    if (isConnected) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isConnected])

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Backend reward-required pop-up (if emitted by backend signaling)
  useEffect(() => {
    if (rewardRequired) {
      setRewardModalTitle('Female Matching Locked')
      setRewardModalSubtitle(
        rewardRequiredMessage || 'Watch 1 rewarded ad to unlock 1 female connection.',
      )
      setShowRewardModal(true)
    }
  }, [rewardRequired, rewardRequiredMessage])

  // Next Stranger / Skip action
  const handleSkip = async () => {
    const isMaleLookingForFemale =
      userProfile?.gender?.toLowerCase() === 'male' &&
      userProfile?.looking_for === 'female'

    if (isMaleLookingForFemale) {
      const token = (await getToken()) || null
      let credits = femaleRewardState?.female_match_credits || 0
      if (token) {
        try {
          const freshState = await getFemaleRewardState(token)
          setFemaleRewardState(freshState)
          credits = freshState.female_match_credits || 0
        } catch (err) {
          console.warn('Failed to refresh reward state on skip:', err)
        }
      }

      if (credits <= 0) {
        setRewardModalTitle('Female Matching Locked')
        setRewardModalSubtitle('Watch 1 rewarded ad to unlock 1 female connection.')
        setShowRewardModal(true)
        return
      }
    }

    if (isTestMode) {
      startTestMatch()
      return
    }

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
      skipStranger()
    } catch (err) {
      console.error('Failed to block user:', err)
    }
  }

  const handleReportUser = async () => {
    if (!peerProfile?.clerk_id) return
    try {
      const token = (await getToken()) || 'mock-dev-token'
      await reportUser(token, peerProfile.clerk_id, reportReason, reportDetails)
      setShowReportModal(false)
      setReportDetails('')
      skipStranger()
    } catch (err) {
      console.error('Failed to report user:', err)
    }
  }

  const displayName =
    clerkUser?.fullName ||
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
    userProfile?.name ||
    'Shivam'

  const userInitial = (displayName.charAt(0) || 'S').toUpperCase()

  return (
    <div className="flex min-h-screen flex-col bg-[#fafbfc] text-gray-900">
      {/* 1. Clean Header (Screen 3) */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6">
          {/* Left: Logo & Back Button */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-900 font-bold group cursor-pointer"
              aria-label="RandomConnect Home"
              title="RandomConnect Home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition group-hover:bg-indigo-700">
                <VideoCameraIcon className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline text-base">
                Random<span className="text-indigo-600">Connect</span>
              </span>
            </Link>

            <button
              onClick={handleLeave}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm cursor-pointer"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>
          </div>

          {/* Center: Connection Status & Timer */}
          <div className="flex items-center gap-2.5">
            {/* Status Pill */}
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected
                    ? 'bg-emerald-500 animate-pulse'
                    : isSearching
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-gray-400'
                }`}
              />
              <span>
                {isTestMode
                  ? 'Connected (Bot)'
                  : isSearching
                  ? `Searching (${Math.max(0, timeoutLimit - searchSeconds)}s)`
                  : isConnected
                  ? 'Connected'
                  : 'Ready'}
              </span>
            </div>

            {/* Test Mode Badge */}
            {isTestMode && (
              <span className="hidden sm:inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                ⚡ Test Bot
              </span>
            )}

            {/* Call Timer Pill */}
            <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 font-mono">
              <ClockIcon className="h-3.5 w-3.5 text-gray-400" />
              <span>{formatTimer(callDuration)}</span>
            </div>

            {/* Connected Peer Details Pill */}
            {isConnected && peerProfile && (
              <div className="hidden lg:flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs text-indigo-900 font-medium">
                <span className="font-bold">{peerProfile.name}</span>
                <span>• {peerProfile.country}</span>
              </div>
            )}
          </div>

          {/* Right: Actions (Test With Bot, Safety, Report/Block & Devices) */}
          <div className="flex items-center gap-2">
            {/* Safety Information Quick Access (always visible) */}
            <button
              onClick={() => setShowSafetyModal(true)}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition shadow-xs cursor-pointer"
              title="View Safety Tips & Guidelines"
              aria-label="Safety tips and guidelines"
            >
              <ShieldCheckIcon className="h-4 w-4 text-indigo-600" />
              <span className="hidden sm:inline">Safety</span>
            </button>

            {/* Test With Bot secondary testing button */}
            <button
              onClick={startTestMatch}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition shadow-sm cursor-pointer"
              title="Connect with a simulated test bot stranger"
            >
              <span aria-hidden="true">🤖</span>
              <span>Test With Bot</span>
            </button>

            {isConnected && (
              <div className="flex items-center gap-1.5 border-l border-gray-200 pl-2">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition shadow-xs cursor-pointer"
                  title="Report user"
                  aria-label="Report user"
                >
                  <ShieldExclamationIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Report</span>
                </button>
                <button
                  onClick={handleBlockUser}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-red-600 transition shadow-xs cursor-pointer"
                  title="Block user"
                  aria-label="Block user"
                >
                  <HandRaisedIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Block</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setShowDevicesDrawer(!showDevicesDrawer)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm cursor-pointer"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 text-indigo-600" />
              <span className="hidden sm:inline">Devices</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Devices Configuration Drawer (Collapsible) */}
      {showDevicesDrawer && (
        <div className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm">
          <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-gray-500 font-medium mb-1">Camera Device</label>
                <select
                  value={selectedVideoDeviceId}
                  onChange={(e) => void selectVideoDevice(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-800 focus:border-indigo-600 focus:outline-none"
                >
                  {videoDevices.length > 0 ? (
                    videoDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))
                  ) : (
                    <option value="">No physical camera (Avatar Mode active)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-gray-500 font-medium mb-1">Microphone Device</label>
                <select
                  value={selectedAudioDeviceId}
                  onChange={(e) => void selectAudioDevice(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-800 focus:border-indigo-600 focus:outline-none"
                >
                  {audioDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Microphone ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={requestMedia}
                disabled={isRequesting}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
              >
                {isRequesting ? 'Checking Devices...' : 'Re-check Devices'}
              </button>
              <button
                onClick={() => setShowDevicesDrawer(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Small Banner Advertisement (Placed neatly ABOVE the video area as requested) */}
      <div className="px-4 py-2">
        <BannerAd slotId="waiting-top-banner" className="my-2 max-w-4xl" />
      </div>

      {/* 4. Main Video Area (Screen 3) */}
      <main className="flex-1 flex flex-col justify-center px-4 pb-4">
        <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Left Panel: You (Shivam) */}
          <VideoPreview
            label={`You (${displayName})`}
            userInitial={userInitial}
            isAvatarMode={isAvatarVideoActive}
            stream={stream}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            muted={true}
          />

          {/* Right Panel: Stranger */}
          {isConnected && remoteStream ? (
            <VideoPreview
              label={peerProfile?.name ? `${peerProfile.name}${isTestMode ? ' [BOT]' : ''}` : isTestMode ? 'Stranger [BOT]' : 'Stranger'}
              userInitial={peerProfile?.name ? peerProfile.name.charAt(0).toUpperCase() : 'S'}
              stream={remoteStream}
              muted={false}
            />
          ) : (
            <div className="relative flex h-full min-h-[300px] sm:min-h-[380px] w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-gray-800 bg-[#141520] shadow-sm text-center p-6 text-white">
              {/* Top Label */}
              <div className="absolute left-4 top-4 z-10">
                <span className="rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm border border-white/10">
                  Stranger
                </span>
              </div>

              {/* Central Searching State */}
              <div className="flex flex-col items-center justify-center max-w-xs">
                <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-800/80 text-gray-400 border border-gray-700">
                  <span className="text-3xl font-light">👤</span>
                  {isSearching && (
                    <span className="absolute inset-0 rounded-full border-2 border-indigo-500 animate-ping opacity-30" />
                  )}
                </div>

                <p className="text-sm font-bold text-gray-100">
                  {isSearching ? 'Looking for someone new...' : 'Waiting to connect'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {isSearching
                    ? 'Connecting to online users in the queue...'
                    : 'Click Next Stranger below to begin video matching.'}
                </p>

                {/* Instant Bot Test Button for developer convenience */}
                {!isSearching && (
                  <button
                    onClick={startTestMatch}
                    className="mt-4 rounded-lg bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/15 transition"
                  >
                    🤖 Test With Bot
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 5. Bottom Controls Dock (Screen 3) */}
        <div className="mt-4 mx-auto w-full max-w-xl">
          <ControlBar
            isAudioMuted={isAudioMuted}
            isChatOpen={isChatOpen}
            isConnected={isConnected}
            isSearching={isSearching}
            isVideoMuted={isVideoMuted}
            onLeave={handleLeave}
            onSkip={handleSkip}
            onToggleAudio={toggleAudio}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            onToggleVideo={toggleVideo}
            unreadCount={0}
          />
        </div>
      </main>

      {/* Slide-out Chat Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        messages={chatMessages}
        onClose={() => setIsChatOpen(false)}
        onSendMessage={sendChatMessage}
        peerName={peerProfile?.name || 'Stranger'}
      />

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Report User</h3>
            <p className="mt-1 text-xs text-gray-500">
              Please tell us why you are reporting this user. Reports are reviewed by moderators.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs text-gray-800"
                >
                  <option value="Inappropriate Behavior">Inappropriate Behavior</option>
                  <option value="Harassment or Hate Speech">Harassment or Hate Speech</option>
                  <option value="Spam or Advertising">Spam or Advertising</option>
                  <option value="Underage User">Underage User</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Details (optional)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs text-gray-800"
                  placeholder="Describe what happened..."
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReportUser}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Information Quick Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Safety & Guidelines</h3>
              </div>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-800">
                RandomConnect connects you with people you may not know. Stay cautious and protect yourself:
              </p>
              <ul className="space-y-1.5 list-disc pl-4 text-gray-600">
                <li>Never share passwords, credit card info, bank details, or home address.</li>
                <li>Be respectful. Harassment, nudity, hate speech, and abuse are strictly prohibited.</li>
                <li>If someone makes you uncomfortable, end the call, block them, and report them.</li>
                <li>Never send money, gift cards, or cryptocurrency to strangers.</li>
              </ul>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <Link
                  to="/safety"
                  target="_blank"
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Full Safety Guide ↗
                </Link>
                <Link
                  to="/community-guidelines"
                  target="_blank"
                  className="text-gray-500 hover:underline"
                >
                  Guidelines ↗
                </Link>
              </div>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Female Rewarded Ad Modal */}
      <FemaleRewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        onStartMatch={() => {
          setShowRewardModal(false)
          findStranger()
        }}
        rewardState={femaleRewardState}
        onRewardVerified={(newState) => setFemaleRewardState(newState)}
        completeRewardApi={async (provider, rewardEventId) => {
          const token = (await getToken()) || 'mock-dev-token'
          return completeFemaleRewardedAd(token, provider, rewardEventId)
        }}
        userId={clerkUser?.id}
        title={rewardModalTitle}
        subtitle={rewardModalSubtitle}
      />
    </div>
  )
}
