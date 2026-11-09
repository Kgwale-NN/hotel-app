import DateInput from '../common/DateInput'
import LoadingSkeleton from '../common/LoadingSkeleton'
import EmptyState from '../common/EmptyState'
import { ArrowUpRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createBooking, createBookingPayment, getAvailableRooms, type AvailableRoom } from '../../api/bookings'
import { useAppSelector } from '../../store/hooks'
import AuthModal from '../auth/AuthModal'
import styles from './BookingForm.module.css'

type BookingFormProps = { accommodationId: string }

function localToday() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function BookingForm({ accommodationId }: BookingFormProps) {
  const { user, status } = useAppSelector(state => state.auth)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingMessage, setBookingMessage] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [reservationId, setReservationId] = useState('')
  const locked = loading || bookingLoading || Boolean(reservationId)
  const checkingAccount = status === 'idle' || status === 'loading'

  function resetSearch() {
    setAvailableRooms([]); setSelectedRoomId(''); setMessage(''); setError(''); setBookingMessage('')
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locked) return
    resetSearch()
    if (!checkIn || !checkOut || checkIn < localToday() || checkOut <= checkIn) { setError('Choose a future stay with check-out after check-in.'); return }
    if (!Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0) { setError('Enter at least one adult and a valid number of children.'); return }
    setLoading(true)
    try {
      const rooms = await getAvailableRooms(accommodationId, checkIn, checkOut)
      const freeRooms = rooms.filter(room => room.is_available && room.capacity >= adults + children)
      setAvailableRooms(freeRooms)
      setMessage(freeRooms.length ? `${freeRooms.length} ${freeRooms.length === 1 ? 'room available' : 'rooms available'}. Choose your room below.` : 'No rooms fit your dates and guest count. Try different dates or fewer guests.')
    } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : 'Could not check availability. Please try again.') }
    finally { setLoading(false) }
  }

  async function handleCreateBooking() {
    if (!selectedRoomId || bookingLoading || loading) return
    if (!user) { setAuthOpen(true); return }
    setBookingLoading(true); setBookingMessage('')
    let bookingId = reservationId
    try {
      if (!bookingId) {
        const booking = await createBooking({ roomIds: [selectedRoomId], checkIn, checkOut, adults, children })
        bookingId = booking.id
        setReservationId(booking.id)
      }
      const payment = await createBookingPayment(bookingId)
      window.location.assign(payment.checkout_url)
    } catch (caught: unknown) {
      const explanation = caught instanceof Error ? caught.message : 'Could not complete your reservation.'
      setBookingMessage(bookingId ? `Your reservation is saved. ${explanation} Retry payment below or visit My bookings.` : explanation)
    } finally { setBookingLoading(false) }
  }

  return <section className={styles.bookingForm} aria-labelledby="plan-stay-title">
    <div><h2 id="plan-stay-title">Plan your stay</h2><p className={styles.intro}>A few details, and you are one step closer.</p></div>
    <form onSubmit={handleSearch}>
      <fieldset className={styles.fields} disabled={locked}>
        <label>Check-in<DateInput name="checkIn" min={localToday()} value={checkIn} onChange={event => { setCheckIn(event.target.value); resetSearch() }} required /></label>
        <label>Check-out<DateInput name="checkOut" min={checkIn || localToday()} value={checkOut} onChange={event => { setCheckOut(event.target.value); resetSearch() }} required /></label>
        <label>Adults<input type="number" name="adults" min="1" max="100" step="1" value={adults} onChange={event => { setAdults(Number(event.target.value)); resetSearch() }} required /></label>
        <label>Children<input type="number" name="children" min="0" max="100" step="1" value={children} onChange={event => { setChildren(Number(event.target.value)); resetSearch() }} required /></label>
      </fieldset>
      <button className={styles.searchButton} type="submit" disabled={locked}>{loading ? 'Checking rooms...' : 'Check availability'}<span aria-hidden="true"><ArrowUpRight size={18} aria-hidden="true" /></span></button>
    </form>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {loading && <LoadingSkeleton count={2} label="Checking room availability" />}
    {message && !availableRooms.length && !loading ? <EmptyState kind="search" title="Let’s try another date.">{message}</EmptyState> : message && <p className={styles.notice} role="status">{message}</p>}
    {availableRooms.length > 0 && <>
      <fieldset className={styles.roomChoices} disabled={bookingLoading || Boolean(reservationId)}>
        <legend>Select your room</legend>
        {availableRooms.map(room => <label key={room.id} className={`${styles.roomChoice} ${selectedRoomId === room.id ? styles.selected : ''}`}>
          <input type="radio" name="selectedRoom" value={room.id} checked={selectedRoomId === room.id} onChange={() => { setSelectedRoomId(room.id); setBookingMessage('') }} />
          <span><strong>Room {room.room_number}</strong><small>Up to {room.capacity} guests</small></span>
          <span className={styles.roomPrice}>{room.currency} {Number(room.price_per_night).toLocaleString('en-ZA')}<small>/ night</small></span>
        </label>)}
      </fieldset>
      <button className={styles.reserveButton} type="button" onClick={() => void handleCreateBooking()} disabled={!selectedRoomId || bookingLoading || checkingAccount}>{bookingLoading ? 'Preparing checkout...' : reservationId ? 'Retry payment' : !user ? 'Sign in to reserve' : 'Reserve & continue to payment'}<span aria-hidden="true"><ArrowUpRight size={18} aria-hidden="true" /></span></button>
      <p className={styles.helper}>{reservationId ? 'You can also continue payment from your booking history.' : 'Pay securely with Paystack, then await confirmation from the hotel.'}</p>
    </>}
    {bookingMessage && <p className={styles.error} role="alert">{bookingMessage}</p>}
    {reservationId && !bookingLoading && <Link className={styles.bookingsLink} to="/profile/bookings">Go to My bookings <ArrowUpRight size={16} aria-hidden="true" /></Link>}
    {authOpen && !user && <AuthModal onClose={() => setAuthOpen(false)} />}
  </section>
}
