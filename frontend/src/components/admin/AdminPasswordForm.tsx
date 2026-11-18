import { useState, type FormEvent } from 'react'
import { setAdminAppPassword } from '../../api/auth'
import { useToast } from '../../store/useToast'
import styles from './AdminUi.module.css'

export default function AdminPasswordForm({ email }: { email: string }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const notify = useToast()
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    if (password !== confirmation) { setError('The new passwords do not match.'); return }
    setBusy(true); setError('')
    try {
      await setAdminAppPassword(password, confirmation, currentPassword)
      setPassword(''); setConfirmation(''); setCurrentPassword('')
      notify('App password saved. You can now sign in with your email and password.')
    } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : 'Could not save your app password.') }
    finally { setBusy(false) }
  }
  return <div className={styles.panel} style={{ marginTop: 24 }}>
    <h2>Hotel-app password</h2>
    <p>Sign in with {email} and a separate app password. Google sign-in will continue to work.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <form className={styles.form} onSubmit={event => void save(event)}>
      <input type="text" name="username" value={email} autoComplete="username" readOnly hidden />
      <label>Current app password<input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} maxLength={128} disabled={busy} /><small>Leave empty only when setting your first app password. This is not your Google password.</small></label>
      <label>New app password<input type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={15} maxLength={128} required disabled={busy} /><small>Use at least 15 characters and choose a different password from your email account.</small></label>
      <label>Confirm app password<input type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} minLength={15} maxLength={128} required disabled={busy} /></label>
      <div><button className={styles.button} disabled={busy}>{busy ? 'Saving...' : 'Save app password'}</button></div>
    </form>
  </div>
}
