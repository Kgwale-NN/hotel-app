import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAccommodationById } from '../../api/accommodations'
import type { AccommodationDetail } from '../../types/accommodation'
import gardenRoomPhoto from "../../assets/Garden Room.jpg";
import havenSuitePhoto from "../../assets/Haven Suite.jpg";
import deluxeRoomPhoto from "../../assets/Deluxe Room.jpg";
import familySuitePhoto from "../../assets/Family Suite.jpg";
import styles from './AccommodationPage.module.css'

const roomPhotoByName: Record<string, string> = {
  'Deluxe Room': deluxeRoomPhoto,
  'Garden Room': gardenRoomPhoto,
  'Haven Suite': havenSuitePhoto,
  'Family Suite': familySuitePhoto,
}

function AccommodationPage() {
  const { id } = useParams()
  const [accommodation, setAccommodation] =
    useState<AccommodationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    if (!id) {
      setError('Accommodation ID is missing.')
      setLoading(false)
      return
    }

    getAccommodationById(id)
      .then((data) => {
        if (isCurrent) setAccommodation(data)
      })
      .catch((caughtError: unknown) => {
        if (isCurrent) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Could not load accommodation details.',
          )
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [id])

  if (loading) return <p role="status">Loading accommodation...</p>
  if (error) return <p role="alert">{error}</p>
  if (!accommodation) return <p>Accommodation not found.</p>

  const { hotel } = accommodation

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} to="/">← Back to rooms</Link>

      <h1 className={styles.title}>{accommodation.name}</h1>
      <p className={styles.description}>{accommodation.description}</p>

      <div className={styles.stayFacts} aria-label="Room details">
        <p className={styles.price}>
          {accommodation.currency}{' '}
          {Number(accommodation.price_per_night).toLocaleString('en-ZA')}
          <span> / night</span>
        </p>
        <p>Up to {accommodation.capacity} guests</p>
        <p>{accommodation.bed_description}</p>
      </div>

      <section className={styles.photos} aria-label="Accommodation photos">
        <h2>Photos</h2>
        <div className={styles.photoGrid}>
          {accommodation.images.length > 0 ? (
            accommodation.images.map((image) => (
              <img
                className={styles.photo}
                key={image.id}
                src={image.image_url}
                alt={image.alt_text || accommodation.name}
                width="300"
              />
            ))
          ) : roomPhotoByName[accommodation.name] ? (
            <img
              className={styles.photo}
              src={roomPhotoByName[accommodation.name]}
              alt={`${accommodation.name} room`}
              width="300"
            />
          ) : (
            <p>No photos have been added for this room yet.</p>
          )}
        </div>
      </section>

      <section className={styles.hotelSection}>
        <h2>About the hotel</h2>
        <div className={styles.hotelDetails}>
          <p className={styles.hotelName}>{hotel.name}</p>
          <p>{hotel.address}, {hotel.city}, {hotel.country}</p>
          <p>{hotel.star_rating ? `${hotel.star_rating} star rating` : 'Rating not yet available'}</p>
          <div className={styles.checkTimes}>
            <p><span>Check-in</span>{hotel.check_in_time}</p>
            <p><span>Check-out</span>{hotel.check_out_time}</p>
          </div>
        </div>
      </section>

      <section className={styles.amenitiesSection}>
        <h2>Amenities</h2>
        {accommodation.amenities.length > 0 ? (
          <ul className={styles.amenitiesList}>
            {accommodation.amenities.map((amenity) => (
              <li key={amenity.id}>{amenity.name}</li>
            ))}
          </ul>
        ) : (
          <p>Amenities have not been added yet.</p>
        )}
      </section>

      <section className={styles.policiesSection}>
        <h2>Hotel policies</h2>
        <p>{hotel.policies}</p>
      </section>

      {hotel.latitude !== null && hotel.longitude !== null && (
        <section className={styles.locationSection}>
          <h2>Location</h2>
          <iframe
            className={styles.map}
            title={`${hotel.name} map`}
            src={`https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}&output=embed`}
            width="100%"
            height="350"
            loading="lazy"
          />
        </section>
      )}

      <div className={styles.bookingBar}>
        <p><strong>{accommodation.currency} {Number(accommodation.price_per_night).toLocaleString('en-ZA')}</strong> / night</p>
        <Link className={styles.bookingLink} to="/#booking">Book this stay</Link>
      </div>
    </main>
  )
}

export default AccommodationPage