import LoadingSkeleton from '../common/LoadingSkeleton'
import EmptyState from '../common/EmptyState'
import { useEffect, useState } from 'react'
import { getNotifications, markAllNotificationsRead, markNotificationRead, type GuestNotification } from '../../api/notifications'
import styles from './NotificationsPage.module.css'

export default function NotificationsPage({ admin = false }: { admin?: boolean }) {
  const [notifications, setNotifications] = useState<GuestNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getNotifications(controller.signal).then(data => { if (!controller.signal.aborted) setNotifications(data) })
      .catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not load notifications.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [refresh])

  async function markRead(id?: string) {
    if (busyId) return
    setBusyId(id || 'all'); setError(''); setMessage('')
    try {
      if (id) {
        const updated = await markNotificationRead(id)
        setNotifications(current => current.map(item => item.id === updated.id ? { ...item, read_at: updated.read_at } : item))
        setMessage('Notification marked as read.')
      } else {
        await markAllNotificationsRead()
        const readAt = new Date().toISOString()
        setNotifications(current => current.map(item => ({ ...item, read_at: item.read_at || readAt })))
        setMessage('All notifications marked as read.')
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not update notifications.') }
    finally { setBusyId(null) }
  }

  const unreadCount = notifications.filter(item => !item.read_at).length
  const visible = notifications.filter(item => filter === 'all' || (filter === 'unread' ? !item.read_at : Boolean(item.read_at)))

  return <main className={styles.page}>
    <h1>Notifications</h1><p>{admin ? "Paid reservations awaiting your review and hotel updates." : "Your booking updates and hotel offers."} Showing your latest 100 messages.</p>
    <div className={styles.toolbar}>
      <label>Show<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All messages</option><option value="unread">Unread</option><option value="read">Read</option></select></label>
      <button disabled={loading || Boolean(busyId)} onClick={() => { setLoading(true); setError(''); setMessage(''); setRefresh(current => current + 1) }}>Refresh</button>
      <button disabled={loading || Boolean(busyId) || unreadCount === 0} onClick={() => void markRead()}>{busyId === 'all' ? 'Updating…' : 'Mark all as read'}</button>
    </div>
    {message && <p className={styles.success} role="status">{message}</p>}
    {error && <p className={styles.error} role="alert">{error} <a href="/api/auth/google">Sign in</a></p>}
    {loading ? <LoadingSkeleton label="Loading notifications" count={5} /> : <>
      <p role="status">{unreadCount} unread in your latest messages.</p>
      {!error && visible.length === 0 && <EmptyState kind="notifications" title="You are all caught up.">Booking updates will appear here. Try another filter to see earlier messages.</EmptyState>}
      <div className={styles.list}>{visible.map(item => <article key={item.id} className={`${styles.card} ${!item.read_at ? styles.unread : ''}`}>
        <div className={styles.meta}><span>{item.type === 'promotion' ? 'Hotel offer' : 'Booking update'}</span><span>{item.read_at ? 'Read' : 'Unread'}</span></div>
        <h2>{item.title}</h2><p className={styles.message}>{item.message}</p>
        <time dateTime={item.created_at}>{new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.created_at))}</time>
        <div className={styles.actions}>{item.booking_id && <a href={admin ? `/admin/reservations?search=${encodeURIComponent(item.booking_id)}` : `/profile/bookings#booking-${item.booking_id}`}>{admin ? "Review reservation" : "View my booking"}</a>}{!item.read_at && <button disabled={Boolean(busyId)} onClick={() => void markRead(item.id)}>{busyId === item.id ? 'Updating…' : 'Mark as read'}</button>}</div>
      </article>)}</div>
    </>}
    {!admin && <p><a href="/profile/settings">Manage promotion preferences</a></p>}
  </main>
}
