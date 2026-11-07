import { useEffect, useRef } from 'react'
import AccountMenuIcon from './AccountMenuIcon'
import styles from './LogoutConfirmation.module.css'

type Props = {
  busy: boolean
  error: string
  onCancel: () => void
  onConfirm: () => void
}

export default function LogoutConfirmation({ busy, error, onCancel, onConfirm }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="logout-title" aria-describedby="logout-description" aria-busy={busy} onCancel={event => { event.preventDefault(); if (!busy) onCancel() }} onClick={event => {
    if (event.target !== event.currentTarget || busy) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onCancel()
  }}>
    <button type="button" className={styles.close} aria-label="Cancel logout" disabled={busy} onClick={onCancel}>×</button>
    <div className={styles.icon}><AccountMenuIcon name="logout" /></div>
    <p className={styles.eyebrow}>HOTEL HEAVEN</p>
    <h2 id="logout-title">Ready to log out?</h2>
    <p id="logout-description" className={styles.description}>Are you sure you want to log out of your account? You can sign in again whenever you need.</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {busy && <p className={styles.status} role="status">Logging you out...</p>}
    <div className={styles.actions}>
      <button type="button" className={styles.cancel} disabled={busy} onClick={onCancel} autoFocus>Stay signed in</button>
      <button type="button" className={styles.confirm} disabled={busy} onClick={onConfirm}>{busy ? 'Logging out...' : 'Yes, log out'}</button>
    </div>
  </dialog>
}
