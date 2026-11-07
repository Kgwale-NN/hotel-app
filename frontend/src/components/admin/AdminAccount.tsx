import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { saveProfile, saveMarketingPreference, type UserProfile } from '../../api/profile'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { profileUpdated } from '../../store/authSlice'
import styles from './AdminUi.module.css'

function ProfileForm({ user }: { user: UserProfile }) {
  const dispatch = useAppDispatch()
  const [name, setName] = useState(user.full_name)
  const [phone, setPhone] = useState(user.phone || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const updated = await saveProfile(name.trim(), phone.trim() || null)
      dispatch(profileUpdated(updated)); setNotice('Your profile has been saved.')
    } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : 'Could not save your profile.') }
    finally { setBusy(false) }
  }

  return <section className={styles.page}>
    <div className={styles.heading}><div><p className={styles.eyebrow}>YOUR ACCOUNT</p><h1>My profile</h1><p className={styles.description}>Keep your administrator contact details up to date.</p></div></div>
    <div className={styles.panel}>
      <div className={styles.accountIntro}><span className={styles.avatar}>{user.full_name.charAt(0).toUpperCase()}</span><div><strong>{user.full_name}</strong><small>Administrator · Hotel Heaven</small></div></div>
      {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}
      <form className={styles.form} onSubmit={event => void save(event)}>
        <label>Full name<input value={name} onChange={event => setName(event.target.value)} maxLength={150} autoComplete="name" required disabled={busy} /></label>
        <label>Email address<input type="email" value={user.email} readOnly /><small>Your email is linked to your sign-in account.</small></label>
        <label>Phone number (optional)<input type="tel" value={phone} onChange={event => setPhone(event.target.value)} maxLength={30} autoComplete="tel" placeholder="+27…" disabled={busy} /></label>
        <div className={styles.actions}><button className={styles.button} disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button></div>
      </form>
    </div>
  </section>
}

export function AdminProfile() {
  const user = useAppSelector(state => state.auth.user)
  return user ? <ProfileForm key={user.id} user={user} /> : null
}

function SettingsForm({ user }: { user: UserProfile }) {
  const dispatch = useAppDispatch()
  const [marketing, setMarketing] = useState(user.marketing_opt_in)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try { const updated = await saveMarketingPreference(marketing); dispatch(profileUpdated(updated)); setNotice('Your account preferences have been saved.') }
    catch (caught: unknown) { setError(caught instanceof Error ? caught.message : 'Could not save preferences.') }
    finally { setBusy(false) }
  }
  return <section className={styles.page}>
    <div className={styles.heading}><div><p className={styles.eyebrow}>ACCOUNT PREFERENCES</p><h1>Settings</h1><p className={styles.description}>Manage your own account preferences and access.</p></div></div>
    <div className={styles.panel}><h2>Promotional notifications</h2><p>Choose whether your account receives hotel offers. Reservation updates are separate.</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}{notice && <p role="status" className={styles.notice}>{notice}</p>}
      <form className={styles.form} onSubmit={event => void save(event)}><label className={styles.checkbox}><input type="checkbox" checked={marketing} onChange={event => setMarketing(event.target.checked)} disabled={busy} />Send hotel promotions and special offers to my account.</label><div><button className={styles.button} disabled={busy}>{busy ? 'Saving…' : 'Save preferences'}</button></div></form>
    </div>
    <div className={styles.quickLinks}><Link className={styles.secondary} to="/admin/profile">Edit my profile</Link><Link className={styles.secondary} to="/profile/notifications">View my notifications</Link></div>
  </section>
}

export function AdminSettings() {
  const user = useAppSelector(state => state.auth.user)
  return user ? <SettingsForm key={user.id} user={user} /> : null
}
