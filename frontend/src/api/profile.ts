export type UserProfile = {
  id: string; email: string; full_name: string; phone: string | null;
  marketing_opt_in: boolean; avatar_url: string | null; role: string;
}

async function profileRequest<T>(path: string, method = 'GET', body?: object): Promise<T> {
  const headers: Record<string, string> = {}
  if (method !== 'GET') {
    const csrf = await fetch('/api/auth/csrf')
    if (!csrf.ok) throw new Error('Please sign in to continue.')
    const { csrfToken } = await csrf.json()
    headers['Content-Type'] = 'application/json'
    headers['X-CSRF-Token'] = csrfToken
  }
  const response = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const result = await response.json()
  if (!response.ok) throw new Error(response.status === 401 ? 'Please sign in to view your profile.' : result.message || 'Unable to complete the request.')
  return result.data as T
}
export const getProfile = () => profileRequest<UserProfile>('/api/profile')
export const saveProfile = (full_name: string, phone: string | null) =>
  profileRequest<Omit<UserProfile, 'marketing_opt_in'>>('/api/profile', 'PATCH', { full_name, phone })
export const saveMarketingPreference = (marketing_opt_in: boolean) =>
  profileRequest<{ marketing_opt_in: boolean }>('/api/profile/marketing-preference', 'PATCH', { marketing_opt_in })
export const signOut = () => profileRequest<void>('/api/auth/logout', 'POST', {})
