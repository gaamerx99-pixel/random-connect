import { useEffect, useState, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline'

import { useSafeAuth } from '../contexts/AuthContext'
import { Header } from '../components/common/Header'
import { BannerAd } from '../components/ads/BannerAd'
import { getMyProfile, updateMyProfile, UserProfile } from '../services/api'

export function EditProfilePage() {
  const navigate = useNavigate()
  const { isLoaded, isSignedIn, user, getToken } = useSafeAuth()

  const [name, setName] = useState('Shivam')
  const [gender, setGender] = useState('male')
  const [age, setAge] = useState(21)
  const [country, setCountry] = useState('India')
  const [languages, setLanguages] = useState('English, Hindi')
  const [interests, setInterests] = useState('Gaming, 3D, Tech, Music')
  const [bio, setBio] = useState('Just a normal guy who loves meeting new people and having great conversations.')
  const [image, setImage] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Load existing profile
  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const token = (await getToken()) || 'mock-dev-token'
        if (isSignedIn) {
          const profile = await getMyProfile(token)
          if (!cancelled) {
            setName(profile.name || user?.fullName || 'Shivam')
            setGender(profile.gender || 'male')
            setAge(profile.age || 21)
            setCountry(profile.country || 'India')
            setLanguages(profile.languages?.join(', ') || 'English, Hindi')
            setInterests(profile.interests?.join(', ') || 'Gaming, 3D, Tech, Music')
            setBio(profile.bio || '')
            setImage(profile.image || '')
          }
        }
      } catch (err) {
        console.warn('Edit profile fetch notice:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    if (isLoaded) loadData()
    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, getToken, user])

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const token = (await getToken()) || 'mock-dev-token'
      const languagesArray = languages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean)
      const interestsArray = interests
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean)

      await updateMyProfile(token, {
        name,
        gender,
        age: Number(age) || 18,
        country,
        languages: languagesArray,
        interests: interestsArray,
        bio,
        image,
        is_profile_completed: true,
      })

      setSuccessMessage('Profile changes saved successfully!')
      setTimeout(() => {
        navigate('/profile')
      }, 1000)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  const userInitial = (name.charAt(0) || 'S').toUpperCase()

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 flex flex-col">
      <Header displayName={name} />

      <main className="flex-1 px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

            {successMessage && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                <CheckIcon className="h-4 w-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form Fields Column */}
                <div className="md:col-span-2 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      min={18}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Languages */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Languages</label>
                    <input
                      type="text"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                      placeholder="e.g. English, Hindi, Spanish"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Interests</label>
                    <input
                      type="text"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      placeholder="e.g. Gaming, Tech, Travel"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Bio</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell people a little about yourself..."
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Right Photo Column */}
                <div className="flex flex-col items-center justify-start pt-4 sm:pt-6">
                  <div className="relative mb-3 flex h-28 w-28 items-center justify-center rounded-2xl bg-indigo-600 text-3xl font-bold text-white shadow-sm overflow-hidden border-2 border-indigo-100">
                    {image ? (
                      <img src={image} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>

                  <label className="cursor-pointer rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100/60 transition shadow-sm">
                    <span>Change Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="mt-1.5 text-[11px] text-gray-400">JPG, PNG (Max 5MB)</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-sm inline-flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSaving && <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>

          <BannerAd slotId="edit-profile-bottom" />
        </div>
      </main>
    </div>
  )
}
