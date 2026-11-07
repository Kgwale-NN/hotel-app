import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { loadSession, sessionCleared } from '../../store/authSlice'
import { signOut } from '../../api/profile'
import AuthModal from '../auth/AuthModal'
import AdminIcon, { type AdminIconName } from './AdminIcon'
import styles from './AdminLayout.module.css'

const links: { to: string; title: string; icon: AdminIconName }[] = [
  { to: '/admin', title: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/accommodations', title: 'Accommodations', icon: 'rooms' },
  { to: '/admin/reservations', title: 'Reservations', icon: 'bookings' },
  { to: '/admin/updates', title: 'Guest updates', icon: 'updates' },
  { to: '/admin/profile', title: 'My profile', icon: 'profile' },
  { to: '/admin/settings', title: 'Settings', icon: 'settings' },
]

export default function AdminLayout() {
  const { user, status, error } = useAppSelector(state => state.auth)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const sidebarRef = useRef<HTMLDialogElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!menuOpen || !isAdmin || !sidebar) return
    const previousOverflow = document.body.style.overflow
    const menuButton = menuButtonRef.current
    sidebar.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      sidebar.close()
      document.body.style.overflow = previousOverflow
      menuButton?.focus()
    }
  }, [menuOpen, isAdmin])

  async function logout() {
    if (signingOut) return
    setSigningOut(true); setSignOutError('')
    try { await signOut(); dispatch(sessionCleared()); navigate('/') }
    catch (caught: unknown) { setSignOutError(caught instanceof Error ? caught.message : 'Could not sign out.'); setSigningOut(false) }
  }

  if (status === 'loading' || status === 'idle') return <main className={styles.gate}><div><p role="status">Opening your admin workspace…</p></div></main>
  if (status === 'failed') return <main className={styles.gate}><div><h1>Could not check your account</h1><p role="alert">{error}</p><button onClick={() => void dispatch(loadSession())}>Try again</button><Link to="/">Back to hotel</Link></div></main>
  if (!user || user.role !== 'admin') return <main className={styles.gate}><div><p className={styles.eyebrow}>HOTEL HEAVEN</p><h1>Administration</h1><p>{user ? 'This area is available to hotel administrators.' : 'Sign in with your administrator account to manage the hotel.'}</p>{!user && <button onClick={() => setAuthOpen(true)}>Sign in</button>}<Link to="/">Back to hotel</Link></div>{authOpen && !user && <AuthModal onClose={() => setAuthOpen(false)} />}</main>

  const title = links.find(link => link.to === location.pathname)?.title || 'Administration'
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#admin-content">Skip to content</a>
      <dialog ref={sidebarRef} className={styles.sidebar} id="admin-sidebar" aria-labelledby="admin-menu-title" onCancel={event => { event.preventDefault(); setMenuOpen(false) }} onClick={event => {
        if (event.target !== event.currentTarget) return
        const rect = event.currentTarget.getBoundingClientRect()
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setMenuOpen(false)
      }}>
        <div className={styles.sidebarHeading}>
          <Link to="/admin" onClick={() => setMenuOpen(false)} className={styles.brand}><span aria-hidden="true">✳</span><span id="admin-menu-title">HOTEL HEAVEN<small>ADMINISTRATION</small></span></Link>
          <button className={styles.closeMenu} type="button" aria-label="Close admin sidebar" onClick={() => setMenuOpen(false)}>×</button>
        </div>
        <div className={styles.navigation}>
          <p className={styles.navLabel}>YOUR WORKSPACE</p>
          <nav aria-label="Admin navigation">
            {links.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/admin'} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? styles.activeLink : styles.navLink}><AdminIcon name={link.icon} />{link.title}</NavLink>)}
          </nav>
          <div className={styles.sidebarBottom}>
            <div className={styles.identity}><span className={styles.avatar}>{user.full_name.charAt(0).toUpperCase()}</span><div><strong>{user.full_name}</strong><small>Administrator</small></div></div>
            <button className={styles.signOut} onClick={() => void logout()} disabled={signingOut}><AdminIcon name="exit" />{signingOut ? 'Signing out…' : 'Sign out'}</button>
            {signOutError && <p className={styles.error} role="alert">{signOutError}</p>}
          </div>
        </div>
      </dialog>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.menuArea}>
            <button ref={menuButtonRef} className={styles.menuToggle} type="button" aria-label="Open admin sidebar" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="admin-sidebar" onClick={() => setMenuOpen(true)}><span /><span /><span /></button>
            <span className={styles.pageLabel}>{title}</span>
          </div>
          <Link to="/admin" className={styles.topBrand}><span aria-hidden="true">✳</span><span>HOTEL HEAVEN<small>ADMINISTRATION</small></span></Link>
          <Link className={styles.profileLink} to="/admin/profile" aria-label="Open your admin profile"><span>My profile</span><span className={styles.avatar}>{user.full_name.charAt(0).toUpperCase()}</span></Link>
        </header>
        <main id="admin-content" className={styles.main} tabIndex={-1}><Outlet /></main>
      </div>
    </div>
  )
}
