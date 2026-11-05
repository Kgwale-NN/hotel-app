import { useEffect, useState } from 'react'
import {
  cancelMyBooking,
  getMyBookings,
  type MyBooking,
} from '../../api/bookings'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date.slice(0, 10)}T00:00:00`))
}

function MyBookings() {
  const [bookings, setBookings] = useState<MyBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState('')
const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    let isCurrent = true

    getMyBookings()
      .then((data) => {
        if (isCurrent) setBookings(data)
      })
      .catch((err: unknown) => {
        if (isCurrent) {
          setError(
            err instanceof Error ? err.message : 'Could not load your bookings.',
          )
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  async function handleCancel(bookingId: string) {
  setCancellingId(bookingId)
  setActionMessage('')

  try {
    await cancelMyBooking(bookingId)

    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId
          ? { ...booking, status: 'cancelled' }
          : booking,
      ),
    )

    setActionMessage('Booking cancelled.')
  } catch (err: unknown) {
    setActionMessage(
      err instanceof Error ? err.message : 'Could not cancel the booking.',
    )
  } finally {
    setCancellingId('')
  }
}

  if (loading) return <main><p>Loading your bookings…</p></main>
  if (error) return <main><p role="alert">{error}</p></main>

  return (
    <main>
      <h1>My bookings</h1>
      {actionMessage && <p role="status">{actionMessage}</p>}

      {bookings.length === 0 ? (
        <p>You don’t have any bookings yet.</p>
      ) : (
        <div>
          {bookings.map((booking) => (
            <article key={booking.id}>
              <h2>{booking.hotel_name}</h2>
              <p>
                {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
              </p>
              <p>
                {booking.adults} adults · {booking.children} children
              </p>
              <p>Status: {booking.status}</p>

              <ul>
                {booking.rooms.map((room) => (
                  <li key={room.room_id}>
                    {room.accommodation_name} · Room {room.room_number} ·{' '}
                    {booking.currency} {room.price_per_night} per night
                  </li>
                ))}
              </ul>

              {booking.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => handleCancel(booking.id)}
                  disabled={Boolean(cancellingId)}
                >
                  {cancellingId === booking.id ? 'Cancelling…' : 'Cancel booking'}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

export default MyBookings