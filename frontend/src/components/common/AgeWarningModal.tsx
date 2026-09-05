import { useEffect, useRef, useState } from 'react'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

interface AgeWarningModalProps {
  isOpen: boolean
  onConfirm: () => void
}

export function AgeWarningModal({ isOpen, onConfirm }: AgeWarningModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false)
  const checkboxRef = useRef<HTMLInputElement>(null)

  // Prevent closing via Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen])

  // Focus the checkbox when the modal opens for accessibility
  useEffect(() => {
    if (isOpen) {
      checkboxRef.current?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleContinue = () => {
    if (!isConfirmed) return
    onConfirm()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-warning-title"
      aria-describedby="age-warning-description"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 18+ Badge */}
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
          <span className="text-base font-extrabold tracking-tight">18+</span>
        </div>

        <h2 id="age-warning-title" className="text-xl font-bold text-gray-900">
          18+ Only
        </h2>

        <div id="age-warning-description" className="mt-3 space-y-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-800">
            RandomConnect is intended for adults aged 18 and over.
          </p>
          <p>
            You must be 18 or older to use RandomConnect.
          </p>
          <p className="text-gray-500">
            Please use RandomConnect responsibly and follow our community safety guidelines.
          </p>
        </div>

        {/* Confirmation Checkbox */}
        <label
          htmlFor="age-confirmation-checkbox"
          className="mt-5 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3.5 text-left cursor-pointer hover:bg-gray-50 transition select-none"
        >
          <input
            id="age-confirmation-checkbox"
            ref={checkboxRef}
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="text-xs sm:text-sm font-medium text-gray-800">
            I confirm that I am 18 years old or older.
          </span>
        </label>

        {/* Continue Button */}
        <button
          type="button"
          disabled={!isConfirmed}
          onClick={handleContinue}
          className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Continue
        </button>

        <p className="mt-3 text-[11px] text-gray-400">
          This is an age confirmation gate. You must be at least 18 years old to proceed.
        </p>
      </div>
    </div>
  )
}
