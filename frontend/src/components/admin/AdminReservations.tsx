import { useEffect, useState, type FormEvent } from 'react'
import { changeAdminBooking, completeAdminBooking, getAdminBookings, type AdminBooking, type BookingStatus } from '../../api/adminBookings'
import styles from './AdminReservations.module.css'

const statuses: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'completed', 'expired']
const dateLabel = (value: string) => new Date(value).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
// The API serializes PostgreSQL dates at local midnight; recover the local date for inputs.
function inputDate(value: string) {
  if (value.length === 10) return value
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function AdminReservations() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [panel, setPanel] = useState<{ id: string; mode: 'edit' | 'cancel' | 'approve' | 'complete' } | null>(null)

  useEffect(() => {
    let current = true
    getAdminBookings().then(data => { if (current) setBookings(data) })
      .catch((e: unknown) => { if (current) setError(e instanceof Error ? e.message : 'Could not load reservations.') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>, booking: AdminBooking) {
    event.preventDefault()
    if (!panel || busy) return
    const mode = panel.mode
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (mode === 'complete') {
        await completeAdminBooking(booking.id)
      } else {
        await changeAdminBooking(booking.id, mode === 'edit' ? {
          check_in: data.get('check_in'), check_out: data.get('check_out'),
          adults: Number(data.get('adults')), children: Number(data.get('children')),
          special_requests: String(data.get('special_requests') || '').trim() || null,
        } : { status: mode === 'approve' ? 'confirmed' : 'cancelled', ...(mode === 'cancel' ? { cancellation_reason: data.get('reason') } : {}) }, mode === 'edit')
      }
      setPanel(null)
      setNotice('Reservation updated successfully.')
      setBookings(await getAdminBookings())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not update the reservation.')
    } finally { setBusy(false) }
  }

  const visible = bookings.filter(b => (filter === 'all' || b.status === filter) &&
    `${b.id} ${b.guest_name} ${b.guest_email} ${b.hotel_name} ${b.rooms.map(r => `${r.room_number} ${r.accommodation_name}`).join(' ')}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.brand}>HOTEL HAVEN <span>Administration</span></a>
        <div><a href="/admin/accommodations">Manage accommodations</a> · <a href="/">Back to hotel &rarr;</a></div>
      </header>
      <div className={styles.content}>
        <p className={styles.eyebrow}>GUEST MANAGEMENT</p>
        <h1>Reservations</h1>
        <p className={styles.intro}>Manage upcoming stays and keep every guest detail in order.</p>
        <div className={styles.summary}>
          {[['Total reservations', bookings.length], ['Pending approval', bookings.filter(b => b.status === 'pending').length], ['Confirmed stays', bookings.filter(b => b.status === 'confirmed').length]].map(([label, count]) => <div key={label}><span>{label}</span><strong>{loading ? '—' : count}</strong></div>)}
        </div>
        <div className={styles.filters}>
          <label>Search reservations<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Guest, reference or room…" /></label>
          <label>Status<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All reservations</option>{statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></label>
        </div>
        {notice && <p className={styles.notice} role="status">{notice}</p>}
        {error && <p className={styles.error} role="alert">{error} <a href="/api/auth/google">Sign in</a></p>}
        {loading ? <p role="status">Loading reservations…</p> : <p className={styles.count}>{visible.length} reservation{visible.length === 1 ? '' : 's'}</p>}
        {!loading && !error && visible.length === 0 && <div className={styles.empty}>No reservations match your search.</div>}
        <div className={styles.list}>
          {visible.map(booking => <article className={styles.card} key={booking.id}>
            <div className={styles.cardHeading}><div><p className={styles.reference}>REF {booking.id}</p><h2>{booking.guest_name || 'Hotel guest'}</h2><a href={`mailto:${booking.guest_email}`}>{booking.guest_email}</a></div><span className={`${styles.badge} ${styles[booking.status]}`}>{booking.status}</span></div>
            <div className={styles.facts}><div><span>Check-in</span><strong>{dateLabel(booking.check_in)}</strong></div><div><span>Check-out</span><strong>{dateLabel(booking.check_out)}</strong></div><div><span>Guests</span><strong>{booking.adults} adult{booking.adults === 1 ? '' : 's'} · {booking.children} children</strong></div><div><span>Hotel</span><strong>{booking.hotel_name}</strong></div></div>
            <ul className={styles.rooms}>{booking.rooms.map(room => <li key={room.room_id}><span>{room.accommodation_name} <small>Room {room.room_number}</small></span><span>{booking.currency} {Number(room.price_per_night).toLocaleString('en-ZA')} / night</span></li>)}</ul>
            {booking.special_requests && <p className={styles.notes}><strong>Guest requests:</strong> {booking.special_requests}</p>}
            {booking.cancellation_reason && <p className={styles.notes}><strong>Cancellation reason:</strong> {booking.cancellation_reason}</p>}
            {booking.status === 'pending' && <div className={styles.actions}><button disabled={busy} onClick={() => { setPanel({ id: booking.id, mode: 'approve' }); setError('') }}>Approve reservation</button><button disabled={busy} className={styles.secondary} onClick={() => { setPanel({ id: booking.id, mode: 'edit' }); setError('') }}>Edit details</button><button disabled={busy} className={styles.cancel} onClick={() => { setPanel({ id: booking.id, mode: 'cancel' }); setError('') }}>Cancel reservation</button></div>}
            {booking.status === 'confirmed' && <div className={styles.actions}><button disabled={busy} onClick={() => { setPanel({ id: booking.id, mode: 'complete' }); setError('') }}>Mark stay completed</button></div>}
            {panel?.id === booking.id && <form key={`${booking.id}-${panel.mode}`} className={styles.editor} onSubmit={event => submit(event, booking)}>
              <h3>{panel.mode === 'edit' ? 'Edit reservation' : panel.mode === 'cancel' ? 'Cancel this reservation?' : panel.mode === 'complete' ? 'Complete this stay?' : 'Approve this reservation?'}</h3>
              {panel.mode === 'edit' ? <div className={styles.editGrid}>
                <label>Check-in<input name="check_in" type="date" defaultValue={inputDate(booking.check_in)} required /></label><label>Check-out<input name="check_out" type="date" defaultValue={inputDate(booking.check_out)} required /></label><label>Adults<input name="adults" type="number" min="1" step="1" defaultValue={booking.adults} required /></label><label>Children<input name="children" type="number" min="0" step="1" defaultValue={booking.children} required /></label><label className={styles.wide}>Special requests<textarea name="special_requests" maxLength={2000} defaultValue={booking.special_requests || ''} /></label>
              </div> : panel.mode === 'cancel' ? <label>Reason for cancellation<textarea name="reason" maxLength={500} placeholder="Cancelled by admin" /></label> : <p>{panel.mode === 'complete' ? 'Confirm that the guest has checked out. The checkout date must have arrived. Completing the stay allows the guest to leave a review.' : 'Payment must have succeeded before a reservation can be approved.'}</p>}
              <div className={styles.actions}><button disabled={busy} type="submit">{busy ? 'Saving…' : panel.mode === 'edit' ? 'Save changes' : 'Confirm'}</button><button disabled={busy} type="button" className={styles.secondary} onClick={() => setPanel(null)}>Keep unchanged</button></div>
            </form>}
          </article>)}
        </div>
      </div>
    </main>
  )
}
