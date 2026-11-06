export type GuestNotification = {
  id: string; booking_id: string | null; type: string; title: string;
  message: string; read_at: string | null; created_at: string;
}
async function notificationRequest<T>(path: string, method = 'GET', signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = {}
  if (method !== 'GET') {
    const csrfResponse = await fetch('/api/auth/csrf')
    if (!csrfResponse.ok) throw new Error('Please sign in to update your notifications.')
    const { csrfToken } = await csrfResponse.json()
    headers['X-CSRF-Token'] = csrfToken
  }
  const response = await fetch(`/api/notifications${path}`, { method, headers, signal })
  const result = await response.json()
  if (!response.ok) throw new Error(response.status === 401 ? 'Please sign in to view your notifications.' : result.message || 'Unable to load notifications.')
  return result as T
}
export async function getNotifications(signal: AbortSignal) {
  return (await notificationRequest<{ data: GuestNotification[] }>('', 'GET', signal)).data
}
export async function markNotificationRead(id: string) {
  return (await notificationRequest<{ data: { id: string; read_at: string } }>(`/${encodeURIComponent(id)}/read`, 'PATCH')).data
}
export const markAllNotificationsRead = () => notificationRequest<{ updated_count: number }>('/read-all', 'PATCH')
