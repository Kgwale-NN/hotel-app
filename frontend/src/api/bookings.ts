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