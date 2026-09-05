import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  VideoCameraIcon,
  UserGroupIcon,
  NoSymbolIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

import { useSafeAuth } from '../contexts/AuthContext'
import { Header } from '../components/common/Header'
import { BannerAd } from '../components/ads/BannerAd'
import { FemaleRewardModal } from '../components/rewards/FemaleRewardModal'
import { ProfileSetupModal } from '../features/profile/ProfileSetupModal'
import {
  getMyProfile,
  updateMyProfile,
  getFemaleRewardState,
  completeFemaleRewardedAd,
  syncUserWithBackend,
  UserProfile,
  FemaleRewardState,
} from '../services/api'

const DEFAULT_GUEST_PROFILE: UserProfile = {
  clerk_id: 'guest_user',
  email: 'guest@randomconnect.app',
  name: 'Rahul (Guest User)',
  gender: 'male',
  looking_for: 'anyone',
  age: 21,
  country: 'India',
  city: 'Mumbai',
  languages: ['English', 'Hindi'],
  interests: ['Tech', 'Gaming', 'Music'],
  bio: 'Friendly conversationalist looking to meet interesting people from around the world.',
  is_online: true,
  is_profile_completed: true,
  blocked_users: [],
  friends: [],
}

const DEFAULT_LOCKED_REWARD_STATE: FemaleRewardState = {
  ads_completed: 0,
  ads_required: 1,
  female_match_credits: 0,
  female_match_credits_max: 1,
  female_reward_unlocks: 0,
  female_match_credits_consumed: 0,
  test_mode: true,
  provider_configured: true,
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { isLoaded, isSignedIn, user, getToken } = useSafeAuth()

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_GUEST_PROFILE)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [token, setToken] = useState('')
  const [femaleRewardState, setFemaleRewardState] = useState<FemaleRewardState>(DEFAULT_LOCKED_REWARD_STATE)
  const [rewardLoading, setRewardLoading] = useState(false)
  const [rewardError, setRewardError] = useState('')
  const [showRewardModal, setShowRewardModal] = useState(false)

  const clerkDisplayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.firstName ||
    user?.username ||
    ''

  const displayName = clerkDisplayName || (isSignedIn ? profile.name : 'Shivam') || 'Shivam'

  // Load user data & reward state
  useEffect(() => {
    let cancelled = false

    async function loadUserData() {
      try {
        const authToken = (await getToken()) || 'mock-dev-token'
        if (cancelled) return
        setToken(authToken)

        if (isSignedIn) {
          await syncUserWithBackend(authToken)
          if (cancelled) return

          const myProfile = await getMyProfile(authToken)
          if (cancelled) return
          setProfile(myProfile)

          try {
            const reward = await getFemaleRewardState(authToken)
            if (!cancelled) setFemaleRewardState(reward)
          } catch (rewardErr) {
            console.warn('Female reward state check notice:', rewardErr)
          }

          if (!myProfile.is_profile_completed) {
            setShowSetupModal(true)
          }
        } else {
          setProfile(DEFAULT_GUEST_PROFILE)
          try {
            const reward = await getFemaleRewardState(authToken)
            if (!cancelled) setFemaleRewardState(reward)
          } catch (rewardErr) {
            console.warn('Guest reward state notice:', rewardErr)
          }
        }
      } catch (err) {
        console.warn('Backend sync notice:', err)
        if (isSignedIn && user) {
          setProfile((prev) => ({
            ...prev,
            clerk_id: user.id,
            name: clerkDisplayName || prev.name,
          }))
        }
      }
    }

    if (isLoaded) {
      loadUserData()
    }

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, getToken, user?.id])

  // Update Looking For preference (Female Only, Male Only, Anyone)
  const handleUpdateLookingFor = async (newPreference: string) => {
    setProfile((prev) => ({
      ...prev,
      looking_for: newPreference,
    }))

    const effectiveToken = token || 'mock-dev-token'
    if (isSignedIn && token) {
      try {
        const response = await updateMyProfile(token, { looking_for: newPreference })
        setProfile(response.user)
      } catch (err) {
        console.error('Failed to update preference:', err)
      }
    }

    if (newPreference === 'female') {
      try {
        const state = await getFemaleRewardState(effectiveToken)
        setFemaleRewardState(state)
      } catch (err) {
        console.warn('Failed to refresh female reward state:', err)
      }
    }
  }

  // Rewarded ad completion
  const handleCompleteRewardedAd = async (provider?: string, rewardEventId?: string) => {
    const effectiveToken = token || 'mock-dev-token'
    try {
      setRewardLoading(true)
      setRewardError('')
      const response = await completeFemaleRewardedAd(
        effectiveToken,
        femaleRewardState?.test_mode ? 'dev' : provider,
        rewardEventId,
      )
      setFemaleRewardState(response.reward_state)
      return response
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Rewarded ad verification failed.'
      setRewardError(msg)
      throw err
    } finally {
      setRewardLoading(false)
    }
  }

  // Start Video Match button click flow
  const handleStartVideoMatch = async () => {
    const lookingFor = (profile?.looking_for || '').trim().toLowerCase()

    // 1. Anyone or Male matching: direct navigation
    if (lookingFor !== 'female') {
      navigate('/waiting', { state: { autoStart: true } })
      return
    }

    // 2. Female users: exempt from ad requirement
    const gender = (profile?.gender || '').trim().toLowerCase()
    if (gender !== 'male') {
      navigate('/waiting', { state: { autoStart: true } })
      return
    }

    // 3. Male user looking for female: check credits
    let currentCredits = femaleRewardState.female_match_credits || 0
    const effectiveToken = token || 'mock-dev-token'

    try {
      setRewardLoading(true)
      setRewardError('')
      const freshState = await getFemaleRewardState(effectiveToken)
      setFemaleRewardState(freshState)
      currentCredits = freshState.female_match_credits || 0
    } catch (err) {
      console.warn('Using local credit state:', err)
    } finally {
      setRewardLoading(false)
    }

    if (currentCredits > 0) {
      navigate('/waiting', { state: { autoStart: true } })
      return
    }

    // Male user + Female Only + 0 credits: open reward modal
    setShowRewardModal(true)
  }

  const selectedMode = (profile?.looking_for || 'anyone').toLowerCase()
  const femaleCredits = femaleRewardState?.female_match_credits || 0
  const userInitial = (displayName.charAt(0) || 'S').toUpperCase()

  const statsMatches = 12
  const statsFriends = profile.friends?.length ? profile.friends.length : 5
  const statsBlocked = profile.blocked_users?.length ? profile.blocked_users.length : 3

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 flex flex-col">
      {/* Shared Clean Header */}
      <Header displayName={displayName} />

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl">
          {/* Welcome Heading */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Welcome back, {displayName}!
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Choose who you'd like to meet and start a conversation.
            </p>
          </div>

          {/* Section: Who do you want to meet? */}
          <div className="mb-6">
            <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              Who do you want to meet?
            </span>

            {/* 3 Selectable Options */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Option 1: Female Only */}
              <button
                type="button"
                onClick={() => handleUpdateLookingFor('female')}
                className={`flex flex-col items-center justify-center rounded-xl p-5 text-center transition cursor-pointer border ${
                  selectedMode === 'female'
                    ? 'border-2 border-indigo-600 bg-indigo-50/30 text-indigo-900 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-pink-500 mb-2">
                  <span className="text-xl font-bold">♀</span>
                </div>
                <span className="font-semibold text-sm">Female Only</span>
                <span className="mt-1.5 inline-block rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-100">
                  {femaleCredits > 0 ? `${femaleCredits} credit available` : '1 credit available'}
                </span>
              </button>

              {/* Option 2: Male Only */}
              <button
                type="button"
                onClick={() => handleUpdateLookingFor('male')}
                className={`flex flex-col items-center justify-center rounded-xl p-5 text-center transition cursor-pointer border ${
                  selectedMode === 'male'
                    ? 'border-2 border-indigo-600 bg-indigo-50/30 text-indigo-900 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500 mb-2">
                  <span className="text-xl font-bold">♂</span>
                </div>
                <span className="font-semibold text-sm">Male Only</span>
                <span className="mt-1.5 text-[11px] text-gray-400">Free matching</span>
              </button>

              {/* Option 3: Anyone */}
              <button
                type="button"
                onClick={() => handleUpdateLookingFor('anyone')}
                className={`flex flex-col items-center justify-center rounded-xl p-5 text-center transition cursor-pointer border ${
                  selectedMode === 'anyone'
                    ? 'border-2 border-indigo-600 bg-indigo-50/30 text-indigo-900 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 mb-2">
                  <UserGroupIcon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-sm">Anyone</span>
                <span className="mt-1.5 text-[11px] text-gray-400">Fastest queue</span>
              </button>
            </div>

            {/* Most Visually Prominent Primary Action Button */}
            <button
              onClick={handleStartVideoMatch}
              disabled={rewardLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 px-6 text-base font-bold text-white shadow-sm hover:bg-indigo-700 transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <span>Start Video Match</span>
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid grid-cols-3 gap-3.5">
            {/* Stat 1: Video Matches */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <VideoCameraIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-gray-900">{statsMatches}</p>
                <p className="text-[11px] text-gray-500 font-medium">Video Matches</p>
              </div>
            </div>

            {/* Stat 2: Friends */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <UserGroupIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-gray-900">{statsFriends}</p>
                <p className="text-[11px] text-gray-500 font-medium">Friends</p>
              </div>
            </div>

            {/* Stat 3: Blocked */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <NoSymbolIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-gray-900">{statsBlocked}</p>
                <p className="text-[11px] text-gray-500 font-medium">Blocked</p>
              </div>
            </div>
          </div>

          {/* Compact Profile Summary Card */}
          <div className="mb-8">
            <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              Your Profile
            </span>
            <div className="mt-2 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white shadow-sm overflow-hidden">
                  {profile.image ? (
                    <img src={profile.image} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{displayName}</h3>
                  <p className="text-xs text-gray-500">
                    {profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Male'} · {profile.age || 21} · {profile.country || 'India'}
                  </p>
                </div>
              </div>

              <Link
                to="/profile/edit"
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Banner Advertisement */}
          <BannerAd slotId="dashboard-page-bottom" />
        </div>
      </main>

      {/* Female Rewarded Ad Modal */}
      <FemaleRewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        onStartMatch={() => {
          setShowRewardModal(false)
          navigate('/waiting', { state: { autoStart: true } })
        }}
        rewardState={femaleRewardState}
        onRewardVerified={(newState) => setFemaleRewardState(newState)}
        completeRewardApi={handleCompleteRewardedAd}
        userId={user?.id}
        onSwitchToAnyone={() => handleUpdateLookingFor('anyone')}
      />

      {/* Profile Setup Modal for first-time users */}
      {showSetupModal && (
        <ProfileSetupModal
          initialProfile={profile}
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onSuccess={(updated) => {
            setProfile(updated)
            setShowSetupModal(false)
          }}
          token={token}
        />
      )}
    </div>
  )
}
