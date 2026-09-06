import React from 'react'

interface BannerAdProps {
  className?: string
  slotId?: string
}

export function BannerAd({ className = '', slotId = 'default-slot' }: BannerAdProps) {
  return (
    <div
      className={`mx-auto w-full max-w-[728px] my-6 ${className}`}
      data-ad-slot={slotId}
    >
      <div className="flex min-h-[90px] w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-[#f9fafb] p-3 text-center transition">
        <span className="text-[11px] font-medium tracking-wider text-gray-400 uppercase">
          Advertisement
        </span>
        <span className="mt-1 text-xs font-semibold text-gray-500">
          Your Ad Here (728 × 90)
        </span>
      </div>
    </div>
  )
}
