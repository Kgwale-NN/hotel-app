import { useEffect, useState, type FormEvent } from 'react'
import { saveProfile, saveMarketingPreference, signOut } from '../../api/profile'
import styles from './ProfilePage.module.css'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { loadSession, profileUpdated, sessionCleared } from '../../store/authSlice'

export default function ProfilePage() {
  const dispatch = useAppDispatch()
  const { user: profile, status, error: sessionError } = useAppSelector(state => state.auth)
  const loading = status === 'loading' || status === 'idle'
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [marketing, setMarketing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (profile) { setName(profile.full_name); setPhone(profile.phone || ''); setMarketing(profile.marketing_opt_in) }
  }, [profile])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !profile) return
    setBusy(true); setError(''); setMessage('')
    try {
      const updated = await saveProfile(name.trim(), phone.trim() || null)
      dispatch(profileUpdated(updated))
      setName(updated.full_name); setPhone(updated.phone || '')
      setMessage('Your personal details have been saved.')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not save your details.') }
    finally { setBusy(false) }
  }

  async function savePreference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      const updated = await saveMarketingPreference(marketing)
      dispatch(profileUpdated(updated))
      setMessage('Your promotion preference has been saved.')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not save your preference.') }
    finally { setBusy(false) }
  }

  async function logout() {
    if (busy) return
    setBusy(true); setError('')
    try { await signOut(); dispatch(sessionCleared()); window.location.assign('/') }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not sign out.'); setBusy(false) }
  }

  return <main className={styles.page}>
    <nav className={styles.nav} aria-label="Account navigation"><a href="/">Hotel home</a><a href="/profile" aria-current="page">My profile</a><a href="/profile/bookings">My bookings</a><a href="/profile/favourites">My favourites</a><a href="/profile/notifications">Notifications</a></nav>
    <h1>My profile</h1><p>Manage your personal details and stay in touch.</p>
    {loading && <p role="status">Loading your profile…</p>}
    {(error || sessionError) && <p role="alert" className={styles.error}>{error || sessionError}</p>}
    {status === 'failed' && <button disabled={busy} onClick={() => void dispatch(loadSession())}>Retry loading profile</button>}
    {message && <p role="status" className={styles.success}>{message}</p>}
    {!loading && !profile && <a href="/api/auth/google">Sign in with Google</a>}
    {profile && <>
      <section className={styles.panel}><h2>Personal details</h2>
        <p>{profile.email}</p>
        <form onSubmit={save}><fieldset disabled={busy}>
          <label>Full name<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} maxLength={150} required /></label>
          <label>Phone number (optional)<input type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} maxLength={30} placeholder="+27…" /></label>
          <button type="submit">{busy ? 'Please wait…' : 'Save personal details'}</button>
        </fieldset></form>
      </section>
      <section className={styles.panel}><h2>Promotions</h2><p>Choose whether to receive hotel offers and promotional notifications. Booking updates are separate.</p>
        <form onSubmit={savePreference}><label className={styles.checkbox}><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} disabled={busy} />Send me hotel promotions and special offers.</label><button disabled={busy} type="submit">Save preference</button></form>
      </section>
      <div className={styles.actions}>{profile.role === 'admin' && <a href="/admin/reservations">Admin reservations</a>}<button type="button" onClick={() => void logout()} disabled={busy}>Sign out</button></div>
    </>}
  </main>
}
