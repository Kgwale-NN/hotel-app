import type { AccommodationReviews } from '../types/review'

export async function getAccommodationReviews(
  accommodationId: string,
): Promise<AccommodationReviews> {
  const response = await fetch(
    `/api/reviews/accommodation/${encodeURIComponent(accommodationId)}`,
  )

  const result: { data?: AccommodationReviews; message?: string } =
    await response.json()

  if (!response.ok || !result.data) {
    throw new Error(result.message ?? 'Could not load reviews.')
  }

  return result.data
}
export async function writeReview(path: string, method: 'POST' | 'PATCH' | 'DELETE', input?: { rating: number; comment: string }): Promise<void> {
  const csrfResponse = await fetch('/api/auth/csrf')
  if (!csrfResponse.ok) throw new Error('Please sign in before managing reviews.')
  const { csrfToken } = await csrfResponse.json()
  const response = await fetch(`/api/reviews/${encodeURIComponent(path)}`, {
    method, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: input ? JSON.stringify(input) : undefined,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'Could not save your review.')
}
