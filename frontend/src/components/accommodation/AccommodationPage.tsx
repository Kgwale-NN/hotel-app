import { roomPhotoByName } from '../../data/roomPhotos'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAccommodationById } from '../../api/accommodations'
import { addFavourite } from '../../api/favourites'
import type { AccommodationDetail } from '../../types/accommodation'
import styles from './AccommodationPage.module.css'
import BookingForm from '../booking/BookingForm'
import ShareAccommodation from './ShareAccommodation'
import AccommodationReviewsSection from '../reviews/AccommodationReviews'
import RoomGallery from './RoomGallery'
import AccountMenuIcon from '../layout/AccountMenuIcon'
import { useAppSelector } from '../../store/hooks'
import AuthModal from '../auth/AuthModal'

export default function AccommodationPage() {
  const { id } = useParams()
  return <RoomDetails key={id} id={id} />
}

function RoomDetails({ id }: { id: string | undefined }) {
  const { user } = useAppSelector(state => state.auth)
  const [accommodation, setAccommodation] = useState<AccommodationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favouriteMessage, setFavouriteMessage] = useState('')
  const [savingFavourite, setSavingFavourite] = useState(false)
  const [saved, setSaved] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [retry, setRetry] = useState(0)

  async function handleSaveFavourite() {
    if (!id || savingFavourite || saved) return
    if (!user) { setAuthOpen(true); return }
    setSavingFavourite(true); setFavouriteMessage('')
    try { await addFavourite(id); setSaved(true); setFavouriteMessage('Added to your favourites.') }
    catch (caught: unknown) { setFavouriteMessage(caught instanceof Error ? caught.message : 'Could not save this room.') }
    finally { setSavingFavourite(false) }
  }

  useEffect(() => {
    let current = true
    window.scrollTo(0, 0)
    if (id) getAccommodationById(id)
      .then(data => { if (current) { setAccommodation(data); setError('') } })
      .catch((caught: unknown) => { if (current) setError(caught instanceof Error ? caught.message : 'Could not load this room.') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [id, retry])

  if (loading || error || !accommodation) return <main className={styles.page}>
    <Link className={styles.backLink} to="/accommodations"><span aria-hidden="true">←</span> Back to rooms</Link>
    <section className={styles.state}><h1>{error ? 'This room is unavailable' : 'Your stay awaits'}</h1>
      <p role={error ? 'alert' : 'status'}>{error || (loading ? 'Loading room details...' : 'Room not found.')}</p>
      {error && <button onClick={() => { setLoading(true); setError(''); setRetry(value => value + 1) }}>Try again</button>}
    </section>
  </main>

  const { hotel } = accommodation
  const photos = accommodation.images.length ? accommodation.images : roomPhotoByName[accommodation.name]
    ? [{ id: 'default', image_url: roomPhotoByName[accommodation.name], alt_text: accommodation.name }] : []
  const nightlyPrice = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 2 }).format(Number(accommodation.price_per_night))
  const policies = hotel.policies && !/placeholder|policies pending/i.test(hotel.policies)
    ? hotel.policies : 'Please contact the hotel for booking and cancellation policies before reserving.'

  return <div className={styles.background}><main className={styles.page}>
    <nav className={styles.topbar} aria-label="Room navigation">
      <Link className={styles.backLink} to="/accommodations"><span aria-hidden="true">←</span> Back to rooms</Link>
      <Link to="/" className={styles.brand}>HOTEL HEAVEN</Link>
      <a className={styles.reserveLink} href="#reserve-room">Reserve this room <span aria-hidden="true">↗</span></a>
    </nav>
    <header className={styles.intro}>
      <div><p className={styles.eyebrow}>{accommodation.room_type.replaceAll('_', ' ')} · {hotel.city}</p><h1>{accommodation.name}</h1><p className={styles.location}>{hotel.name} <span aria-hidden="true">·</span> {hotel.city}, {hotel.country}</p></div>
      <div className={styles.roomActions}>
        <button className={`${styles.favouriteButton} ${saved ? styles.saved : ''}`} type="button" onClick={() => void handleSaveFavourite()} disabled={savingFavourite || saved}><AccountMenuIcon name="saved" />{savingFavourite ? 'Saving...' : saved ? 'Saved' : 'Save room'}</button>
        <ShareAccommodation key={accommodation.id} id={accommodation.id} name={accommodation.name} hotelName={hotel.name} />
      </div>
    </header>
    {favouriteMessage && <p className={styles.notice} role="status">{favouriteMessage}</p>}
    <RoomGallery photos={photos} roomName={accommodation.name} />
    <div className={styles.bodyGrid}>
      <div className={styles.details}>
        <section className={styles.overview} aria-labelledby="room-overview">
          <p className={styles.eyebrow}>MAKE YOURSELF AT HOME</p><h2 id="room-overview">A little space to unwind.</h2>
          <p className={styles.description}>{accommodation.description}</p>
          <ul className={styles.facts} aria-label="Room features">
            <li><AccountMenuIcon name="profile" /><span><strong>{accommodation.capacity} guests</strong><small>Maximum occupancy</small></span></li>
            {accommodation.bed_description && <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 20V5m18 15V9M3 16h18M3 10h18v6M6 10V7h5v3m2 0V7h5v3" /></svg><span><strong>{accommodation.bed_description}</strong><small>Sleeping arrangements</small></span></li>}
            {accommodation.size_sqm && <li><span className={styles.measure} aria-hidden="true">↔</span><span><strong>{Number(accommodation.size_sqm).toLocaleString('en-ZA')} m²</strong><small>Room size</small></span></li>}
            {accommodation.view_type && <li><span className={styles.measure} aria-hidden="true">☼</span><span><strong>{accommodation.view_type} view</strong><small>Your outlook</small></span></li>}
          </ul>
        </section>
        <section className={styles.section} aria-labelledby="room-amenities"><h2 id="room-amenities">Thoughtful comforts</h2><p>Everything included with your room.</p>
          {accommodation.amenities.length ? <ul className={styles.amenities}>{accommodation.amenities.map(amenity => <li key={amenity.id}><span aria-hidden="true">✓</span>{amenity.name}</li>)}</ul> : <p>Ask the hotel about the amenities available for this room.</p>}
        </section>
        <section className={styles.section} aria-labelledby="hotel-information"><h2 id="hotel-information">Your stay at {hotel.name}</h2><p>{hotel.address}, {hotel.city}, {hotel.country}</p>
          {hotel.star_rating !== null && hotel.star_rating > 0 && <p className={styles.starRating}><span aria-hidden="true">{'★'.repeat(hotel.star_rating)}</span> {hotel.star_rating}-star hotel</p>}
          <div className={styles.checkTimes}><div><AccountMenuIcon name="bookings" /><span><small>Check-in from</small><strong>{hotel.check_in_time?.slice(0, 5)}</strong></span></div><div><AccountMenuIcon name="bookings" /><span><small>Check-out by</small><strong>{hotel.check_out_time?.slice(0, 5)}</strong></span></div></div>
        </section>
        <section className={styles.section} aria-labelledby="hotel-policies"><h2 id="hotel-policies">Things to know</h2><p className={styles.policy}>{policies}</p></section>
        {hotel.latitude !== null && hotel.longitude !== null && <section className={styles.section} aria-labelledby="hotel-location"><h2 id="hotel-location">Find us in {hotel.city}</h2><p>{hotel.address}</p><iframe className={styles.map} title={`${hotel.name} location`} src={`https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}&output=embed`} width="100%" height="300" loading="lazy" /><a className={styles.mapLink} href={`https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}`} target="_blank" rel="noreferrer">Open in Google Maps <span aria-hidden="true">↗</span></a></section>}
        <div className={styles.reviews}><AccommodationReviewsSection key={accommodation.id} accommodationId={accommodation.id} /></div>
      </div>
      <aside className={styles.bookingPanel} id="reserve-room" aria-label="Room reservation">
        <div className={styles.bookingPrice}><p className={styles.eyebrow}>YOUR NEXT GETAWAY</p><p><strong>{accommodation.currency} {nightlyPrice}</strong><span> / night</span></p><small>Select your dates to see available rooms.</small></div>
        <BookingForm accommodationId={accommodation.id} />
      </aside>
    </div>
    <footer className={styles.footer}><Link to="/">HOTEL HEAVEN</Link><p>Your time. Your space. Your stay.</p><Link to="/accommodations">Explore more rooms <span aria-hidden="true">↗</span></Link></footer>
  </main>{authOpen && !user && <AuthModal onClose={() => setAuthOpen(false)} />}</div>
}
