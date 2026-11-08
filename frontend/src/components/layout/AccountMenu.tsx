import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from '../../api/profile'
import { useAppDispatch } from '../../store/hooks'
import { sessionCleared } from '../../store/authSlice'
import LogoutConfirmation from './LogoutConfirmation'
import AccountMenuIcon from './AccountMenuIcon'
import styles from './AccountMenu.module.css'

type Props = { name: string; onClose: () => void }

export default function AccountMenu({ name, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const dispatch = useAppDispatch()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { element?.close(); document.body.style.overflow = previousOverflow }
  }, [])

  async function logout() {
    if (busy) return
    setBusy(true); setError('')
    try { await signOut(); dispatch(sessionCleared()); onClose() }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not sign out.'); setBusy(false) }
  }

  return <>
  <dialog ref={dialog} id="guest-account-menu" className={styles.menu} aria-labelledby="account-menu-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose() } }}>
    <div className={styles.heading}><div><h2 id="account-menu-title">My account</h2><p>{name}</p></div><button type="button" className={styles.close} aria-label="Close account menu" onClick={onClose}><X size={18} aria-hidden="true" /></button></div>
    <nav aria-label="Your account">
      <Link to="/profile/settings" onClick={onClose}><AccountMenuIcon name="settings" /><span>Settings</span></Link>
      <Link to="/profile" onClick={onClose}><AccountMenuIcon name="profile" /><span>Profile</span></Link>
      <Link to="/profile/bookings" onClick={onClose}><AccountMenuIcon name="bookings" /><span>My bookings</span></Link>
      <Link to="/profile/favourites" onClick={onClose}><AccountMenuIcon name="saved" /><span>My favourites</span></Link>
      <Link to="/profile/notifications" onClick={onClose}><AccountMenuIcon name="notifications" /><span>Notifications</span></Link>
    </nav>
    <button type="button" className={styles.signOut} disabled={busy} onClick={() => { setError(''); setConfirmLogout(true) }}><AccountMenuIcon name="logout" /><span>{busy ? 'Logging out...' : 'Log out'}</span></button>
  </dialog>
  {confirmLogout && <LogoutConfirmation busy={busy} error={error} onCancel={() => { if (!busy) setConfirmLogout(false) }} onConfirm={() => void logout()} />}
  </>
}

