import { ArrowUpRight } from 'lucide-react'
import LoadingSkeleton from '../common/LoadingSkeleton'
import EmptyState from '../common/EmptyState'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminBookings, type AdminBooking } from '../../api/adminBookings'
import { inventoryRequest, type InventoryItem } from '../../api/adminInventory'
import { useAppSelector } from '../../store/hooks'
import styles from './AdminUi.module.css'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminDashboard() {
  const user = useAppSelector(state => state.auth.user)
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [rooms, setRooms] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let current = true
    Promise.all([getAdminBookings(), inventoryRequest<InventoryItem[]>('/accommodations')])
      .then(([reservations, accommodations]) => { if (current) { setBookings(reservations); setRooms(accommodations) } })
      .catch((caught: unknown) => { if (current) setError(caught instanceof Error ? caught.message : 'Could not load your dashboard.') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [refresh])

  const stats = [
    { label: 'Reservations', value: bookings.length, detail: 'All booking statuses' },
    { label: 'Pending reservations', value: bookings.filter(item => item.status === 'pending').length, detail: 'Awaiting payment or approval' },
    { label: 'Confirmed stays', value: bookings.filter(item => item.status === 'confirmed').length, detail: 'Confirmed reservations' },
    { label: 'Accommodation types', value: rooms.length, detail: rooms.filter(item => item.is_active).length + ' visible to guests' },
  ]

  return <section className={styles.page}>
    <div className={styles.heading}><div><p className={styles.eyebrow}>YOUR HOTEL AT A GLANCE</p><h1>Welcome, {user?.full_name.split(' ')[0]}.</h1><p className={styles.description}>Manage the essentials and get back to looking after your guests.</p></div><Link className={styles.button} to="/admin/accommodations?new=1">Add accommodation <span aria-hidden="true">+</span></Link></div>
    {error && <div className={styles.error} role="alert">{error} <button className={styles.secondary} onClick={() => { setLoading(true); setError(''); setRefresh(value => value + 1) }}>Try again</button></div>}
    {loading && <LoadingSkeleton label="Loading your hotel overview…" />}
    <div className={styles.stats}>{stats.map(stat => <div className={styles.stat} key={stat.label}><span>{stat.label}</span><strong>{loading || error ? '—' : stat.value}</strong><small>{stat.detail}</small></div>)}</div>
    <section className={styles.panel} aria-labelledby="recent-bookings-title">
      <div className={styles.panelHeading}><h2 id="recent-bookings-title">Recent reservations</h2><Link to="/admin/reservations">View all <span aria-hidden="true"><ArrowUpRight size={18} aria-hidden="true" /></span></Link></div>
      {!loading && !error && !bookings.length && <EmptyState kind="bookings" title="Ready to welcome your first guest.">New records will appear here. If you have applied filters, try clearing them.</EmptyState>}
      {!loading && !error && bookings.length > 0 && <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th scope="col">Guest</th><th scope="col">Room</th><th scope="col">Stay</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead><tbody>{bookings.slice(0, 5).map(booking => <tr key={booking.id}><td>{booking.guest_name || 'Hotel guest'}<small>Ref {booking.id.slice(0, 8)}</small></td><td>{booking.rooms.map(room => room.accommodation_name + ' · ' + room.room_number).join(', ') || 'No room assigned'}</td><td>{formatDate(booking.check_in)}<small>to {formatDate(booking.check_out)}</small></td><td><span className={styles.badge + ' ' + (styles[booking.status] || '')}>{booking.status}</span></td><td><Link to={'/admin/reservations?search=' + encodeURIComponent(booking.id)} aria-label={'Manage reservation for ' + (booking.guest_name || 'hotel guest')}>Manage</Link></td></tr>)}</tbody></table></div>}
    </section>
    <nav className={styles.quickLinks} aria-label="Quick admin actions"><Link className={styles.secondary} to="/admin/notifications">Review payment notifications</Link><Link className={styles.secondary} to="/admin/accommodations">Manage rooms & prices</Link><Link className={styles.secondary} to="/admin/reservations">Manage reservations</Link><Link className={styles.secondary} to="/admin/updates">Create guest update</Link></nav>
  </section>
}
