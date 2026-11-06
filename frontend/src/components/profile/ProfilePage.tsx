import { useEffect, useState, type FormEvent } from 'react'
import { getProfile, saveProfile, saveMarketingPreference, signOut, type UserProfile } from '../../api/profile'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [marketing, setMarketing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let current = true
    getProfile().then(user => {
      if (!current) return
      setProfile(user); setName(user.full_name); setPhone(user.phone || ''); setMarketing(user.marketing_opt_in)
    }).catch((e: unknown) => { if (current) setError(e instanceof Error ? e.message : 'Could not load your profile.') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !profile) return
    setBusy(true); setError(''); setMessage('')
    try {
      const updated = await saveProfile(name.trim(), phone.trim() || null)
      setProfile(previous => previous ? { ...previous, ...updated } : previous)
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
      setProfile(previous => previous ? { ...previous, ...updated } : previous)
      setMessage('Your promotion preference has been saved.')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not save your preference.') }
    finally { setBusy(false) }
  }

  async function logout() {
    if (busy) return
    setBusy(true); setError('')
    try { await signOut(); window.location.assign('/') }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not sign out.'); setBusy(false) }
  }

  return <main className={styles.page}>
    <nav className={styles.nav} aria-label="Account navigation"><a href="/">Hotel home</a><a href="/profile" aria-current="page">My profile</a><a href="/profile/bookings">My bookings</a><a href="/profile/favourites">My favourites</a></nav>
    <h1>My profile</h1><p>Manage your personal details and stay in touch.</p>
    {loading && <p role="status">Loading your profile…</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
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
