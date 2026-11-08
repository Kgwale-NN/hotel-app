import { Bell, CalendarDays, Check, CheckCheck, ChevronRight, Megaphone, RefreshCw, Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingSkeleton from '../common/LoadingSkeleton'
import EmptyState from '../common/EmptyState'
import { getNotifications, markAllNotificationsRead, markNotificationRead, type GuestNotification } from '../../api/notifications'
import styles from './NotificationsPage.module.css'

const filters = [{ value: 'all', label: 'All messages' }, { value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' }]
function notificationDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

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
    if (busyId || loading) return
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
    <header className={styles.heading}>
      <div><p className={styles.eyebrow}>{admin ? 'HOTEL UPDATES' : 'YOUR PERSONAL INBOX'}</p><h1>Notifications</h1>
        <p className={styles.intro}>{admin ? 'Reservations to review. Every guest update in one place.' : 'Every stay, every update. All in one place.'}</p></div>
      <div className={styles.inboxIcon} aria-hidden="true"><Bell size={28} strokeWidth={1.4} />{!loading && unreadCount > 0 && <span>{unreadCount}</span>}</div>
    </header>

    <section className={styles.inbox} aria-label="Notification inbox">
      <div className={styles.toolbar}>
        <div className={styles.filters} role="group" aria-label="Filter notifications">{filters.map(item => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}{item.value === 'unread' && !loading && unreadCount > 0 && <span className={styles.count}>{unreadCount}</span>}</button>)}</div>
        <div className={styles.tools}>
          <button className={styles.refresh} type="button" aria-label="Refresh notifications" title="Refresh notifications" disabled={loading || Boolean(busyId)} onClick={() => { setLoading(true); setError(''); setMessage(''); setRefresh(current => current + 1) }}><RefreshCw size={17} className={loading ? styles.spinning : undefined} aria-hidden="true" /></button>
          <button className={styles.markAll} type="button" disabled={loading || Boolean(busyId) || unreadCount === 0} onClick={() => void markRead()}><CheckCheck size={17} aria-hidden="true" />{busyId === 'all' ? 'Updating…' : 'Mark all as read'}</button>
        </div>
      </div>
      {message && <p className={styles.success} role="status"><Check size={16} aria-hidden="true" />{message}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading ? <div className={styles.loading}><LoadingSkeleton label="Loading notifications" count={4} /></div> : <>
        <div className={styles.listHeading}><span>{filter === 'all' ? 'Latest updates' : filter === 'unread' ? 'Unread updates' : 'Read updates'}</span><span role="status">{visible.length} {visible.length === 1 ? 'message' : 'messages'}</span></div>
        {!error && visible.length === 0 && <div className={styles.empty}><EmptyState kind="notifications" title={filter === 'read' ? 'No read messages yet.' : 'You are all caught up.'}>{filter === 'read' ? 'Messages you mark as read will appear here.' : 'Your booking updates and hotel news will appear here.'}</EmptyState></div>}
        <div className={styles.list}>{visible.map(item => {
          const unread = !item.read_at
          const Icon = item.type === 'promotion' ? Megaphone : item.booking_id ? CalendarDays : Bell
          return <article key={item.id} className={`${styles.card} ${unread ? styles.unread : ''}`}>
            <div className={styles.messageIcon} aria-hidden="true"><Icon size={21} strokeWidth={1.5} /></div>
            <div className={styles.messageBody}>
              <div className={styles.meta}><span>{item.type === 'promotion' ? 'Hotel offer' : 'Booking update'}</span><time dateTime={item.created_at}>{notificationDate(item.created_at)}</time></div>
              <h2>{item.title}{unread && <span className={styles.unreadDot}><span className={styles.srOnly}>Unread</span></span>}</h2>
              <p className={styles.message}>{item.message}</p>
              <div className={styles.actions}>{item.booking_id && <Link to={admin ? `/admin/reservations?search=${encodeURIComponent(item.booking_id)}` : `/profile/bookings#booking-${item.booking_id}`}>{admin ? 'Review reservation' : 'View booking'}<ChevronRight size={15} aria-hidden="true" /></Link>}{unread ? <button type="button" disabled={Boolean(busyId)} onClick={() => void markRead(item.id)}><Check size={15} aria-hidden="true" />{busyId === item.id ? 'Updating…' : 'Mark as read'}</button> : <span className={styles.readLabel}><CheckCheck size={14} aria-hidden="true" />Read</span>}</div>
            </div>
          </article>
        })}</div>
      </>}
      <footer className={styles.footer}><span>Showing your latest 100 messages</span>{!admin && <Link to="/profile/settings"><Settings2 size={15} aria-hidden="true" />Notification preferences<ChevronRight size={14} aria-hidden="true" /></Link>}</footer>
    </section>
  </main>
}
