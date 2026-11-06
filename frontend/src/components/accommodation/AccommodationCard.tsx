import { roomPhotoByName } from '../../data/roomPhotos'
import { Link } from 'react-router-dom'
import type { AccommodationSummary } from '../../types/accommodation'
import styles from '../hotel/RoomHighlights.module.css'

export default function AccommodationCard({ accommodation }: { accommodation: AccommodationSummary }) {
  const photo = accommodation.cover_image || roomPhotoByName[accommodation.name]
  return <article className={styles.card}>
    {photo ? <img className={styles.image} src={photo} alt={accommodation.name} loading="lazy" /> : <div className={styles.imageFallback}>Photo coming soon</div>}
    <div className={styles.cardContent}>
      <p className={styles.roomType}>{accommodation.room_type}</p><h3>{accommodation.name}</h3>
      <p>{accommodation.hotel_name} · {accommodation.city}, {accommodation.country}</p>
      <p>Up to {accommodation.capacity} guests</p>
      <p>{accommodation.currency} {Number(accommodation.price_per_night).toLocaleString('en-ZA')} / night</p>
      <p>{Number(accommodation.review_count) > 0 ? `${Number(accommodation.average_rating).toFixed(1)} / 5 · ${accommodation.review_count} reviews` : 'No reviews yet'}</p>
      <Link to={`/accommodations/${accommodation.id}`}>View details</Link>
    </div>
  </article>
}
