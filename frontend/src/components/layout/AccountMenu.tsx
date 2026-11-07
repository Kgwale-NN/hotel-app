import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from '../../api/profile'
import { useAppDispatch } from '../../store/hooks'
import { sessionCleared } from '../../store/authSlice'
import styles from './AccountMenu.module.css'

type Props = { name: string; onClose: () => void }

export default function AccountMenu({ name, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const dispatch = useAppDispatch()
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

  return <dialog ref={dialog} id="guest-account-menu" className={styles.menu} aria-labelledby="account-menu-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose() } }}>
    <div className={styles.heading}><div><p>WELCOME BACK</p><h2 id="account-menu-title">{name}</h2></div><button type="button" className={styles.close} aria-label="Close account menu" onClick={onClose}>×</button></div>
    <nav aria-label="Your account">
      <Link to="/profile" onClick={onClose}>My profile <span aria-hidden="true">↗</span></Link>
      <Link to="/profile/bookings" onClick={onClose}>My bookings <span aria-hidden="true">↗</span></Link>
      <Link to="/profile/favourites" onClick={onClose}>My favourites <span aria-hidden="true">↗</span></Link>
      <Link to="/profile/notifications" onClick={onClose}>Notifications <span aria-hidden="true">↗</span></Link>
    </nav>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <button type="button" className={styles.signOut} disabled={busy} onClick={() => void logout()}>{busy ? 'Signing out...' : 'Sign out'}</button>
  </dialog>
}
