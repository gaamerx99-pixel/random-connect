import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import {
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  VideoCameraIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

import { GlassPanel } from '../components/ui/GlassPanel'
import { useSafeAuth } from '../contexts/AuthContext'
import { ProfileSetupModal } from '../features/profile/ProfileSetupModal'
import {
  getMyProfile,
  syncUserWithBackend,
  updateMyProfile,
  UserProfile,
} from '../services/api'

const DEFAULT_GUEST_PROFILE: UserProfile = {
  clerk_id: 'guest_user',
  email: 'guest@randomconnect.app',
  name: 'Rahul (Guest User)',
  gender: 'male',
  looking_for: 'female',
  age: 23,
  country: 'India',
  city: 'Delhi',
  languages: ['Hindi', 'English'],
  interests: ['Gaming', 'Music'],
  is_online: true,
  is_profile_completed: true,
  blocked_users: [],
  friends: [],
}

export function DashboardPage() {
  const navigate = useNavigate()

  const {
    isLoaded,
    isSignedIn,
    user,
    getToken,
    isClerkConfigured,
  } = useSafeAuth()

  const [profile, setProfile] = useState<UserProfile>(
    DEFAULT_GUEST_PROFILE,
  )

  const [showSetupModal, setShowSetupModal] = useState(false)
  const [token, setToken] = useState<string>('')

  /*
   * Get the name directly from Clerk.
   *
   * Priority:
   * 1. fullName
   * 2. firstName + lastName
   * 3. firstName
   * 4. username
   * 5. backend profile name
   * 6. Friend
   */
  const clerkDisplayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.firstName ||
    user?.username ||
    ''

  const displayName =
    clerkDisplayName ||
    (isSignedIn ? profile.name : 'Rahul (Guest User)') ||
    'Friend'

  const displayEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    profile.email ||
    'Not available'

  useEffect(() => {
    let cancelled = false

    async function loadUserData() {
      try {
        const authToken = (await getToken()) || 'mock-dev-token'

        if (cancelled) return

        setToken(authToken)

        if (isSignedIn) {
          /*
           * Sync the currently logged-in Clerk user with backend.
           */
          await syncUserWithBackend(authToken)

          if (cancelled) return

          /*
           * Load profile belonging to the current Clerk account.
           */
          const myProfile = await getMyProfile(authToken)

          if (cancelled) return

          setProfile(myProfile)

          if (!myProfile.is_profile_completed) {
            setShowSetupModal(true)
          }
        } else {
          /*
           * Guest/demo mode.
           */
          setProfile(DEFAULT_GUEST_PROFILE)
        }
      } catch (err) {
        console.warn(
          'Backend sync warning:',
          err,
        )

        /*
         * If backend fails but Clerk is logged in,
         * keep the Clerk identity instead of showing Rahul.
         */
        if (isSignedIn && user) {
          setProfile((previous) => ({
            ...previous,
            clerk_id: user.id,
            name: clerkDisplayName || previous.name,
            email: displayEmail,
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
  }, [
    isLoaded,
    isSignedIn,
    getToken,
    user?.id,
  ])

  const handleUpdateLookingFor = async (
    newPreference: string,
  ) => {
    setProfile((previous) => ({
      ...previous,
      looking_for: newPreference,
    }))

    if (isSignedIn && token) {
      try {
        const res = await updateMyProfile(
          token,
          {
            looking_for: newPreference,
          },
        )

        setProfile(res.user)
      } catch (err) {
        console.error(
          'Failed to update backend preference:',
          err,
        )
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#07080d] text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between border-b border-white/10 px-6 py-4 backdrop-blur-xl">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 font-bold text-white shadow-lg shadow-indigo-500/20">
            RC
          </div>

          <div>
            <h1 className="font-bold text-lg leading-tight">
              RandomConnect
            </h1>

            <p className="text-xs text-zinc-400">
              Match & Video Chat Dashboard
            </p>
          </div>

        </div>

        <div className="flex items-center gap-4">

          <button
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/20"
            onClick={() => navigate('/')}
          >
            Home
          </button>

          {isClerkConfigured && isSignedIn && (
            <UserButton afterSignOutUrl="/" />
          )}

        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Demo Mode Warning */}
        {!isClerkConfigured && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">

            <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-400" />

            <div>

              <p className="font-semibold">
                Development Demo Mode Active
              </p>

              <p className="text-[11px] text-amber-300/80">
                Clerk key is not set in `.env` yet.
                You are using the Guest Profile for instant
                video chat matching!
              </p>

            </div>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-black p-6 sm:p-8">

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

            <div>

              <span className="mb-2 inline-block rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
                Matchmaking Queue Ready
              </span>

              <h2 className="text-2xl font-bold sm:text-3xl">
                Welcome, {displayName}!
              </h2>

              <p className="mt-1 max-w-xl text-sm text-zinc-300">
                Choose your gender preference below and click
                start to pair with real online strangers.
              </p>

            </div>

            <button
              className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-4 font-bold text-white shadow-xl transition hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate('/waiting')}
            >

              <VideoCameraIcon className="h-6 w-6 animate-pulse" />

              <span>
                Start Video Match
              </span>

            </button>

          </div>
        </div>

        {/* User Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">

          <GlassPanel className="rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs text-zinc-400">
                  Total Video Matches
                </p>

                <h3 className="mt-1 text-2xl font-bold text-white">
                  0
                </h3>

              </div>

              <div className="rounded-xl bg-indigo-500/20 p-3 text-indigo-400">
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
              </div>

            </div>

          </GlassPanel>

          <GlassPanel className="rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs text-zinc-400">
                  Friends List
                </p>

                <h3 className="mt-1 text-2xl font-bold text-white">
                  {profile.friends?.length || 0}
                </h3>

              </div>

              <div className="rounded-xl bg-purple-500/20 p-3 text-purple-400">
                <UserGroupIcon className="h-6 w-6" />
              </div>

            </div>

          </GlassPanel>

          <GlassPanel className="rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs text-zinc-400">
                  Blocked Strangers
                </p>

                <h3 className="mt-1 text-2xl font-bold text-white">
                  {profile.blocked_users?.length || 0}
                </h3>

              </div>

              <div className="rounded-xl bg-amber-500/20 p-3 text-amber-400">
                <ShieldExclamationIcon className="h-6 w-6" />
              </div>

            </div>

          </GlassPanel>

        </div>

        {/* Profile & Match Settings */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* Matchmaking Preference */}
          <GlassPanel className="rounded-3xl p-6">

            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">

              <Cog6ToothIcon className="h-5 w-5 text-indigo-400" />

              Matchmaking Preference

            </h3>

            <div className="space-y-3">

              <label className="block text-xs font-semibold text-zinc-300">
                Looking For
              </label>

              <div className="grid grid-cols-3 gap-3">

                {[
                  {
                    id: 'female',
                    label: 'Female Only',
                  },
                  {
                    id: 'male',
                    label: 'Male Only',
                  },
                  {
                    id: 'anyone',
                    label: 'Anyone (Fastest)',
                  },
                ].map((item) => (

                  <button
                    key={item.id}
                    className={`rounded-xl border py-3 text-xs font-semibold transition ${
                      profile.looking_for === item.id
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                        : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                    }`}
                    onClick={() =>
                      handleUpdateLookingFor(item.id)
                    }
                  >
                    {item.label}
                  </button>

                ))}

              </div>

              <p className="mt-2 text-[11px] text-zinc-400">
                FastAPI WebSocket signaling engine uses your
                preference to match online strangers.
              </p>

            </div>

          </GlassPanel>

          {/* Profile Card */}
          <GlassPanel className="rounded-3xl p-6">

            <div className="mb-4 flex items-center justify-between">

              <h3 className="text-lg font-bold">
                Your Profile
              </h3>

              <button
                className="flex items-center gap-1 text-xs text-indigo-400 hover:underline"
                onClick={() =>
                  setShowSetupModal(true)
                }
              >

                <PencilSquareIcon className="h-3.5 w-3.5" />

                Edit Profile

              </button>

            </div>

            <div className="space-y-3 text-xs text-zinc-300">

              {/* Name */}
              <div className="flex justify-between border-b border-white/5 pb-2">

                <span className="text-zinc-400">
                  Name
                </span>

                <span className="font-semibold text-white">
                  {displayName}
                </span>

              </div>

              {/* Email */}
              <div className="flex justify-between border-b border-white/5 pb-2">

                <span className="text-zinc-400">
                  Email
                </span>

                <span className="max-w-[65%] truncate font-semibold text-white">
                  {displayEmail}
                </span>

              </div>

              {/* Gender */}
              <div className="flex justify-between border-b border-white/5 pb-2">

                <span className="text-zinc-400">
                  Gender
                </span>

                <span className="font-semibold capitalize text-white">
                  {profile.gender}
                </span>

              </div>

              {/* Age */}
              <div className="flex justify-between border-b border-white/5 pb-2">

                <span className="text-zinc-400">
                  Age
                </span>

                <span className="font-semibold text-white">
                  {profile.age}
                </span>

              </div>

              {/* Country */}
              <div className="flex justify-between border-b border-white/5 pb-2">

                <span className="text-zinc-400">
                  Country
                </span>

                <span className="font-semibold text-white">
                  {profile.country}
                </span>

              </div>

              {/* Languages */}
              <div className="flex justify-between border-b border-white/5 pb-2">

                <span className="text-zinc-400">
                  Languages
                </span>

                <span className="font-semibold text-white">
                  {profile.languages?.join(', ') || 'None'}
                </span>

              </div>

              {/* Interests */}
              <div className="flex justify-between">

                <span className="text-zinc-400">
                  Interests
                </span>

                <span className="font-semibold text-white">
                  {profile.interests?.join(', ') || 'None'}
                </span>

              </div>

            </div>

          </GlassPanel>

        </div>

      </main>

      {/* Onboarding Profile Modal */}
      {showSetupModal && (
        <ProfileSetupModal
          initialProfile={profile}
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