import { useEffect, useState } from 'react'
import { getFeaturedAccommodations } from '../../api/accommodations'
import type { AccommodationSummary } from '../../types/accommodation'
import styles from './RoomHighlights.module.css'
import { Link } from 'react-router-dom'
import deluxeRoomPhoto from '../../assets/Deluxe Room.jpg'
import familySuitePhoto from '../../assets/Family Suite.jpg'
import gardenRoomPhoto from '../../assets/Garden Room.jpg'
import havenSuitePhoto from '../../assets/Haven Suite.jpg'

const roomPhotoByName: Record<string, string> = {
  'Deluxe Room': deluxeRoomPhoto,
  'Family Suite': familySuitePhoto,
  'Garden Room': gardenRoomPhoto,
  'Haven Suite': havenSuitePhoto,
}

function RoomHighlights() {
    const [accommodations, setAccommodations] = useState<
        AccommodationSummary[]
    >([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isCurrent = true

        getFeaturedAccommodations()
            .then((items) => {
                if (isCurrent) setAccommodations(items)
            })
            .catch((caughtError: unknown) => {
                if (!isCurrent) return

                setError(
                    caughtError instanceof Error
                        ? caughtError.message
                        : 'Could not load accommodations.',
                )
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false)
            })

        return () => {
            isCurrent = false
        }
    }, [])

    return (
        <section className={styles.section} id="rooms">
            <p className={styles.eyebrow}>FIND YOUR STAY</p>
            <h2 className={styles.title}>Rooms and suites</h2>

            {isLoading && <p role="status">Loading rooms...</p>}
            {error && <p role="alert">{error}</p>}

            {!isLoading && !error && accommodations.length === 0 && (
                <p>No accommodations are available right now.</p>
            )}

            {!isLoading && accommodations.length > 0 && (
                <div className={styles.grid}>
                    {accommodations.map((accommodation) => (
                        <article className={styles.card} key={accommodation.id}>
                            {accommodation.cover_image || roomPhotoByName[accommodation.name] ? (
                                <img
                                    className={styles.image}
                                    src={accommodation.cover_image || roomPhotoByName[accommodation.name]}
                                    alt={accommodation.name}
                                    loading="lazy"
                                />
                            ) : (
                                <div className={styles.imageFallback}>Photo coming soon</div>
                            )}

                            <div className={styles.cardContent}>
                                <p className={styles.roomType}>{accommodation.room_type}</p>
                                <h3>{accommodation.name}</h3>
                                <p>Up to {accommodation.capacity} guests</p>
                                <p>
                                    {accommodation.currency}{' '}
                                    {Number(accommodation.price_per_night).toLocaleString('en-ZA')}
                                    <span> / night</span>
                                </p>
                                <Link to={`/accommodations/${accommodation.id}`}>View details</Link>              </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}

export default RoomHighlights