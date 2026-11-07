import { useEffect, useRef, useState, type FormEvent } from 'react'
import { deleteRoomPhoto, getRoomPhotos, makeRoomPhotoCover, uploadRoomPhoto, type RoomPhoto } from '../../api/adminPhotos'
import { roomPhotoByName } from '../../data/roomPhotos'
import styles from './AdminPhotoManager.module.css'

type Props = {
  accommodationId: string
  accommodationName: string
  disabled: boolean
  onBusyChange: (busy: boolean) => void
}

export default function AdminPhotoManager({ accommodationId, accommodationName, disabled, onBusyChange }: Props) {
  const [photos, setPhotos] = useState<RoomPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [description, setDescription] = useState(accommodationName)
  const [cover, setCover] = useState(true)
  const [replacement, setReplacement] = useState<string>()
  const [removing, setRemoving] = useState<string>()
  const fileInput = useRef<HTMLInputElement>(null)
  const locked = disabled || busy || loading

  useEffect(() => {
    let current = true
    getRoomPhotos(accommodationId).then(data => { if (current) setPhotos(data) })
      .catch((e: unknown) => { if (current) setError(e instanceof Error ? e.message : 'Could not load photos.') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [accommodationId])

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  async function change(action: () => Promise<unknown>, success: string) {
    if (locked) return
    setBusy(true); onBusyChange(true); setError(''); setMessage('')
    try {
      await action()
      setMessage(success)
      setFile(null); setPreview(''); setReplacement(undefined); setRemoving(undefined)
      if (fileInput.current) fileInput.current.value = ''
      setPhotos(await getRoomPhotos(accommodationId))
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not update photos.') }
    finally { setBusy(false); onBusyChange(false) }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) { setError('Choose a photo first.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Choose a photo smaller than 5 MB.'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Choose a JPG, PNG or WebP photo.'); return }
    void change(() => uploadRoomPhoto(accommodationId, file, description.trim(), cover, replacement), replacement ? 'Room photo replaced.' : 'Room photo added.')
  }

  return <section className={styles.manager} aria-labelledby="room-photos-heading">
    <h3 id="room-photos-heading">Room photos</h3>
    <p>Add photos or replace an existing one. The main photo appears on room cards; all photos appear on the room details page.</p>
    {loading && <p role="status">Loading photos...</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {message && <p role="status" className={styles.success}>{message}</p>}
    <div className={styles.gallery}>
      {photos.map((photo, index) => <article key={photo.id} className={styles.card}>
        <img src={photo.image_url} alt={photo.alt_text || accommodationName} />
        <div className={styles.caption}><strong>{index === 0 ? 'Main photo' : `Photo ${index + 1}`}</strong><p>{photo.alt_text}</p>
          <div className={styles.actions}>
            <button type="button" disabled={locked} onClick={() => { setReplacement(photo.id); setDescription(photo.alt_text || accommodationName); setCover(index === 0); setFile(null); setPreview(''); if (fileInput.current) { fileInput.current.value = ''; fileInput.current.click() } }}>Replace photo</button>
            {index !== 0 && <button type="button" disabled={locked} onClick={() => void change(() => makeRoomPhotoCover(photo.id), 'Main room photo updated.')}>Use as main</button>}
            <button type="button" className={styles.secondary} disabled={locked} onClick={() => setRemoving(photo.id)}>Remove</button>
          </div>
          {removing === photo.id && <div className={styles.confirm}><p>Remove this photo?</p><div className={styles.actions}><button type="button" disabled={locked} onClick={() => void change(() => deleteRoomPhoto(photo.id), 'Room photo removed.')}>Yes, remove</button><button type="button" className={styles.secondary} disabled={locked} onClick={() => setRemoving(undefined)}>Keep photo</button></div></div>}
        </div>
      </article>)}
      {!loading && !photos.length && roomPhotoByName[accommodationName] && <article className={styles.card}><img src={roomPhotoByName[accommodationName]} alt={accommodationName} /><div className={styles.caption}>Default room photo. Upload a new main photo below to replace it.</div></article>}
    </div>
    <form onSubmit={submit} className={styles.upload}>
      <fieldset disabled={locked}>
        <legend>{replacement ? 'Replace selected photo' : 'Add a room photo'}</legend>
        <label>Choose photo<input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { const selectedFile = event.target.files?.[0] || null; setFile(selectedFile); setPreview(selectedFile ? URL.createObjectURL(selectedFile) : ''); setError('') }} required /></label>
        <p className={styles.hint}>JPG, PNG or WebP, up to 5 MB.</p>
        {file && preview && <img className={styles.preview} src={preview} alt="Selected photo preview" />}
        <label>Photo description<input value={description} onChange={event => setDescription(event.target.value)} maxLength={250} required /></label>
        <label className={styles.checkbox}><input type="checkbox" checked={cover} onChange={event => setCover(event.target.checked)} />Use as the main room photo</label>
        <div className={styles.actions}><button disabled={!file || locked}>{busy ? 'Saving photo...' : replacement ? 'Save replacement photo' : 'Upload photo'}</button>
          {replacement && <button type="button" className={styles.secondary} onClick={() => { setReplacement(undefined); setFile(null); setPreview(''); setCover(true); if (fileInput.current) fileInput.current.value = '' }}>Cancel replacement</button>}
        </div>
      </fieldset>
    </form>
  </section>
}
