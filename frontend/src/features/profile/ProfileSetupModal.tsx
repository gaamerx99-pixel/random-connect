import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { updateMyProfile, UserProfile } from '../../services/api'

interface ProfileSetupModalProps {
  token: string
  initialProfile: UserProfile
  onSuccess: (updated: UserProfile) => void
}

export function ProfileSetupModal({ token, initialProfile, onSuccess }: ProfileSetupModalProps) {
  const [name, setName] = useState(initialProfile.name || '')
  const [gender, setGender] = useState(initialProfile.gender || 'male')
  const [lookingFor, setLookingFor] = useState(initialProfile.looking_for || 'female')
  const [age, setAge] = useState(initialProfile.age || 20)
  const [country, setCountry] = useState(initialProfile.country || 'India')
  const [languages, setLanguages] = useState(initialProfile.languages?.join(', ') || 'Hindi, English')
  const [interests, setInterests] = useState(initialProfile.interests?.join(', ') || 'Gaming, Music')
  const [bio, setBio] = useState(initialProfile.bio || '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await updateMyProfile(token, {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg overflow-hidden rounded-3xl"
        initial={{ opacity: 0, scale: 0.9 }}
      >
        <GlassPanel className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white mb-1">Complete Your Profile</h2>
          <p className="text-xs text-zinc-400 mb-6">
            Help us pair you with the best matched strangers based on your gender & preferences.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <form className="space-y-4 text-xs sm:text-sm" onSubmit={handleSubmit}>
            <div>
              <label className="block text-zinc-300 mb-1 font-medium">Display Name</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-indigo-500"
                onChange={(e) => setName(e.target.value)}
                required
                type="text"
                value={name}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Your Gender</label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  onChange={(e) => setGender(e.target.value)}
                  value={gender}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Match Preference</label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  onChange={(e) => setLookingFor(e.target.value)}
                  value={lookingFor}
                >
                  <option value="female">Female Only</option>
                  <option value="male">Male Only</option>
                  <option value="anyone">Anyone (Faster Match)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Age (18+)</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  min={18}
                  onChange={(e) => setAge(Number(e.target.value))}
                  required
                  type="number"
                  value={age}
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Country</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  type="text"
                  value={country}
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 mb-1 font-medium">Languages (comma separated)</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-indigo-500"
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="Hindi, English"
                type="text"
                value={languages}
              />
            </div>

            <div>
              <label className="block text-zinc-300 mb-1 font-medium">Interests (comma separated)</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-indigo-500"
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Gaming, Music, Movies"
                type="text"
                value={interests}
              />
            </div>

            <button
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
              disabled={saving}
              type="submit"
            >
              {saving ? 'Saving Profile...' : 'Save & Start Video Chat'}
            </button>
          </form>
        </GlassPanel>
      </motion.div>
    </div>
  )
}
