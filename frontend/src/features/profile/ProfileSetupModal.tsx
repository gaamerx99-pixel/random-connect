import { useState } from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { updateMyProfile, UserProfile } from '../../services/api'

interface ProfileSetupModalProps {
  token?: string | null
  initialProfile: UserProfile
  isOpen?: boolean
  onClose?: () => void
  onSuccess: (updated: UserProfile) => void
}

export function ProfileSetupModal({
  token,
  initialProfile,
  isOpen = true,
  onClose,
  onSuccess,
}: ProfileSetupModalProps) {
  const [name, setName] = useState(initialProfile.name || '')
  const [gender, setGender] = useState(initialProfile.gender || 'male')
  const [lookingFor, setLookingFor] = useState(initialProfile.looking_for || 'anyone')
  const [age, setAge] = useState(initialProfile.age || 21)
  const [country, setCountry] = useState(initialProfile.country || 'India')
  const [languages, setLanguages] = useState(initialProfile.languages?.join(', ') || 'Hindi, English')
  const [interests, setInterests] = useState(initialProfile.interests?.join(', ') || 'Gaming, Music')
  const [bio, setBio] = useState(initialProfile.bio || '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await updateMyProfile(token || 'mock-dev-token', {
        name,
        gender,
        looking_for: lookingFor,
        age: Number(age),
        country,
        languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
        interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
        bio,
      })
      onSuccess(res.user)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
        initial={{ opacity: 0, scale: 0.95 }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Complete Your Profile</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Set your basic profile to get matched with strangers worldwide.
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {error && (
          <div className="my-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <form className="mt-4 space-y-4 text-xs" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Display Name</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:bg-white"
              onChange={(e) => setName(e.target.value)}
              required
              type="text"
              value={name}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 mb-1 font-semibold">Your Gender</label>
              <select
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:bg-white"
                onChange={(e) => setGender(e.target.value)}
                value={gender}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-1 font-semibold">Match Preference</label>
              <select
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:bg-white"
                onChange={(e) => setLookingFor(e.target.value)}
                value={lookingFor}
              >
                <option value="anyone">Anyone (Faster Match)</option>
                <option value="female">Female Only</option>
                <option value="male">Male Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 mb-1 font-semibold">Age (18+)</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:bg-white"
                min={18}
                onChange={(e) => setAge(Number(e.target.value))}
                required
                type="number"
                value={age}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1 font-semibold">Country</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:bg-white"
                onChange={(e) => setCountry(e.target.value)}
                required
                type="text"
                value={country}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Languages (comma separated)</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:bg-white"
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Hindi"
              type="text"
              value={languages}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Interests (comma separated)</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:bg-white"
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Gaming, Music, Tech"
              type="text"
              value={interests}
            />
          </div>

          <button
            className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            disabled={saving}
            type="submit"
          >
            {saving ? 'Saving Profile...' : 'Save & Start Video Chat'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
