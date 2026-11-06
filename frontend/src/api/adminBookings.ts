export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired'

export type AdminBooking = {
  id: string
  guest_name: string
  guest_email: string
  hotel_name: string
  check_in: string
  check_out: string
  adults: number
  children: number
  status: BookingStatus
  currency: string
  special_requests: string | null
  cancellation_reason: string | null
  rooms: { room_id: string; room_number: string; accommodation_name: string; price_per_night: string }[]
}

async function readResponse(response: Response) {
  const result = await response.json()
  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Please sign in, then return to this page.' : response.status === 403 ? 'An administrator account is required.' : result.message || 'Unable to complete the request.')
  }
  return result
}

export async function getAdminBookings(): Promise<AdminBooking[]> {
  return (await readResponse(await fetch('/api/admin/bookings'))).data
}

export async function changeAdminBooking(id: string, body: object, details = false): Promise<void> {
  const { csrfToken } = await readResponse(await fetch('/api/auth/csrf'))
  await readResponse(await fetch(`/api/admin/bookings/${encodeURIComponent(id)}${details ? '/details' : ''}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(body),
  }))
}
