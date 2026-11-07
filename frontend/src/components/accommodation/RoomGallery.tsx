import { useState } from 'react'
import styles from './RoomGallery.module.css'

type Photo = { id: string; image_url: string; alt_text: string | null }
type Props = { photos: Photo[]; roomName: string }

export default function RoomGallery({ photos, roomName }: Props) {
  const [active, setActive] = useState(0)
  const photo = photos[active] || photos[0]
  if (!photo) return <div className={styles.empty}>Photos for this room will be available soon.</div>

  return <section className={styles.gallery} aria-label={`${roomName} photo gallery`}>
    <div className={styles.stage}>
      <img className={styles.mainPhoto} src={photo.image_url} alt={photo.alt_text || roomName} fetchPriority="high" />
      {photos.length > 1 && <>
        <button type="button" className={`${styles.arrow} ${styles.previous}`} aria-label="Previous room photo" onClick={() => setActive(index => (index - 1 + photos.length) % photos.length)}>‹</button>
        <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label="Next room photo" onClick={() => setActive(index => (index + 1) % photos.length)}>›</button>
      </>}
      <span className={styles.counter} aria-live="polite" aria-atomic="true">{Math.min(active + 1, photos.length)} / {photos.length}</span>
    </div>
    {photos.length > 1 && <div className={styles.thumbnails} aria-label="Choose a room photo">
      {photos.map((image, index) => <button type="button" key={image.id} aria-label={`Show photo ${index + 1}`} aria-pressed={active === index} className={active === index ? styles.selected : ''} onClick={() => setActive(index)}><img src={image.image_url} alt={image.alt_text || `${roomName}, photo ${index + 1}`} loading="lazy" /></button>)}
    </div>}
  </section>
}
