const API_BASE_URL = '/api/v1'

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
