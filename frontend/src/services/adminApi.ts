const API_BASE_URL = '/api/v1'

export type ReportStatus = 'pending' | 'reviewed' | 'resolved'

export interface AdminUserSummary {
  clerk_id: string
  email?: string
  name?: string
  gender?: string
  looking_for?: string
  age?: number
  country?: string
  city?: string
  languages?: string[]
  interests?: string[]
  image?: string
  bio?: string
  is_online?: boolean
  is_profile_completed?: boolean
  blocked_users?: string[]
  friends?: string[]
  role?: string
  created_at?: string
  last_seen?: string
}

export interface AdminReport {
  id: string
  reporter_clerk_id: string
  reported_clerk_id: string
  reason: string
  details?: string
  status: ReportStatus
  created_at?: string
  reviewed_at?: string
  reviewed_by?: string
  reporter?: AdminUserSummary
  reported_user?: AdminUserSummary
}

export interface AdminBlock {
  id: string
  blocker_id?: string
  blocked_id?: string
  blocker_clerk_id?: string
  blocked_clerk_id?: string
  created_at?: string
  blocker?: AdminUserSummary
  blocked_user?: AdminUserSummary
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface AdminStats {
  users: number
  online_users: number
  offline_users: number
  reports: number
  pending_reports: number
  blocks: number
  online_percentage: number
  recent_reports: AdminReport[]
  recent_users: AdminUserSummary[]
  female_ad_unlocks: number
  verified_rewarded_ads: number
  female_connection_credits_consumed: number
  remaining_female_connection_credits: number
  reward_verification_failures: number
  duplicate_reward_attempts: number
}

export interface AdminHealth {
  api: string
  mongodb: string
  services: Record<string, string>
  checked_at: string
  database_error?: string
}

export interface AdminUserDetails {
  user: AdminUserSummary
  friends_count: number
  blocked_users_count: number
  blocked_by_count: number
  reports: AdminReport[]
}

export class AdminApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
  }
}

async function adminFetch<T>(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: 'Admin API Error' }))
      throw new AdminApiError(
        errorData.detail || `Request failed with status ${response.status}`,
        response.status,
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof AdminApiError) {
      throw error
    }

    throw new AdminApiError(
      'Network error while contacting the admin API.',
      0,
    )
  }
}

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  })

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export function getAdminStats(token: string): Promise<AdminStats> {
  return adminFetch(token, '/admin/stats')
}

export function getAdminHealth(token: string): Promise<AdminHealth> {
  return adminFetch(token, '/admin/health')
}

export function getAdminUsers(
  token: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<PaginatedResponse<AdminUserSummary>> {
  return adminFetch(token, `/admin/users${buildQuery(params)}`)
}

export function getAdminUserDetails(
  token: string,
  clerkId: string,
): Promise<AdminUserDetails> {
  return adminFetch(token, `/admin/users/${encodeURIComponent(clerkId)}`)
}

export function getAdminReports(
  token: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<PaginatedResponse<AdminReport>> {
  return adminFetch(token, `/admin/reports${buildQuery(params)}`)
}

export function updateAdminReportStatus(
  token: string,
  reportId: string,
  status: ReportStatus,
): Promise<{ message: string; status: ReportStatus }> {
  return adminFetch(token, `/admin/reports/${reportId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function getAdminBlocks(
  token: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<PaginatedResponse<AdminBlock>> {
  return adminFetch(token, `/admin/blocks${buildQuery(params)}`)
}
