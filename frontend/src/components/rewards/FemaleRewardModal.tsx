import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  CheckCircleIcon,
  SparklesIcon,
  VideoCameraIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  UserGroupIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import type { FemaleRewardState } from '../../services/api'
import {
  getRewardedAdProvider,
  RewardedAdResult,
} from '../../services/ads/rewardedAdProvider'

interface FemaleRewardModalProps {
  isOpen: boolean
  onClose: () => void
  onStartMatch: () => void
  rewardState: FemaleRewardState | null
  onRewardVerified: (newState: FemaleRewardState) => void
  completeRewardApi: (
    provider?: string,
    rewardEventId?: string,
  ) => Promise<{ duplicate: boolean; reward_state: FemaleRewardState }>
  userId?: string
  title?: string
  subtitle?: string
  onSwitchToAnyone?: () => void
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

export function FemaleRewardModal({
  isOpen,
  onClose,
  onStartMatch,
  rewardState,
  onRewardVerified,
  completeRewardApi,
  userId,
  title,
  subtitle,
  onSwitchToAnyone,
}: FemaleRewardModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [hasCompletedInModal, setHasCompletedInModal] = useState(false)

  if (!isOpen) return null

  const effectiveRewardState = rewardState || DEFAULT_LOCKED_REWARD_STATE
  const femaleCredits = effectiveRewardState.female_match_credits || 0
  const isUnlocked = hasCompletedInModal || femaleCredits > 0

  const isTestMode = effectiveRewardState.test_mode
  const isProviderAvailable =
    isTestMode || effectiveRewardState.provider_configured

  const handleClose = () => {
    setHasCompletedInModal(false)
    setErrorMessage('')
    onClose()
  }

  const handleWatchAd = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')

      // 1. Obtain ad from provider abstraction
      const provider = getRewardedAdProvider(isTestMode)
      let adResult: RewardedAdResult

      try {
        adResult = await provider.showRewardedAd(userId)
      } catch (adErr: any) {
        throw new Error(
          adErr?.message ||
            'Rewarded ad is currently unavailable. Please try again.',
        )
      }

      // 2. Authoritative backend verification (1 ad unlocks 1 female connection)
      try {
        const verifyResponse = await completeRewardApi(
          adResult.provider,
          adResult.rewardEventId,
        )

        if (verifyResponse.duplicate) {
          setErrorMessage(
            'This ad reward was already recorded. Please watch a new ad.',
          )
        }

        onRewardVerified(verifyResponse.reward_state)
        setHasCompletedInModal(true)
      } catch (verifyErr: any) {
        if (isTestMode) {
          // Dev test mode fallback if backend DB is temporarily unreachable
          const simulatedState: FemaleRewardState = {
            ads_completed: 0,
            ads_required: 1,
            female_match_credits: 1,
            female_match_credits_max: 1,
            female_reward_unlocks: 1,
            female_match_credits_consumed: 0,
            test_mode: true,
            provider_configured: true,
          }
          onRewardVerified(simulatedState)
          setHasCompletedInModal(true)
        } else {
          throw verifyErr
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'Rewarded ad is currently unavailable. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={handleClose}
        />

        {/* Modal Window */}
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-xl text-center"
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Close Button */}
          <button
            aria-label="Close modal"
            className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            onClick={handleClose}
            type="button"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {isUnlocked ? (
            /* UNLOCKED STATE (Screen 8) */
            <div className="pt-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircleIcon className="h-8 w-8" />
              </div>

              <h2 className="text-xl font-bold text-gray-900">
                1 Female Connection Unlocked
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                You can now connect with 1 female user.
              </p>

              <button
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99]"
                onClick={() => {
                  handleClose()
                  onStartMatch()
                }}
                type="button"
              >
                <span>Start Video Match</span>
              </button>
            </div>
          ) : (
            /* LOCKED STATE (Screen 7) */
            <div className="pt-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-pink-500">
                <LockClosedIcon className="h-7 w-7" />
              </div>

              <h2 className="text-xl font-bold text-gray-900">
                {title || 'Female Matching Locked'}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {subtitle || 'Watch 1 rewarded ad to unlock 1 female connection.'}
              </p>

              {/* Status Badge */}
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                <VideoCameraIcon className="h-4 w-4 text-gray-400" />
                <span>0 female connections available</span>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-left text-xs text-red-600">
                  <ExclamationCircleIcon className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Test Mode Note */}
              {isTestMode && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-center text-[11px] font-medium text-amber-700">
                  ⚡ Test Mode: Instant reward simulation enabled
                </div>
              )}

              {/* Action Button */}
              {isProviderAvailable ? (
                <button
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60"
                  disabled={isLoading}
                  onClick={handleWatchAd}
                  type="button"
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      <span>Verifying Rewarded Ad...</span>
                    </>
                  ) : (
                    <span>Watch Rewarded Ad</span>
                  )}
                </button>
              ) : (
                <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-center text-xs text-gray-500">
                  Rewarded ad is currently unavailable. Please try again.
                </div>
              )}

              {/* Cancel Button */}
              <button
                className="mt-3 block w-full text-center text-xs font-medium text-gray-500 transition hover:text-gray-700"
                onClick={handleClose}
                type="button"
              >
                Cancel
              </button>

              {/* Option to switch to free Anyone filter */}
              {onSwitchToAnyone && (
                <button
                  className="mt-2 text-[11px] text-indigo-600 hover:text-indigo-800 transition"
                  onClick={() => {
                    handleClose()
                    onSwitchToAnyone()
                  }}
                  type="button"
                >
                  Or switch to Anyone (Free)
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
