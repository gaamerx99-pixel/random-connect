const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || '/api/v1'

export interface UserProfile {
  clerk_id: string
  email: string
  name: string
  gender: string
  looking_for: string
  age: number
  country: string
  city?: string
  languages: string[]
  interests: string[]
  image?: string
  bio?: string
  is_online: boolean
  is_profile_completed: boolean
  blocked_users: string[]
  friends: string[]
}

export interface FemaleRewardState {
  ads_completed: number
  ads_required: number
  female_match_credits: number
  female_match_credits_max: number
  female_reward_unlocks: number
  female_match_credits_consumed: number
  test_mode: boolean
  provider_configured: boolean
}

export async function fetchWithAuth(url: string, token?: string | null, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'API Error' }))
    throw new Error(errorData.detail || `Request failed with status ${response.status}`)
  }

  return response.json()
}

export async function syncUserWithBackend(token: string) {
  return fetchWithAuth('/users/sync', token, { method: 'POST' })
}

export async function getMyProfile(token: string): Promise<UserProfile> {
  return fetchWithAuth('/users/me', token, { method: 'GET' })
}

export async function updateMyProfile(token: string, data: Partial<UserProfile>): Promise<{ message: string; user: UserProfile }> {
  return fetchWithAuth('/users/profile', token, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function reportUser(token: string, reportedClerkId: string, reason: string, details?: string) {
  return fetchWithAuth('/users/report', token, {
    method: 'POST',
    body: JSON.stringify({ reported_clerk_id: reportedClerkId, reason, details }),
  })
}

export async function blockUser(token: string, blockedClerkId: string) {
  return fetchWithAuth('/users/block', token, {
    method: 'POST',
    body: JSON.stringify({ blocked_clerk_id: blockedClerkId }),
  })
}

export interface BlockedUserItem {
  clerk_id: string
  name: string
  image: string
  country: string
  gender: string
}

export async function unblockUser(token: string, blockedClerkId: string): Promise<{ message: string; unblocked_id: string }> {
  return fetchWithAuth('/users/unblock', token, {
    method: 'POST',
    body: JSON.stringify({ blocked_clerk_id: blockedClerkId }),
  })
}

export async function getBlockedUsers(token: string): Promise<{ blocked_users: BlockedUserItem[] }> {
  return fetchWithAuth('/users/blocked', token, { method: 'GET' })
}

export interface SignalingStats {
  online_users: number
  waiting_users: number
  active_calls: number
  total_users: number
}

let statsEndpointUnavailable = false
let lastStatsCheck = 0

export async function getSignalingStats(): Promise<SignalingStats> {
  const defaultStats: SignalingStats = {
    online_users: 1,
    waiting_users: 0,
    active_calls: 0,
    total_users: 1,
  }

  // If endpoint is confirmed unavailable on this backend, back off for 3 minutes before checking again
  const now = Date.now()
  if (statsEndpointUnavailable && now - lastStatsCheck < 180000) {
    return defaultStats
  }

  const isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  // Prioritize local Vite proxy if developing on localhost
  const candidates: string[] = []
  if (isLocal) {
    candidates.push('/api/v1/signaling/stats')
    candidates.push('/api/v1/stats')
  }
  if (API_BASE_URL && !candidates.includes(`${API_BASE_URL}/signaling/stats`)) {
    candidates.push(`${API_BASE_URL}/signaling/stats`)
  }

  for (const url of candidates) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        statsEndpointUnavailable = false
        lastStatsCheck = now
        return await res.json()
      }
    } catch {
      // Ignore network errors
    }
  }

  // Mark unavailable to prevent continuous 404 console spamming
  statsEndpointUnavailable = true
  lastStatsCheck = now
  return defaultStats
}

export async function getFemaleRewardState(token: string): Promise<FemaleRewardState> {
  return fetchWithAuth('/users/rewards/female-match', token, { method: 'GET' })
}

export async function completeFemaleRewardedAd(
  token: string,
  provider?: string,
  rewardEventId?: string,
): Promise<{ duplicate: boolean; reward_state: FemaleRewardState }> {
  return fetchWithAuth('/users/rewards/female-ad-completion', token, {
    method: 'POST',
    body: JSON.stringify({
      provider,
      reward_event_id: rewardEventId,
    }),
  })
}

export async function getMockProfiles(): Promise<{ profiles: UserProfile[]; count: number }> {
  return fetchWithAuth('/users/mock-profiles', undefined, { method: 'GET' })
}

export async function seedMockUsers(): Promise<{ message: string; seeded_count: number }> {
  return fetchWithAuth('/users/seed-mock-users', undefined, { method: 'POST' })
}


