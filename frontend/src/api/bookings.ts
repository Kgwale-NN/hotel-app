export type AvailableRoom = {
  id: string
  room_number: string
  capacity: number
  price_per_night: string
  currency: string
  is_available: boolean
}
export type MyBooking = {
  id: string
  hotel_id: string
  hotel_name: string
  check_in: string
  check_out: string
  adults: number
  children: number
  status: string
  payment_due_at: string | null
  currency: string
  taxes_and_fees: string
  created_at: string
  rooms: {
    room_id: string
    room_number: string
    accommodation_id: string
    accommodation_name: string
    price_per_night: string
  }[]
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

export async function createBookingPayment(bookingId: string) {
  const csrfResponse = await fetch('/api/auth/csrf')

  if (!csrfResponse.ok) {
    throw new Error('Could not prepare the payment request.')
  }

  const { csrfToken }: { csrfToken: string } = await csrfResponse.json()

  const response = await fetch(
    `/api/bookings/${encodeURIComponent(bookingId)}/payments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({}),
    },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message ?? 'Could not start payment.')
  }

  return result.data as {
    payment_id: string
    checkout_url: string
    reference: string
  }
}

export async function getMyBookings(): Promise<MyBooking[]> {
  const response = await fetch('/api/bookings')

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Sign in to view your bookings.'
        : 'Could not load your bookings.',
    )
  }

  const result: { data: MyBooking[] } = await response.json()
  return result.data
}

export async function cancelMyBooking(bookingId: string) {
  const csrfResponse = await fetch('/api/auth/csrf')

  if (!csrfResponse.ok) {
    throw new Error('Could not prepare the cancellation request.')
  }

  const { csrfToken }: { csrfToken: string } = await csrfResponse.json()

  const response = await fetch(
    `/api/bookings/${encodeURIComponent(bookingId)}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ reason: 'Cancelled by guest' }),
    },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message ?? 'Could not cancel the booking.')
  }

  return result.data
}