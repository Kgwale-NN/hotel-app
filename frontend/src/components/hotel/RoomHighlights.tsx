import { roomPhotoByName } from '../../data/roomPhotos'
import { useEffect, useRef, useState } from 'react'
import { getFeaturedAccommodations } from '../../api/accommodations'
import type { AccommodationSummary } from '../../types/accommodation'
import styles from './RoomHighlights.module.css'
import { Link } from 'react-router-dom'


function RoomHighlights() {
    const trackRef = useRef<HTMLDivElement>(null)
    const [canGoBack, setCanGoBack] = useState(false)
    const [canGoForward, setCanGoForward] = useState(false)

    function updateControls() {
        const track = trackRef.current
        if (!track) return
        setCanGoBack(track.scrollLeft > 2)
        setCanGoForward(track.scrollLeft + track.clientWidth < track.scrollWidth - 2)
    }

    function moveRooms(direction: number) {
        const track = trackRef.current
        if (!track) return
        const card = track.firstElementChild as HTMLElement | null
        if (!card) return
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: reducedMotion ? 'instant' : 'smooth' })
    }

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

    useEffect(() => {
        const track = trackRef.current
        if (!track) return
        const observer = new ResizeObserver(updateControls)
        observer.observe(track)
        updateControls()
        return () => observer.disconnect()
    }, [accommodations, isLoading])

    return (
        <section className={styles.section} id="rooms" aria-labelledby="room-highlights-title">
            <p className={styles.eyebrow}>FIND YOUR STAY</p>
            <h2 id="room-highlights-title" className={styles.title}>Rooms and suites</h2>
            <div className={styles.toolbar}>
                <Link className={styles.allRooms} to="/accommodations">Search all rooms <span aria-hidden="true">↗</span></Link>
                <div className={styles.controls} aria-label="Room carousel controls">
                    <button type="button" onClick={() => moveRooms(-1)} disabled={!canGoBack} aria-label="Previous rooms" aria-controls="room-carousel">←</button>
                    <button type="button" onClick={() => moveRooms(1)} disabled={!canGoForward} aria-label="Next rooms" aria-controls="room-carousel">→</button>
                </div>
            </div>

            {isLoading && <p role="status">Loading rooms...</p>}
            {error && <p role="alert">{error}</p>}

            {!isLoading && !error && accommodations.length === 0 && (
                <p>No accommodations are available right now.</p>
            )}

            {!isLoading && accommodations.length > 0 && (
                <div ref={trackRef} id="room-carousel" className={styles.grid} onScroll={updateControls} role="region" aria-label="Rooms and suites carousel" tabIndex={0}>
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