import { useLocation, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { createBookingPayment, cancelMyBooking, getMyBookings, type MyBooking } from '../../api/bookings'
import { hotelCalendarDate } from '../../utils/bookingReceipt'
import AccountMenuIcon from '../layout/AccountMenuIcon'
import BookingCard from './BookingCard'
import styles from './MyBookings.module.css'

type Filter = 'all' | 'confirmed' | 'pending' | 'history'

export default function MyBookings() {
  const { hash } = useLocation()
  const [bookings, setBookings] = useState<MyBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [message, setMessage] = useState('')
  const [cancellingId, setCancellingId] = useState('')
  const [payingId, setPayingId] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [retry, setRetry] = useState(0)
  const busy = Boolean(payingId || cancellingId)
  const today = hotelCalendarDate(new Date().toISOString())
  const isHistory = (booking: MyBooking) => ['cancelled', 'expired', 'completed'].includes(booking.status) || hotelCalendarDate(booking.check_out) < today
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'All bookings', count: bookings.length },
    { value: 'confirmed', label: 'Confirmed', count: bookings.filter(booking => booking.status === 'confirmed').length },
    { value: 'pending', label: 'Awaiting payment', count: bookings.filter(booking => booking.status === 'pending').length },
    { value: 'history', label: 'Past & cancelled', count: bookings.filter(isHistory).length },
  ]
  const visible = bookings.filter(booking => filter === 'all' || (filter === 'history' ? isHistory(booking) : booking.status === filter))

  useEffect(() => {
    let current = true
    getMyBookings().then(data => { if (current) setBookings(data) })
      .catch((caught: unknown) => { if (current) setError(caught instanceof Error ? caught.message : 'Could not load your bookings.') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [retry])

  useEffect(() => {
    if (!loading && hash.startsWith('#booking-')) {
      const card = document.getElementById(hash.slice(1))
      card?.scrollIntoView({ block: 'start' }); card?.focus({ preventScroll: true })
    }
  }, [loading, hash, bookings])

  async function handlePayment(id: string) {
    if (busy) return
    setPayingId(id); setMessage(''); setActionError('')
    try { const payment = await createBookingPayment(id); window.location.assign(payment.checkout_url) }
    catch (caught: unknown) { setActionError(caught instanceof Error ? caught.message : 'Could not start payment.') }
    finally { setPayingId('') }
  }

  async function handleCancel(id: string) {
    if (busy) return
    setCancellingId(id); setMessage(''); setActionError('')
    try {
      await cancelMyBooking(id)
      setBookings(current => current.map(booking => booking.id === id ? { ...booking, status: 'cancelled' } : booking))
      setMessage('Your booking has been cancelled.')
    } catch (caught: unknown) { setActionError(caught instanceof Error ? caught.message : 'Could not cancel this booking.') }
    finally { setCancellingId('') }
  }

  return <main className={styles.page}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>YOUR STAYS, ALL IN ONE PLACE</p><h1>My bookings</h1><p className={styles.subtitle}>Look forward to your next getaway, or revisit a stay to remember.</p></div><Link className={styles.explore} to="/accommodations">Book another stay <span aria-hidden="true">↗</span></Link></header>
    {message && <p className={styles.notice} role="status">{message}</p>}
    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
    {loading ? <><p className={styles.count} role="status">Finding your reservations...</p><div className={styles.skeleton} aria-hidden="true"><span /><div><span /><span /><span /></div></div></> : error ? <section className={styles.empty}><span className={styles.emptyIcon}><AccountMenuIcon name="bookings" /></span><h2>Let’s find your bookings.</h2><p role="alert">{error}</p><button className={styles.primary} onClick={() => { setLoading(true); setError(''); setRetry(value => value + 1) }}>Try again</button></section> : bookings.length === 0 ? <section className={styles.empty}><span className={styles.emptyIcon}><AccountMenuIcon name="bookings" /></span><h2>Your next stay starts here.</h2><p>You haven’t made a reservation yet. Explore our rooms and find your perfect stay.</p><Link className={styles.primary} to="/accommodations">Find a room <span aria-hidden="true">↗</span></Link></section> : <>
      <div className={styles.filters} role="group" aria-label="Filter bookings">{filters.map(item => <button type="button" key={item.value} aria-pressed={filter === item.value} className={filter === item.value ? styles.activeFilter : ''} onClick={() => setFilter(item.value)}>{item.label}<span>{item.count}</span></button>)}</div>
      <p className={styles.count} role="status">{visible.length} {visible.length === 1 ? 'booking' : 'bookings'}{filter !== 'all' ? ' in this category' : ''}</p>
      {visible.length ? <div className={styles.bookingList}>{visible.map(booking => <BookingCard key={booking.id} booking={booking} busy={busy} payingId={payingId} cancellingId={cancellingId} onPay={id => void handlePayment(id)} onCancel={id => void handleCancel(id)} />)}</div> : <section className={styles.empty}><h2>No bookings here yet.</h2><p>Try another category to see your other reservations.</p><button className={styles.secondary} onClick={() => setFilter('all')}>Show all bookings</button></section>}
    </>}
  </main>
}
