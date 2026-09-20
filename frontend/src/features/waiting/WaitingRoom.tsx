import { useEffect, useRef, useState, useCallback } from 'react'
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
  XMarkIcon,
  SparklesIcon,
  ArrowsPointingOutIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline'

import { useLocalMedia, VIDEO_FILTERS, VideoFilterPreset } from './useLocalMedia'
import { useWebRtcSignaling } from './useWebRtcSignaling'
import { ChatPanel } from './components/ChatPanel'
import { ControlBar } from './components/ControlBar'
import { VideoPreview } from './components/VideoPreview'
import { BannerAd } from '../../components/ads/BannerAd'
import {
  blockUser,
  reportUser,
  getMyProfile,
  getFemaleRewardState,
  completeFemaleRewardedAd,
  UserProfile,
  FemaleRewardState,
} from '../../services/api'
import { FemaleRewardModal } from '../../components/rewards/FemaleRewardModal'

const QUICK_REACTION_EMOJIS = ['❤️', '🔥', '😂', '👏', '🎉', '👋']

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
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false)
  const [showReactionsBar, setShowReactionsBar] = useState(false)
  const [showSafetyModal, setShowSafetyModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('Inappropriate Behavior')
  const [reportDetails, setReportDetails] = useState('')

  // Layout mode: PiP (Floating self preview) vs Split Screen
  const [isPipMode, setIsPipMode] = useState(true)
  const [isSwapped, setIsSwapped] = useState(false)
  const [pipSize, setPipSize] = useState<'sm' | 'md' | 'lg'>('md')

  const [callDuration, setCallDuration] = useState(0)
  const [snapshotNotice, setSnapshotNotice] = useState<string | null>(null)

  const {
    connectionStatus,
    isAudioMuted,
    isVideoMuted,
    isRequesting,
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
    facingMode,
    flipCamera,
    isFlippingCamera,
    videoFilter,
    setVideoFilter,
    videoFilterCss,
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
    rewardRequired,
    rewardRequiredMessage,
    reactions,
    sendReaction,
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

  // Capture in-call snapshot
  const handleCaptureSnapshot = useCallback(() => {
    try {
      const videoElements = document.querySelectorAll('video')
      if (!videoElements.length) return

      const canvas = document.createElement('canvas')
      canvas.width = 1280
      canvas.height = 720
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#10121d'
      ctx.fillRect(0, 0, 1280, 720)

      // Draw active remote stream or first visible video
      const activeVideo = Array.from(videoElements).find((v) => !v.muted && v.videoWidth > 0) || videoElements[0]
      if (activeVideo && activeVideo.videoWidth > 0) {
        ctx.drawImage(activeVideo, 0, 0, 1280, 720)
      }

      // Add watermark
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(20, 660, 320, 44)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText('RandomConnect HD Snapshot', 35, 688)

      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `RandomConnect_Call_${Date.now()}.png`
      a.click()

      setSnapshotNotice('Snapshot saved!')
      setTimeout(() => setSnapshotNotice(null), 2500)
    } catch (e) {
      console.warn('Snapshot capture notice:', e)
    }
  }, [])

  const displayName =
    clerkUser?.fullName ||
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
    userProfile?.name ||
    'You'

  const userInitial = (displayName.charAt(0) || 'Y').toUpperCase()

  const currentFilterObj = VIDEO_FILTERS.find((f) => f.id === videoFilter) || VIDEO_FILTERS[0]

  // PiP dimension sizing classes
  const pipSizeClasses =
    pipSize === 'sm'
      ? 'w-24 h-36 sm:w-32 sm:h-44'
      : pipSize === 'lg'
      ? 'w-44 h-64 sm:w-56 sm:h-76'
      : 'w-32 h-48 sm:w-44 sm:h-60'

  // Determine which stream is primary and which is in mini PiP window
  const primaryStream = isSwapped ? stream : remoteStream
  const primaryIsLocal = isSwapped
  const miniStream = isSwapped ? remoteStream : stream
  const miniIsLocal = !isSwapped

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full flex-col bg-[#0b0c16] text-white overflow-hidden select-none">
      {/* 1. Sleek Compact Header */}
      <header className="shrink-0 z-30 w-full border-b border-white/10 bg-[#121320]/95 backdrop-blur-md">
        <div className="mx-auto flex h-12 sm:h-14 max-w-7xl items-center justify-between px-2 sm:px-6 gap-1 sm:gap-3">
          {/* Left: Logo & Back Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-white font-bold group"
              title="RandomConnect Home"
            >
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition group-hover:bg-indigo-500">
                <VideoCameraIcon className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline text-sm sm:text-base tracking-tight">
                Random<span className="text-indigo-400">Connect</span>
              </span>
            </Link>

            <button
              onClick={handleLeave}
              className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-gray-200 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <ArrowLeftIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Leave</span>
            </button>
          </div>

          {/* Center: Live Status & Timer */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {/* Live Status Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-medium text-gray-200 backdrop-blur-sm truncate">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  isConnected
                    ? 'bg-emerald-400 animate-pulse'
                    : isSearching
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-gray-500'
                }`}
              />
              <span className="truncate">
                {isSearching
                  ? `Searching (${Math.max(0, timeoutLimit - searchSeconds)}s)`
                  : isConnected
                  ? 'Connected'
                  : 'Ready'}
              </span>
            </div>

            {/* Call Timer Pill */}
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-gray-200 font-mono shrink-0">
              <ClockIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
              <span>{formatTimer(callDuration)}</span>
            </div>

            {/* Connected Peer Details */}
            {isConnected && peerProfile && (
              <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-600/20 px-3 py-1 text-xs text-indigo-300 font-medium truncate">
                <span className="font-bold text-white truncate max-w-[120px]">{peerProfile.name}</span>
                <span className="truncate">• {peerProfile.country}</span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Safety Guidelines Modal Trigger */}
            <button
              onClick={() => setShowSafetyModal(true)}
              type="button"
              className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 p-1.5 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
              title="Safety Guidelines"
            >
              <ShieldCheckIcon className="h-4 w-4 text-indigo-400" />
              <span className="hidden md:inline">Safety</span>
            </button>

            {/* In-Call Moderation Controls */}
            {isConnected && (
              <div className="flex items-center gap-1 border-l border-white/10 pl-1">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/15 p-1.5 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-red-300 hover:bg-red-500/25 transition cursor-pointer"
                  title="Report user"
                >
                  <ShieldExclamationIcon className="h-4 w-4" />
                  <span className="hidden md:inline">Report</span>
                </button>
                <button
                  onClick={handleBlockUser}
                  className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 p-1.5 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-gray-300 hover:bg-red-500/20 hover:text-red-300 transition cursor-pointer"
                  title="Block user"
                >
                  <HandRaisedIcon className="h-4 w-4" />
                  <span className="hidden md:inline">Block</span>
                </button>
              </div>
            )}

            {/* Hardware Devices Selector Drawer Trigger */}
            <button
              onClick={() => setShowDevicesDrawer(!showDevicesDrawer)}
              className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 p-1.5 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-medium text-gray-300 hover:bg-white/10 transition cursor-pointer"
              title="Camera & Microphone settings"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 text-indigo-400" />
              <span className="hidden md:inline">Devices</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Devices Drawer (Collapsible) */}
      <AnimatePresence>
        {showDevicesDrawer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 z-25 border-b border-white/10 bg-[#141525] px-4 py-3 shadow-xl overflow-hidden"
          >
            <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Camera Input</label>
                  <select
                    value={selectedVideoDeviceId}
                    onChange={(e) => void selectVideoDevice(e.target.value)}
                    className="rounded-lg border border-white/15 bg-[#1e2035] px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
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
                  <label className="block text-gray-400 font-medium mb-1">Microphone Input</label>
                  <select
                    value={selectedAudioDeviceId}
                    onChange={(e) => void selectAudioDevice(e.target.value)}
                    className="rounded-lg border border-white/15 bg-[#1e2035] px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
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
                  className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/20 transition"
                >
                  {isRequesting ? 'Checking Devices...' : 'Re-check Devices'}
                </button>
                <button
                  onClick={() => setShowDevicesDrawer(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Video Filters Quality Drawer (Collapsible) */}
      <AnimatePresence>
        {showFiltersDrawer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 z-25 border-b border-indigo-500/20 bg-gradient-to-r from-[#141528] via-[#1a1c36] to-[#141528] px-4 py-3 shadow-xl overflow-hidden"
          >
            <div className="mx-auto max-w-4xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <SparklesIcon className="h-4 w-4 text-amber-300" />
                  <span>Camera Quality & Enhancement Filters</span>
                </div>
                <button
                  onClick={() => setShowFiltersDrawer(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {VIDEO_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setVideoFilter(f.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition cursor-pointer text-center ${
                      videoFilter === f.id
                        ? 'border-indigo-400 bg-indigo-600/30 text-white shadow-md ring-2 ring-indigo-500/40'
                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl mb-1">{f.icon}</span>
                    <span className="font-bold text-xs">{f.name}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{f.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snapshot Toast Notice */}
      <AnimatePresence>
        {snapshotNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xl flex items-center gap-2"
          >
            <span>📸</span>
            <span>{snapshotNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Main Video Stage (Responsive & Non-Overflowing) */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden">
        {/* Floating Animated In-Call Reactions */}
        <div className="pointer-events-none absolute inset-0 z-35 overflow-hidden">
          <AnimatePresence>
            {reactions.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 50, scale: 0.5, x: `${r.x}%` }}
                animate={{ opacity: 1, y: -280, scale: 1.4 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 2.2, ease: 'easeOut' }}
                className="absolute bottom-16 text-3xl sm:text-4xl select-none"
              >
                {r.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Quick Reactions Bar (When toggled open) */}
        <AnimatePresence>
          {showReactionsBar && isConnected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-20 z-40 flex items-center gap-2 rounded-2xl border border-white/20 bg-[#161729]/95 px-3 py-2 shadow-2xl backdrop-blur-lg"
            >
              {QUICK_REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    sendReaction(emoji)
                  }}
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/25 hover:scale-125 transition active:scale-95 text-xl cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
              <button
                onClick={() => setShowReactionsBar(false)}
                className="ml-1 p-1 text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* VIDEO DISPLAY MODES */}
        {/* ========================================================================= */}

        {isConnected && remoteStream && isPipMode ? (
          /* ======================================================================= */
          /* MODE A: PIP MODE (Floating / Resizable Self Screen with Tap-to-Swap) */
          /* ======================================================================= */
          <div className="relative h-full w-full max-w-5xl flex items-center justify-center overflow-hidden rounded-2xl">
            {/* Primary Fullscreen Video View */}
            <div className="h-full w-full">
              {primaryIsLocal ? (
                <VideoPreview
                  label={`You (${displayName})`}
                  userInitial={userInitial}
                  isAvatarMode={isAvatarVideoActive}
                  stream={stream}
                  isAudioMuted={isAudioMuted}
                  isVideoMuted={isVideoMuted}
                  muted={true}
                  filterCss={videoFilterCss}
                  filterName={currentFilterObj.name}
                  facingMode={facingMode}
                  isFlippingCamera={isFlippingCamera}
                  onFlipCamera={flipCamera}
                />
              ) : (
                <VideoPreview
                  label={peerProfile?.name || 'Stranger'}
                  userInitial={peerProfile?.name ? peerProfile.name.charAt(0).toUpperCase() : 'S'}
                  stream={remoteStream}
                  muted={false}
                />
              )}
            </div>

            {/* Corner Floating Mini-Window (PiP) */}
            <motion.div
              layout
              className={`absolute top-4 right-4 z-25 rounded-2xl shadow-2xl border-2 border-white/30 overflow-hidden backdrop-blur-md transition-all ${pipSizeClasses}`}
            >
              {miniIsLocal ? (
                <VideoPreview
                  label="You"
                  userInitial={userInitial}
                  isAvatarMode={isAvatarVideoActive}
                  stream={stream}
                  isAudioMuted={isAudioMuted}
                  isVideoMuted={isVideoMuted}
                  muted={true}
                  filterCss={videoFilterCss}
                  facingMode={facingMode}
                  isFlippingCamera={isFlippingCamera}
                  onFlipCamera={flipCamera}
                  isPip={true}
                  onClick={() => setIsSwapped(!isSwapped)}
                  onToggleExpand={() => setIsSwapped(!isSwapped)}
                />
              ) : (
                <VideoPreview
                  label={peerProfile?.name || 'Stranger'}
                  userInitial={peerProfile?.name ? peerProfile.name.charAt(0).toUpperCase() : 'S'}
                  stream={remoteStream}
                  muted={false}
                  isPip={true}
                  onClick={() => setIsSwapped(!isSwapped)}
                  onToggleExpand={() => setIsSwapped(!isSwapped)}
                />
              )}

              {/* Quick Swap Indicator Overlay on Mini Preview */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsSwapped(!isSwapped)
                }}
                className="absolute bottom-2 right-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white border border-white/20 shadow-md hover:bg-black transition active:scale-90 cursor-pointer"
                title="Tap to swap screens"
              >
                <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
              </button>

              {/* Mini Size Selector Pill */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-2 left-2 z-30 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-gray-300 backdrop-blur-xs border border-white/15"
              >
                <span
                  onClick={() => setPipSize('sm')}
                  className={`cursor-pointer hover:text-white ${pipSize === 'sm' ? 'text-indigo-400 font-extrabold' : ''}`}
                >
                  S
                </span>
                <span>•</span>
                <span
                  onClick={() => setPipSize('md')}
                  className={`cursor-pointer hover:text-white ${pipSize === 'md' ? 'text-indigo-400 font-extrabold' : ''}`}
                >
                  M
                </span>
                <span>•</span>
                <span
                  onClick={() => setPipSize('lg')}
                  className={`cursor-pointer hover:text-white ${pipSize === 'lg' ? 'text-indigo-400 font-extrabold' : ''}`}
                >
                  L
                </span>
              </div>
            </motion.div>
          </div>
        ) : (
          /* ======================================================================= */
          /* MODE B: SPLIT SCREEN / WAITING MODE (Side-by-side or Stacked grid) */
          /* ======================================================================= */
          <div className="grid h-full w-full max-w-5xl grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1 gap-2 sm:gap-4 items-stretch min-h-0 overflow-hidden">
            {/* Left Card: You */}
            <div className="h-full w-full min-h-0 overflow-hidden">
              <VideoPreview
                label={`You (${displayName})`}
                userInitial={userInitial}
                isAvatarMode={isAvatarVideoActive}
                stream={stream}
                isAudioMuted={isAudioMuted}
                isVideoMuted={isVideoMuted}
                muted={true}
                filterCss={videoFilterCss}
                filterName={currentFilterObj.name}
                facingMode={facingMode}
                isFlippingCamera={isFlippingCamera}
                onFlipCamera={flipCamera}
              />
            </div>

            {/* Right Card: Connected Stranger or Search Queue */}
            <div className="h-full w-full min-h-0 overflow-hidden">
              {isConnected && remoteStream ? (
                <VideoPreview
                  label={peerProfile?.name || 'Stranger'}
                  userInitial={peerProfile?.name ? peerProfile.name.charAt(0).toUpperCase() : 'S'}
                  stream={remoteStream}
                  muted={false}
                />
              ) : (
                <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#131522] to-[#0c0d17] shadow-md text-center p-6 text-white">
                  {/* Top Label */}
                  <div className="absolute left-3 top-3 z-10">
                    <span className="rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-gray-200 backdrop-blur-md border border-white/10">
                      Stranger
                    </span>
                  </div>

                  {/* Central Searching State */}
                  <div className="flex flex-col items-center justify-center max-w-xs">
                    <div className="relative mb-4 flex h-18 w-18 sm:h-22 sm:w-22 items-center justify-center rounded-full bg-white/5 text-gray-300 border border-white/15 shadow-inner">
                      <span className="text-3xl sm:text-4xl">👤</span>
                      {isSearching && (
                        <span className="absolute inset-0 rounded-full border-2 border-indigo-500 animate-ping opacity-40" />
                      )}
                    </div>

                    <p className="text-sm sm:text-base font-bold text-white">
                      {isSearching ? 'Looking for real users...' : 'Ready to connect'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {isSearching
                        ? 'Pairing with active strangers in queue...'
                        : 'Tap Next below to find a stranger.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 5. Bottom Fixed Control Bar Dock */}
      <footer className="shrink-0 z-30 w-full p-2 sm:pb-4 flex flex-col items-center">
        <div className="w-full max-w-xl">
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
            onFlipCamera={flipCamera}
            isFlippingCamera={isFlippingCamera}
            onToggleFilters={() => setShowFiltersDrawer(!showFiltersDrawer)}
            activeFilterName={currentFilterObj.name}
            onToggleReactions={() => setShowReactionsBar(!showReactionsBar)}
            onCaptureSnapshot={handleCaptureSnapshot}
            isPipMode={isPipMode}
            onToggleLayout={() => setIsPipMode(!isPipMode)}
          />
        </div>
      </footer>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#17182b] p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white">Report User</h3>
            <p className="mt-1 text-xs text-gray-400">
              Please tell us why you are reporting this user. Reports are reviewed by human moderators.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#1f213b] p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Inappropriate Behavior">Inappropriate Behavior</option>
                  <option value="Harassment or Hate Speech">Harassment or Hate Speech</option>
                  <option value="Spam or Advertising">Spam or Advertising</option>
                  <option value="Underage User">Underage User</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Details (optional)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-white/15 bg-[#1f213b] p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Describe what happened..."
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleReportUser}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Information Quick Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#17182b] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Safety & Guidelines</h3>
              </div>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-gray-300 leading-relaxed">
              <p className="font-semibold text-white">
                RandomConnect connects you with real people from around the world. Stay safe:
              </p>
              <ul className="space-y-1.5 list-disc pl-4 text-gray-300">
                <li>Never share personal contact info, passwords, credit card info, or address.</li>
                <li>Be respectful. Harassment, nudity, hate speech, and abuse are strictly prohibited.</li>
                <li>If someone makes you uncomfortable, tap Next to immediately skip, block, or report them.</li>
                <li>Never send money or crypto to strangers.</li>
              </ul>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <Link
                  to="/safety"
                  target="_blank"
                  className="font-semibold text-indigo-400 hover:underline"
                >
                  Full Safety Guide ↗
                </Link>
                <Link
                  to="/community-guidelines"
                  target="_blank"
                  className="text-gray-400 hover:underline"
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
