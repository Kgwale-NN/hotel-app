import { useState, type FormEvent } from 'react'
import { saveMarketingPreference } from '../../api/profile'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { loadSession, profileUpdated } from '../../store/authSlice'
import styles from './ProfilePage.module.css'

export default function SettingsPage() {
  const dispatch = useAppDispatch()
  const { user, status, error: sessionError } = useAppSelector(state => state.auth)
  const [preference, setPreference] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const loading = status === 'idle' || status === 'loading'

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !user) return
    setBusy(true); setError(''); setMessage('')
    try {
      const updated = await saveMarketingPreference(preference ?? user.marketing_opt_in)
      dispatch(profileUpdated(updated)); setPreference(null)
      setMessage('Your settings have been saved.')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not save settings.') }
    finally { setBusy(false) }
  }

  return <main className={styles.page}>
    <h1>Settings</h1><p>Choose how you hear from Hotel Heaven.</p>
    {loading && <p role="status">Loading settings...</p>}
    {(error || sessionError) && <p role="alert" className={styles.error}>{error || sessionError}</p>}
    {status === 'failed' && <button onClick={() => void dispatch(loadSession())}>Retry loading settings</button>}
    {message && <p role="status" className={styles.success}>{message}</p>}
    {!loading && !user && <a href="/">Return home to sign in</a>}
    {user && <section className={styles.panel}><h2>Promotions</h2><p>Receive hotel offers and promotional notifications. Booking updates are sent separately.</p>
      <form onSubmit={save}><fieldset disabled={busy}>
        <label className={styles.checkbox}><input type="checkbox" checked={preference ?? user.marketing_opt_in} onChange={e => setPreference(e.target.checked)} />Send me hotel promotions and special offers.</label>
        <button type="submit">{busy ? 'Saving...' : 'Save settings'}</button>
      </fieldset></form>
    </section>}
  </main>
}
