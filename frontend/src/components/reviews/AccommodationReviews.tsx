import { useEffect, useState, type FormEvent } from 'react'
import { getAccommodationReviews, writeReview } from '../../api/reviews'
import type { AccommodationReviews } from '../../types/review'
import styles from './AccommodationReviews.module.css'

export default function AccommodationReviewsSection({ accommodationId }: { accommodationId: string }) {
  const [reviews, setReviews] = useState<AccommodationReviews | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let current = true
    getAccommodationReviews(accommodationId).then(data => { if (current) { setReviews(data); setError('') } })
      .catch((e: unknown) => { if (current) setError(e instanceof Error ? e.message : 'Could not load reviews.') })
    return () => { current = false }
  }, [accommodationId, refresh])

  useEffect(() => {
    let current = true
    async function loadSession() {
      try {
        const response = await fetch('/api/auth/me')
        if (response.status === 401) return
        if (!response.ok) throw new Error('Could not check your sign-in status. Refresh to try again.')
        const result = await response.json()
        if (current) setUserId(result.data.id)
      } catch (e: unknown) { if (current) setError(e instanceof Error ? e.message : 'Could not check your session.') }
      finally { if (current) setSessionLoaded(true) }
    }
    void loadSession()
    return () => { current = false }
  }, [])

  const ownReview = reviews?.reviews.find(review => review.user_id === userId)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !comment.trim()) return
    setBusy(true); setError(''); setMessage('')
    try {
      await writeReview(ownReview ? ownReview.id : accommodationId, ownReview ? 'PATCH' : 'POST', { rating: Number(rating), comment: comment.trim() })
      setEditing(false); setComment(''); setMessage('Your review has been saved.'); setRefresh(value => value + 1)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not save review.') }
    finally { setBusy(false) }
  }

  async function remove() {
    if (!ownReview || busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      await writeReview(ownReview.id, 'DELETE')
      setDeleting(false); setEditing(false); setComment(''); setRating('5')
      setMessage('Your review has been deleted.'); setRefresh(value => value + 1)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not delete review.') }
    finally { setBusy(false) }
  }

  return <section className={styles.section} aria-labelledby="reviews-title">
    <h2 id="reviews-title">Guest reviews</h2>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {message && <p role="status">{message}</p>}
    {!reviews ? <><p role="status">{error ? 'Reviews are unavailable.' : 'Loading reviews…'}</p>{error && <button onClick={() => setRefresh(value => value + 1)}>Retry</button>}</> : <>
      <p>{reviews.count ? `${Number(reviews.average_rating).toFixed(1)} / 5` : 'No rating yet'} · {reviews.count} review{reviews.count === 1 ? '' : 's'}</p>
      {reviews.reviews.length === 0 && <p>No guest reviews yet.</p>}
      {reviews.reviews.map(review => <article className={styles.review} key={review.id}>
        <h3>{review.guest_name}{review.user_id === userId ? ' (you)' : ''}</h3><p>{review.rating} / 5</p><p className={styles.comment}>{review.comment}</p>
        <time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
        {review.user_id === userId && <div className={styles.actions}><button disabled={busy} onClick={() => { setRating(String(review.rating)); setComment(review.comment); setEditing(true); setDeleting(false) }}>Edit my review</button><button disabled={busy} onClick={() => { setDeleting(true); setEditing(false) }}>Delete my review</button></div>}
      </article>)}
      {deleting && <div className={styles.review}><p>Delete your review? This cannot be undone.</p><div className={styles.actions}><button disabled={busy} onClick={() => void remove()}>Confirm deletion</button><button disabled={busy} onClick={() => setDeleting(false)}>Keep review</button></div></div>}
      {sessionLoaded && !userId && <p><a href="/api/auth/google">Sign in</a> to leave a review after a completed stay.</p>}
      {userId && (!ownReview || editing) && <form onSubmit={submit} className={styles.form}>
        <h3>{ownReview ? 'Edit your review' : 'Review your stay'}</h3><p>Reviews are available after completing a stay at this accommodation.</p>
        <label>Rating<select value={rating} onChange={e => setRating(e.target.value)} disabled={busy}>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label>
        <label>Your experience<textarea value={comment} onChange={e => setComment(e.target.value)} maxLength={2000} required disabled={busy} /></label><small>{comment.length} / 2000 characters</small>
        <div className={styles.actions}><button type="submit" disabled={busy || !comment.trim()}>{busy ? 'Saving…' : 'Save review'}</button>{editing && <button type="button" disabled={busy} onClick={() => setEditing(false)}>Cancel editing</button>}</div>
      </form>}
    </>}
  </section>
}
