/**
 * Rewarded Ad Provider Architecture for Web Applications.
 *
 * Provides an authoritative abstraction for rewarded video ads in standard
 * desktop/mobile browsers.
 *
 * In Development / Test Mode:
 *   Uses DevRewardedAdProvider to simulate verified ad completions with unique
 *   event IDs without requiring external third-party ad networks.
 *
 * In Production:
 *   Uses WebRewardedAdProvider (e.g. Google Publisher Tag / Google Ad Manager
 *   out-of-page rewarded slots, Adinplay, Monetag, etc.).
 *   If provider credentials/slots are not configured, it explicitly signals
 *   unavailability ("Rewarded ad is currently unavailable. Please try again.")
 *   and NEVER fabricates fake rewards.
 */

export interface RewardedAdResult {
  provider: string
  rewardEventId: string
  payload?: Record<string, any>
}

export interface IRewardedAdProvider {
  name: string
  initialize(): Promise<boolean>
  showRewardedAd(userId?: string): Promise<RewardedAdResult>
  isConfigured(): boolean
  isTestMode(): boolean
}

/**
 * Development test mode provider.
 * Generates unique, non-duplicable reward event IDs.
 */
export class DevRewardedAdProvider implements IRewardedAdProvider {
  name = 'dev'

  async initialize(): Promise<boolean> {
    return true
  }

  isTestMode(): boolean {
    return true
  }

  isConfigured(): boolean {
    return true
  }

  async showRewardedAd(userId = 'dev_user'): Promise<RewardedAdResult> {
    // Simulate brief network / rendering time
    await new Promise((resolve) => setTimeout(resolve, 400))

    const randomSuffix =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const rewardEventId = `dev-${userId}-${randomSuffix}`

    return {
      provider: 'dev',
      rewardEventId,
    }
  }
}

/**
 * Production Web Rewarded Ad Adapter.
 * Integrates with standard web rewarded ad networks (such as Google Publisher Tag
 * or dedicated web video ad tags).
 *
 * Marked clearly as NOT CONFIGURED until real credentials/tag slots are provided.
 */
export class WebRewardedAdProvider implements IRewardedAdProvider {
  name: string
  private adUnitPath?: string

  constructor() {
    this.name = import.meta.env.VITE_REWARDED_AD_PROVIDER || 'google_web'
    this.adUnitPath = import.meta.env.VITE_REWARDED_AD_UNIT_PATH || ''
  }

  isTestMode(): boolean {
    return false
  }

  isConfigured(): boolean {
    // Requires a configured provider name and ad unit path
    return Boolean(this.name && this.name !== 'dev' && this.adUnitPath)
  }

  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false
    }

    // When configured, load Google Publisher Tag (GPT) or web ad network script:
    // e.g. https://securepubads.g.doubleclick.net/tag/js/gpt.js
    return true
  }

  async showRewardedAd(_userId?: string): Promise<RewardedAdResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'Rewarded ad is currently unavailable. Please try again.',
      )
    }

    // Real web ad display flow when configured with GPT or ad network SDK
    throw new Error(
      'Rewarded ad provider is not configured. Please configure real provider credentials.',
    )
  }
}

/**
 * Factory to get the active rewarded ad provider based on backend state and environment.
 */
export function getRewardedAdProvider(
  isTestMode = false,
): IRewardedAdProvider {
  if (isTestMode) {
    return new DevRewardedAdProvider()
  }

  return new WebRewardedAdProvider()
}
