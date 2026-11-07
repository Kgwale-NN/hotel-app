import { useState, type FormEvent } from 'react'
import { inventoryRequest } from '../../api/adminInventory'
import styles from './AdminUi.module.css'

export default function AdminUpdates() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setPreview(true)
  }
  async function send() {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await inventoryRequest<{ sent_count: number }>('/promotions', 'POST', { title: title.trim(), message: message.trim() })
      setNotice('Update sent to ' + result.sent_count + ' opted-in account' + (result.sent_count === 1 ? '.' : 's.'))
      setPreview(false); setTitle(''); setMessage('')
    } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : 'Could not send your update.') }
    finally { setBusy(false) }
  }
  return <section className={styles.page}>
    <div className={styles.heading}><div><p className={styles.eyebrow}>KEEP GUESTS INFORMED</p><h1>Guest updates</h1><p className={styles.description}>Send a hotel offer to guests who have chosen to receive promotions.</p></div></div>
    <div className={styles.panel}>
      <h2>{preview ? 'Review your update' : 'New promotional update'}</h2><p>Updates appear in opted-in users’ account inboxes. They are not sent as email or SMS.</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}{notice && <p role="status" className={styles.notice}>{notice}</p>}
      {preview ? <div className={styles.form}><h3>{title}</h3><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message}</p><div className={styles.actions}><button className={styles.button} disabled={busy} onClick={() => void send()}>{busy ? 'Sending…' : 'Send to opted-in accounts'}</button><button className={styles.secondary} disabled={busy} onClick={() => setPreview(false)}>Keep editing</button></div></div> : <form className={styles.form} onSubmit={review}><label>Title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={150} pattern=".*\S.*" required /></label><label>Message<textarea value={message} onChange={event => setMessage(event.target.value)} maxLength={2000} required /></label><small>{message.length} / 2,000 characters</small><div><button className={styles.button} disabled={!title.trim() || !message.trim()}>Review update</button></div></form>}
    </div>
  </section>
}
