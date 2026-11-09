import { ArrowUpRight, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MyBooking } from '../../api/bookings'
import { bookingPriceDetails, formatBookingMoney, formatStayDate } from '../../utils/bookingReceipt'
import { roomPhotoByName } from '../../data/roomPhotos'
import AccountMenuIcon from '../layout/AccountMenuIcon'
import styles from './MyBookings.module.css'

type Props = {
  booking: MyBooking
  busy: boolean
  payingId: string
  cancellingId: string
  onPay: (id: string) => void
  onCancel: (id: string) => void
}

const statusLabels: Record<string, string> = { confirmed: 'Confirmed', pending: 'Awaiting payment', completed: 'Completed', cancelled: 'Cancelled', expired: 'Expired' }

export default function BookingCard({ booking, busy, payingId, cancellingId, onPay, onCancel }: Props) {
  const room = booking.rooms[0]
  const fallback = room ? roomPhotoByName[room.accommodation_name] || '' : ''
  const [photo, setPhoto] = useState(room?.cover_image || fallback)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [])
  let price: ReturnType<typeof bookingPriceDetails> | null = null
  try { price = bookingPriceDetails(booking) } catch { /* Keep booking information available when historical price data is incomplete. */ }
  const canPay = !booking.payment_received && booking.status === 'pending' && booking.payment_due_at !== null && new Date(booking.payment_due_at).getTime() > now
  const isPending = booking.status === 'pending' && !booking.payment_received
  const statusClass = ['confirmed', 'pending', 'completed', 'cancelled', 'expired'].includes(booking.status) ? booking.status : 'unknown'

  return <article className={styles.bookingCard} id={`booking-${booking.id}`} tabIndex={-1} aria-labelledby={`booking-title-${booking.id}`}>
    <div className={styles.cardMain}>
      <div className={styles.photoArea}>
        {photo ? <img src={photo} alt={room?.accommodation_name || booking.hotel_name} loading="lazy" onError={() => setPhoto(photo !== fallback ? fallback : '')} /> : <div className={styles.photoFallback}><AccountMenuIcon name="bookings" /><span>{booking.hotel_name}</span></div>}
        {price && <span className={styles.nightsBadge}>{price.nights} {price.nights === 1 ? 'night' : 'nights'}</span>}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardHeading}><div><p className={styles.hotelName}>{booking.hotel_name}</p><h2 id={`booking-title-${booking.id}`}>{room?.accommodation_name || 'Your hotel stay'}{booking.rooms.length > 1 && <small> + {booking.rooms.length - 1} more</small>}</h2></div><span className={`${styles.status} ${styles[statusClass]}`}><span aria-hidden="true" />{booking.status === 'pending' && booking.payment_received ? 'Payment needs review' : statusLabels[booking.status] || booking.status}</span></div>
        <div className={styles.stayDates}><div><span>CHECK-IN</span><strong>{formatStayDate(booking.check_in)}</strong></div><span className={styles.dateArrow} aria-hidden="true"><ArrowRight size={18} aria-hidden="true" /></span><div><span>CHECK-OUT</span><strong>{formatStayDate(booking.check_out)}</strong></div></div>
        <div className={styles.guestDetails}><span><AccountMenuIcon name="profile" />{booking.adults} {booking.adults === 1 ? 'adult' : 'adults'}{booking.children ? ` · ${booking.children} ${booking.children === 1 ? 'child' : 'children'}` : ''}</span><span><AccountMenuIcon name="bookings" />{booking.rooms.length} {booking.rooms.length === 1 ? 'room' : 'rooms'}</span></div>
        <div className={styles.rooms}>{booking.rooms.map(item => <p key={item.room_id}>{booking.rooms.length > 1 ? `${item.accommodation_name} · ` : ''}Room {item.room_number}<span>{formatBookingMoney(item.price_per_night, booking.currency)} / night</span></p>)}</div>
      </div>
    </div>
    <div className={styles.cardFooter}>
      <div className={styles.price}><small>Booking total</small><strong>{price ? formatBookingMoney(price.total, booking.currency) : 'See booking details'}</strong>{price && price.fees > 0 && <span>Includes taxes and fees</span>}</div>
      <div className={styles.cardActions}>
        {room && <Link className={styles.secondary} to={`/accommodations/${encodeURIComponent(room.accommodation_id)}`}>View room <span aria-hidden="true"><ArrowUpRight size={18} aria-hidden="true" /></span></Link>}
        {canPay && <button type="button" className={styles.primary} disabled={busy} onClick={() => onPay(booking.id)}>{payingId === booking.id ? 'Opening checkout...' : 'Continue payment'} <span aria-hidden="true"><ArrowUpRight size={18} aria-hidden="true" /></span></button>}
        {isPending && <button type="button" className={styles.cancelButton} disabled={busy} onClick={() => setConfirmCancel(true)}>{cancellingId === booking.id ? 'Cancelling...' : 'Cancel booking'}</button>}
      </div>
    </div>
    {booking.status === 'pending' && booking.payment_received && <p className={styles.deadline}>Payment received. Please check your payment confirmation or contact the hotel if your booking remains pending. Do not pay again.</p>}
    {isPending && !canPay && <p className={styles.deadline}>The online payment deadline has passed. You can cancel this reservation or contact the hotel.</p>}
    {confirmCancel && isPending && <div className={styles.confirm}><h3>Cancel this booking?</h3><p>Your room reservation will be cancelled.</p><div className={styles.cardActions}><button type="button" className={styles.primary} disabled={busy} onClick={() => onCancel(booking.id)}>{cancellingId === booking.id ? 'Cancelling...' : 'Yes, cancel booking'}</button><button type="button" className={styles.secondary} disabled={busy} onClick={() => setConfirmCancel(false)}>Keep my booking</button></div></div>}
    <div className={styles.cardDetails}>
      <p className={styles.reference}>Reference <span>{booking.id}</span></p>
      {price && <details className={styles.priceDetails}><summary>Price breakdown</summary><div><p><span>{price.nights} {price.nights === 1 ? 'night' : 'nights'} · {booking.rooms.length} {booking.rooms.length === 1 ? 'room' : 'rooms'}</span><span>{formatBookingMoney(price.roomTotal, booking.currency)}</span></p><p><span>Taxes and fees</span><span>{formatBookingMoney(price.fees, booking.currency)}</span></p></div></details>}
    </div>
  </article>
}
