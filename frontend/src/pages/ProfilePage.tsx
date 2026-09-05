import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  EnvelopeIcon,
  GlobeAltIcon,
  CakeIcon,
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline'

import { useSafeAuth } from '../contexts/AuthContext'
import { Header } from '../components/common/Header'
import { BannerAd } from '../components/ads/BannerAd'
import { getMyProfile, UserProfile } from '../services/api'

const DEFAULT_PROFILE: UserProfile = {
  clerk_id: 'default_user',
  email: 'shivam@example.com',
  name: 'Shivam',
  gender: 'Male',
  looking_for: 'Anyone',
  age: 21,
  country: 'India',
  city: 'Mumbai',
  languages: ['English', 'Hindi'],
  interests: ['Gaming', '3D', 'Tech', 'Music'],
  bio: 'Just a normal guy who loves meeting new people and having great conversations.',
  is_online: true,
  is_profile_completed: true,
  blocked_users: [],
  friends: [],
}

export function ProfilePage() {
  const { isLoaded, isSignedIn, user, getToken } = useSafeAuth()
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const token = (await getToken()) || 'mock-dev-token'
        if (isSignedIn) {
          const myProfile = await getMyProfile(token)
          if (!cancelled) setProfile(myProfile)
        }
      } catch (err) {
        console.warn('Profile fetch notice:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    if (isLoaded) {
      loadData()
    }

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, getToken])

  const clerkDisplayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.firstName ||
    user?.username ||
    ''

  const displayName = clerkDisplayName || profile.name || 'Shivam'
  const displayEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    profile.email ||
    'shivam@example.com'

  const userInitial = (displayName.charAt(0) || 'S').toUpperCase()
  const displayGender = profile.gender
    ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
    : 'Male'
  const displayAge = profile.age || 21
  const displayCountry = profile.country || 'India'
  const displayLanguages =
    profile.languages && profile.languages.length > 0
      ? profile.languages.join(', ')
      : 'English, Hindi'
  const displayInterests =
    profile.interests && profile.interests.length > 0
      ? profile.interests.join(', ')
      : 'Gaming, 3D, Tech, Music'
  const displayBio =
    profile.bio ||
    'Just a normal guy who loves meeting new people and having great conversations.'

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 flex flex-col">
      {/* Shared Clean Header */}
      <Header displayName={displayName} />

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl">
          {/* Profile Card (Screen 4) */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            {/* Top Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white shadow-sm overflow-hidden">
                  {profile.image ? (
                    <img src={profile.image} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{displayName}</h1>
                  <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
                    {displayGender} · {displayAge} · {displayCountry}
                  </p>
                </div>
              </div>

              <Link
                to="/profile/edit"
                className="self-start sm:self-center rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100/60 transition shadow-sm"
              >
                Edit Profile
              </Link>
            </div>

            {/* Information Rows */}
            <div className="pt-6 space-y-4 text-sm">
              {/* Email */}
              <div className="flex items-start gap-3 py-1">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="grid grid-cols-1 sm:grid-cols-3 w-full gap-1">
                  <span className="text-gray-500 font-medium">Email</span>
                  <span className="sm:col-span-2 text-gray-900">{displayEmail}</span>
                </div>
              </div>

              {/* Gender */}
              <div className="flex items-start gap-3 py-1">
                <IdentificationIcon className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="grid grid-cols-1 sm:grid-cols-3 w-full gap-1">
                  <span className="text-gray-500 font-medium">Gender</span>
                  <span className="sm:col-span-2 text-gray-900">{displayGender}</span>
                </div>
              </div>

              {/* Age */}
              <div className="flex items-start gap-3 py-1">
                <CakeIcon className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="grid grid-cols-1 sm:grid-cols-3 w-full gap-1">
                  <span className="text-gray-500 font-medium">Age</span>
                  <span className="sm:col-span-2 text-gray-900">{displayAge}</span>
                </div>
              </div>

              {/* Country */}
              <div className="flex items-start gap-3 py-1">
                <GlobeAltIcon className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="grid grid-cols-1 sm:grid-cols-3 w-full gap-1">
                  <span className="text-gray-500 font-medium">Country</span>
                  <span className="sm:col-span-2 text-gray-900">{displayCountry}</span>
                </div>
              </div>

              {/* Languages */}
              <div className="flex items-start gap-3 py-1">
                <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="grid grid-cols-1 sm:grid-cols-3 w-full gap-1">
                  <span className="text-gray-500 font-medium">Languages</span>
                  <span className="sm:col-span-2 text-gray-900">{displayLanguages}</span>
                </div>
              </div>

              {/* Interests */}
              <div className="flex items-start gap-3 py-1">
                <SparklesIcon className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="grid grid-cols-1 sm:grid-cols-3 w-full gap-1">
                  <span className="text-gray-500 font-medium">Interests</span>
                  <span className="sm:col-span-2 text-gray-900">{displayInterests}</span>
                </div>
              </div>

              {/* Bio */}
              <div className="flex items-start gap-3 py-1">
                <span className="text-gray-400 font-bold shrink-0 mt-0.5 text-base">@</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 w-full gap-1">
                  <span className="text-gray-500 font-medium">Bio</span>
                  <span className="sm:col-span-2 text-gray-700 leading-relaxed">{displayBio}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Banner Advertisement */}
          <BannerAd slotId="profile-page-bottom" />
        </div>
      </main>
    </div>
  )
}
