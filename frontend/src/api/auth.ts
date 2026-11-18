import type { UserProfile } from './profile'

export type EmailAccountInput = { email: string; password: string; remember_me: boolean; full_name?: string }
export async function authenticateWithEmail(mode: 'signup' | 'signin', input: EmailAccountInput): Promise<UserProfile> {
  const signal = AbortSignal.timeout(20_000)
  const tokenResponse = await fetch('/api/auth/form-token', { signal })
  const token = await tokenResponse.json()
  if (!tokenResponse.ok) throw new Error(token.message || 'Could not prepare your sign-in request.')
  const response = await fetch(mode === 'signup' ? '/api/auth/register' : '/api/auth/login', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token.csrfToken },
    body: JSON.stringify(input),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'Could not complete your account request.')
  return result.data as UserProfile
}

export async function setAdminAppPassword(password: string, confirmation: string, currentPassword: string): Promise<void> {
  const csrf = await fetch('/api/auth/csrf')
  if (!csrf.ok) throw new Error('Please sign in to your admin account again.')
  const { csrfToken } = await csrf.json()
  const response = await fetch('/api/auth/admin/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ password, confirm_password: confirmation, current_password: currentPassword }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'Could not save your app password.')
}
