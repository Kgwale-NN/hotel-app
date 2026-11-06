export type InventoryItem = {
  id: string; name: string; hotel_name: string; hotel_id: string; room_type: string;
  capacity: number; price_per_night: string; currency: string; is_active: boolean;
  description: string; bed_description: string; total_rooms: number;
  rooms: { id: string; room_number: string; is_active: boolean }[];
}
export type HotelChoice = { id: string; name: string }

export async function inventoryRequest<T>(path: string, method = 'GET', body?: object): Promise<T> {
  const headers: Record<string, string> = {}
  if (method !== 'GET') {
    const csrf = await fetch('/api/auth/csrf')
    if (!csrf.ok) throw new Error('Please sign in before making changes.')
    const token = await csrf.json()
    headers['X-CSRF-Token'] = token.csrfToken
    headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(`/api/admin${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const result = await response.json()
  if (!response.ok) throw new Error(response.status === 401 ? 'Please sign in with your administrator account.' : response.status === 403 ? 'Administrator access is required.' : result.message || 'Unable to complete this request.')
  return result.data as T
}
