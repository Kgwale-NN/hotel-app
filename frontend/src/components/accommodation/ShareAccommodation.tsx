import { useToast } from '../../store/useToast'
import { useState } from 'react'
import styles from './ShareAccommodation.module.css'

type Props = { id: string; name: string; hotelName: string }
export default function ShareAccommodation({ id, name, hotelName }: Props) {
  const [busy, setBusy] = useState(false)
  const notify = useToast()
  const [message, setMessage] = useState('')
  const [showLink, setShowLink] = useState(false)
  const url = new URL(`/accommodations/${encodeURIComponent(id)}`, window.location.origin).href

  async function copyLink() {
    if (busy) return
    setBusy(true); setMessage('')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(url)
      notify('Accommodation link copied.'); setShowLink(false)
    } catch {
      setShowLink(true)
      setMessage('Select the link below and copy it to share this accommodation.')
    } finally { setBusy(false) }
  }

  async function share() {
    if (busy) return
    if (!navigator.share) { await copyLink(); return }
    setBusy(true); setMessage('')
    try {
      await navigator.share({ title: `${name} | ${hotelName}`, text: `Take a look at ${name} at ${hotelName}.`, url })
      notify('Sharing completed.')
    } catch (error: unknown) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setShowLink(true); setMessage('Device sharing is unavailable. Copy the link below instead.')
      }
    } finally { setBusy(false) }
  }

  return <div className={styles.share}>
    <div className={styles.actions}><button type="button" disabled={busy} onClick={() => void share()}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7" /></svg>Share</button><button type="button" disabled={busy} onClick={() => void copyLink()}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M15 8V4H4v11h4" /></svg>Copy link</button></div>
    {message && <p role="status">{message}</p>}
    {showLink && <label>Accommodation link<input type="url" readOnly value={url} onFocus={event => event.currentTarget.select()} onClick={event => event.currentTarget.select()} /></label>}
  </div>
}
