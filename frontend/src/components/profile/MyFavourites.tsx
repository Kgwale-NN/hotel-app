import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {getMyFavourites,removeFavourite,type FavouriteAccommodation,} from '../../api/favourites'

function MyFavourites() {
    const [favourites, setFavourites] = useState<FavouriteAccommodation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [removingId, setRemovingId] = useState('')

    useEffect(() => {
        let isCurrent = true

        getMyFavourites()
            .then((data) => {
                if (isCurrent) setFavourites(data)
            })
            .catch((err: unknown) => {
                if (isCurrent) {
                    setError(
                        err instanceof Error ? err.message : 'Could not load your favourites.',
                    )
                }
            })
            .finally(() => {
                if (isCurrent) setLoading(false)
            })

        return () => {
            isCurrent = false
        }
    }, [])

    async function handleRemove(id: string) {
        setRemovingId(id)
        setError('')

        try {
            await removeFavourite(id)
            setFavourites((current) => current.filter((item) => item.id !== id))
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Could not remove this accommodation from favourites.',
            )
        } finally {
            setRemovingId('')
        }
    }

    if (loading) return <main><p>Loading your favourites…</p></main>

    return (
        <main>
            <h1>My favourites</h1>

            {error && <p role="alert">{error}</p>}

            {favourites.length === 0 ? (
                <p>You haven’t saved any accommodations yet.</p>
            ) : (
                <div>
                    {favourites.map((item) => (
                        <article key={item.id}>
                            {item.cover_image && (
                                <img src={item.cover_image} alt={item.name} />
                            )}

                            <h2>{item.name}</h2>
                            <p>{item.hotel_name} · {item.city}, {item.country}</p>
                            <p>Up to {item.capacity} guests</p>
                            <p>{item.currency} {item.price_per_night} per night</p>

                            <Link to={`/accommodations/${item.id}`}>View details</Link>{' '}
                            <button
                                type="button"
                                onClick={() => handleRemove(item.id)}
                                disabled={Boolean(removingId)}
                            >
                                {removingId === item.id ? 'Removing…' : 'Remove'}
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </main>
    )
}

export default MyFavourites