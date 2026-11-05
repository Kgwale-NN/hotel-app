export type AvailableRoom = {
  id: string
  room_number: string
  capacity: number
  price_per_night: string
  currency: string
  is_available: boolean
}

export async function getAvailableRooms(
  accommodationId: string,
  checkIn: string,
  checkOut: string,
): Promise<AvailableRoom[]> {
  const params = new URLSearchParams({
    accommodation_id: accommodationId,
    check_in: checkIn,
    check_out: checkOut,
  })

  const response = await fetch(`/api/bookings/availability?${params}`)

  if (!response.ok) {
    throw new Error('Could not check room availability.')
  }

  const result: { data: AvailableRoom[] } = await response.json()
  return result.data
}

export async function createBooking(input: {
  roomIds: string[]
  checkIn: string
  checkOut: string
  adults: number
  children: number
}) {
  const csrfResponse = await fetch('/api/auth/csrf')
  if (!csrfResponse.ok) {
    throw new Error('Could not prepare the booking request.')
  }

  const { csrfToken }: { csrfToken: string } = await csrfResponse.json()

  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      room_ids: input.roomIds,
      check_in: input.checkIn,
      check_out: input.checkOut,
      adults: input.adults,
      children: input.children,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message ?? 'Could not create the reservation.')
  }

  return result.data
}