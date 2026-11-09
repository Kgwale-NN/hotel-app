import { useToast } from '../../store/useToast'
import LoadingSkeleton from '../common/LoadingSkeleton'
import EmptyState from '../common/EmptyState'
import { useState, type FormEvent } from 'react'
import { saveProfile } from '../../api/profile'
import styles from './ProfilePage.module.css'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { loadSession, profileUpdated } from '../../store/authSlice'

export default function ProfilePage() {
  const dispatch = useAppDispatch()
  const { user: profile, status, error: sessionError } = useAppSelector(state => state.auth)
  const loading = status === 'loading' || status === 'idle'
  const [draft, setDraft] = useState<{ name: string; phone: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const notify = useToast()
  const name = draft?.name ?? profile?.full_name ?? ''
  const phone = draft?.phone ?? profile?.phone ?? ''

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !profile) return
    setBusy(true); setError('')
    try {
      const updated = await saveProfile(name.trim(), phone.trim() || null)
      dispatch(profileUpdated(updated)); setDraft(null)
      notify('Your personal details have been saved.')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not save your details.') }
    finally { setBusy(false) }
  }

  return <main className={styles.page}>
    <h1>My profile</h1><p>View and update your personal details.</p>
    {loading && <LoadingSkeleton label="Loading your profile..." count={3} />}
    {(error || sessionError) && <p role="alert" className={styles.error}>{error || sessionError}</p>}
    {status === 'failed' && <button disabled={busy} onClick={() => void dispatch(loadSession())}>Retry loading profile</button>}

    {!loading && !profile && <EmptyState title="Make yourself at home." action={<a href="/">Go home to sign in</a>}>Sign in to manage your personal account.</EmptyState>}
    {profile && <section className={styles.panel}><h2>Personal details</h2>
      <label>Email address<p>{profile.email}</p></label>
      <form onSubmit={save}><fieldset disabled={busy}>
        <label>Full name<input autoComplete="name" value={name} onChange={e => setDraft({ name: e.target.value, phone })} maxLength={150} required /></label>
        <label>Phone number (optional)<input type="tel" autoComplete="tel" value={phone} onChange={e => setDraft({ name, phone: e.target.value })} maxLength={30} placeholder="+27..." /></label>
        <button type="submit">{busy ? 'Saving...' : 'Save personal details'}</button>
      </fieldset></form>
    </section>}
  </main>
}
