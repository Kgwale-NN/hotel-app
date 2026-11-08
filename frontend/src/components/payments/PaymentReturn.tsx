import BackButton from '../layout/BackButton'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyPayment, type PaymentVerification } from '../../api/payments'
import { getMyBookingById, type BookingDetail } from '../../api/bookings'
import { bookingPriceDetails, formatBookingMoney, formatStayDate } from '../../utils/bookingReceipt'
import styles from './PaymentReturn.module.css'

type ReceiptState = { result: PaymentVerification; booking: BookingDetail | null; detailError: string }

export default function PaymentReturn() {
  const [params] = useSearchParams()
  const reference = params.get('reference') || params.get('trxref') || ''
  return <PaymentReceipt key={reference} reference={reference} />
}

function PaymentReceipt({ reference }: { reference: string }) {
  const [receipt, setReceipt] = useState<ReceiptState | null>(null)
  const [loading, setLoading] = useState(Boolean(reference))
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!reference) return
    const controller = new AbortController()
    async function load() {
      try {
        const result = await verifyPayment(reference, controller.signal)
        let booking: BookingDetail | null = null
        let detailError = ''
        if (result.booking_id) {
          try { booking = await getMyBookingById(result.booking_id, controller.signal) }
          catch (caught: unknown) { detailError = caught instanceof Error ? caught.message : 'Could not load booking details.' }
        }
        if (!controller.signal.aborted) setReceipt({ result, booking, detailError })
      } catch (caught: unknown) { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Could not verify your payment.') }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [reference, attempt])

  function checkAgain() { setLoading(true); setError(''); setReceipt(null); setAttempt(value => value + 1) }
  const result = receipt?.result
  const booking = receipt?.booking
  const paid = result?.payment_status === 'succeeded'
  const confirmed = paid && ['confirmed', 'completed'].includes(result?.booking_status || '') && (!booking || ['confirmed', 'completed'].includes(booking.status))
  const failed = result && ['failed', 'abandoned', 'reversed', 'cancelled'].includes(result.payment_status)
  let prices: ReturnType<typeof bookingPriceDetails> | null = null
  if (booking) { try { prices = bookingPriceDetails(booking) } catch { /* The booking remains accessible when price data is incomplete. */ } }
  const title = loading ? 'Checking your payment' : error ? 'Let’s check your payment' : confirmed ? 'Booking confirmed' : paid ? 'Payment received' : failed ? 'Payment not completed' : 'Payment status'
  const explanation = confirmed ? 'We look forward to welcoming you.' : paid ? 'Your payment was received, but this reservation needs review. Please contact the hotel before making another payment.' : failed ? 'Your payment was not completed. You can continue payment for your existing reservation in My bookings.' : 'Please wait for payment confirmation before making another payment.'
  const bookingLink = result?.booking_id ? `/profile/bookings#booking-${result.booking_id}` : '/profile/bookings'

  return <div className={styles.background}><main className={styles.receipt}>
    <header className={styles.header}><Link to="/" className={styles.brand}>HOTEL HEAVEN</Link><nav aria-label="Booking navigation"><Link to="/profile/bookings">My bookings</Link><Link to="/accommodations">Explore rooms <span aria-hidden="true">↗</span></Link></nav></header>
    <section className={styles.status} aria-live="polite" aria-atomic="true">
      <span className={`${styles.statusIcon} ${!confirmed ? styles.neutral : ''}`} aria-hidden="true">{confirmed ? <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m5 12 4 4L19 6" /></svg> : <span>{loading ? '…' : '!'}</span>}</span>
      <h1>{title}</h1>
      <p>{loading ? 'Please wait while we verify your payment securely.' : !reference ? 'No payment reference was supplied. Open My bookings to continue your reservation.' : error || explanation}</p>
      {confirmed && <small>Your confirmation is available in My bookings.</small>}
    </section>
    <div className={`${styles.detailsGrid} ${!booking ? styles.statusOnly : ""}`}>
    <div className={styles.bookingColumn}>
    {!loading && receipt && <>
      {booking && <section className={styles.summary} aria-label="Booking details">
        <p className={styles.label}>{confirmed ? 'CONFIRMATION NUMBER' : 'BOOKING REFERENCE'}</p><p className={styles.reference}>{booking.id}</p>
        <div className={styles.roomSummary}>{booking.rooms.map(room => <div key={room.room_id}><h2>{room.accommodation_name}</h2><p>Room {room.room_number} · {booking.hotel_name}</p></div>)}
          <p>{booking.rooms.length} {booking.rooms.length === 1 ? 'room' : 'rooms'} · {booking.adults} {booking.adults === 1 ? 'adult' : 'adults'}{booking.children > 0 ? ` · ${booking.children} ${booking.children === 1 ? 'child' : 'children'}` : ''}</p>
        </div>
        <div className={styles.dates}><div><p className={styles.label}>CHECK-IN</p><strong>{formatStayDate(booking.check_in)}</strong>{booking.hotel_check_in_time && <small>After {booking.hotel_check_in_time.slice(0, 5)}</small>}</div><div><p className={styles.label}>CHECK-OUT</p><strong>{formatStayDate(booking.check_out)}</strong>{booking.hotel_check_out_time && <small>Before {booking.hotel_check_out_time.slice(0, 5)}</small>}</div></div>
      </section>}
      {receipt.detailError && <p role="alert" className={styles.notice}>{receipt.detailError} You can still view your reservation in My bookings.</p>}
    </>}
    </div>
    <div className={styles.paymentColumn}>
    {!loading && receipt && <>
      {(prices || (paid && result?.amount && result.currency)) && <section className={styles.priceCard} aria-label="Price details"><h2>Price details</h2>
        {prices && booking && <><div className={styles.priceRow}><span>{prices.nights} {prices.nights === 1 ? 'night' : 'nights'} · {booking.rooms.length} {booking.rooms.length === 1 ? 'room' : 'rooms'}</span><span>{formatBookingMoney(prices.roomTotal, booking.currency)}</span></div><div className={styles.priceRow}><span>Taxes and fees</span><span>{formatBookingMoney(prices.fees, booking.currency)}</span></div></>}
        <div className={styles.total}><strong>{paid ? 'Total paid' : 'Booking total'}</strong><strong>{formatBookingMoney(paid && result?.amount ? result.amount : prices!.total, (paid && result?.currency) || booking!.currency)}</strong></div>
      </section>}
      {!confirmed && <p className={styles.paymentStatus}>Payment: {result?.payment_status}{result?.booking_status ? ` · Reservation: ${result.booking_status}` : ''}</p>}
    </>}
    {error && <p role="alert" className={styles.notice}>Your payment could not be verified. Sign in with the booking account if needed, then check again.</p>}
    <div className={styles.actions}>{reference && !loading && (!confirmed || receipt?.detailError) && <button type="button" className={styles.secondary} onClick={checkAgain}>Check payment again</button>}{error && <a className={styles.secondary} href="/api/auth/google" target="_blank" rel="noopener noreferrer">Sign in to check booking</a>}<Link className={styles.primary} to={bookingLink}>{confirmed ? 'View my booking' : 'View my bookings'}</Link><BackButton className={styles.home}>Go back</BackButton></div>
    {reference && !loading && !confirmed && <p className={styles.paymentReference}>Payment reference: {reference}</p>}
    </div>
    </div>
    <footer className={styles.footer}>A place to slow down. A stay to look forward to.</footer>
  </main></div>
}
