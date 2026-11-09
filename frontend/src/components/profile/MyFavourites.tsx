import { useToast } from '../../store/useToast'
import { ArrowUpRight } from 'lucide-react'
import LoadingSkeleton from '../common/LoadingSkeleton'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyFavourites, removeFavourite, type FavouriteAccommodation } from '../../api/favourites'
import { roomPhotoByName } from '../../data/roomPhotos'
import AccountMenuIcon from '../layout/AccountMenuIcon'
import styles from './MyFavourites.module.css'

type CardProps = {
  item: FavouriteAccommodation
  removingId: string
  onRemove: (id: string, name: string) => void
}

function FavouriteCard({ item, removingId, onRemove }: CardProps) {
  const fallback = roomPhotoByName[item.name] || ''
  const [photo, setPhoto] = useState(item.cover_image || fallback)
  const detailsUrl = `/accommodations/${encodeURIComponent(item.id)}`

  return <article className={styles.card} aria-labelledby={`favourite-${item.id}`}>
    <div className={styles.photoArea}>
      <Link to={detailsUrl} className={styles.photoLink} aria-label={`View ${item.name}`}>
        {photo ? <img className={styles.photo} src={photo} alt={item.name} loading="lazy" onError={() => setPhoto(photo !== fallback ? fallback : '')} /> : <div className={styles.noPhoto}><AccountMenuIcon name="saved" /><span>{item.name}</span></div>}
      </Link>
      <span className={styles.savedBadge}>Saved for later</span>
      <button type="button" className={styles.heart} aria-label={`Remove ${item.name} from favourites`} disabled={Boolean(removingId)} onClick={() => onRemove(item.id, item.name)} title="Remove from favourites">
        <AccountMenuIcon name="saved" />
      </button>
    </div>
    <div className={styles.cardBody}>
      <p className={styles.roomType}>{item.room_type.replaceAll('_', ' ')}</p>
      <h2 id={`favourite-${item.id}`}><Link to={detailsUrl}>{item.name}</Link></h2>
      <p className={styles.hotel}>{item.hotel_name}</p>
      <p className={styles.location}><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>{item.city}, {item.country}</p>
      <p className={styles.capacity}><AccountMenuIcon name="profile" />Up to {item.capacity} {item.capacity === 1 ? 'guest' : 'guests'}</p>
      <div className={styles.cardBottom}>
        <p className={styles.price}><strong>{item.currency} {Number(item.price_per_night).toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</strong><span>per night</span></p>
        <Link to={detailsUrl} className={styles.detailsLink}>View details <span aria-hidden="true"><ArrowUpRight size={18} aria-hidden="true" /></span></Link>
      </div>
      {removingId === item.id && <p className={styles.removing} role="status">Removing from favourites...</p>}
    </div>
  </article>
}

export default function MyFavourites() {
  const [favourites, setFavourites] = useState<FavouriteAccommodation[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [removingId, setRemovingId] = useState('')
  const notify = useToast()
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let current = true
    getMyFavourites()
      .then(data => { if (current) setFavourites(data) })
      .catch((error: unknown) => { if (current) setLoadError(error instanceof Error ? error.message : 'Could not load your favourites.') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [retry])

  async function handleRemove(id: string, name: string) {
    if (removingId) return
    setRemovingId(id); setActionError('')
    try {
      await removeFavourite(id)
      setFavourites(current => current.filter(item => item.id !== id))
      notify(`${name} removed from your favourites.`)
    } catch (error: unknown) { setActionError(error instanceof Error ? error.message : 'Could not remove this room. Please try again.') }
    finally { setRemovingId('') }
  }

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>YOUR PERSONAL COLLECTION</p><h1>My favourites</h1><p className={styles.subtitle}>A little inspiration for your next getaway. Keep the rooms you love in one place.</p></div>
      <Link to="/accommodations" className={styles.explore}>Explore rooms <span aria-hidden="true"><ArrowUpRight size={18} aria-hidden="true" /></span></Link>
    </header>
    {actionError && <p role="alert" className={styles.error}>{actionError}</p>}

    {loading ? <LoadingSkeleton cards label="Loading your saved rooms" count={2} /> : loadError ? <section className={styles.empty} aria-labelledby="favourites-error"><span className={styles.emptyIcon}><AccountMenuIcon name="saved" /></span><h2 id="favourites-error">Your collection is taking a moment.</h2><p role="alert">{loadError}</p><button type="button" className={styles.primary} onClick={() => { setLoading(true); setLoadError(''); setRetry(value => value + 1) }}>Try again</button></section> : favourites.length === 0 ? <section className={styles.empty} aria-labelledby="favourites-empty"><span className={styles.emptyIcon}><AccountMenuIcon name="saved" /></span><h2 id="favourites-empty">Save a room you love.</h2><p>Tap the heart on a room to keep it here for your next stay.</p><Link to="/accommodations" className={styles.primary}>Find your next stay <span aria-hidden="true"><ArrowUpRight size={18} aria-hidden="true" /></span></Link></section> : <>
      <div className={styles.collectionBar}><p className={styles.count}>{favourites.length} saved {favourites.length === 1 ? 'room' : 'rooms'}</p><p className={styles.tip}>Tap a heart to remove a room.</p></div>
      <div className={styles.grid}>{favourites.map(item => <FavouriteCard key={item.id} item={item} removingId={removingId} onRemove={(id, name) => void handleRemove(id, name)} />)}</div>
    </>}
  </main>
}
