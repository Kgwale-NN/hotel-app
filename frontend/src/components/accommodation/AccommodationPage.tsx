import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAccommodationById } from '../../api/accommodations'
import type { AccommodationDetail } from '../../types/accommodation'
import gardenRoomPhoto from "../../assets/Garden Room.jpg";
import havenSuitePhoto from "../../assets/Haven Suite.jpg";
import deluxeRoomPhoto from "../../assets/Deluxe Room.jpg";
import familySuitePhoto from "../../assets/Family Suite.jpg";

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
    <main>
      <Link to="/">← Back to rooms</Link>

      <h1>{accommodation.name}</h1>
      <p>{accommodation.description}</p>

      <p>
        {accommodation.currency}{' '}
        {Number(accommodation.price_per_night).toLocaleString('en-ZA')} / night
      </p>
      <p>Up to {accommodation.capacity} guests</p>
      <p>{accommodation.bed_description}</p>

      <section aria-label="Accommodation photos">
        <h2>Photos</h2>
        {accommodation.images.length > 0 ? (
          accommodation.images.map((image) => (
            <img
              key={image.id}
              src={image.image_url}
              alt={image.alt_text || accommodation.name}
              width="300"
            />
          ))
        ) : roomPhotoByName[accommodation.name] ? (
          <img
            src={roomPhotoByName[accommodation.name]}
            alt={`${accommodation.name} room`}
            width="300"
          />
        ) : (
          <p>No photos have been added for this room yet.</p>
        )}
      </section>

      <section>
        <h2>About the hotel</h2>
        <p>{hotel.name}</p>
        <p>{hotel.address}, {hotel.city}, {hotel.country}</p>
        <p>{hotel.star_rating ?? 'No'} star rating</p>
        <p>Check-in: {hotel.check_in_time}</p>
        <p>Check-out: {hotel.check_out_time}</p>
      </section>

      <section>
        <h2>Amenities</h2>
        {accommodation.amenities.length > 0 ? (
          <ul>
            {accommodation.amenities.map((amenity) => (
              <li key={amenity.id}>{amenity.name}</li>
            ))}
          </ul>
        ) : (
          <p>Amenities have not been added yet.</p>
        )}
      </section>

      <section>
        <h2>Hotel policies</h2>
        <p>{hotel.policies}</p>
      </section>

      {hotel.latitude !== null && hotel.longitude !== null && (
        <section>
          <h2>Location</h2>
          <iframe
            title={`${hotel.name} map`}
            src={`https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}&output=embed`}
            width="100%"
            height="350"
            loading="lazy"
          />
        </section>
      )}

      <Link to="/#booking">Book this stay</Link>
    </main>
  )
}

export default AccommodationPage