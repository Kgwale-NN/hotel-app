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