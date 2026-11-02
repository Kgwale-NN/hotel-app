import type { AccommodationSummary } from '../types/accommodation'

type AccommodationListResponse = {
  data: AccommodationSummary[]
}

export async function getFeaturedAccommodations(): Promise<
  AccommodationSummary[]
> {
  const response = await fetch(
    '/api/accommodations?page_size=3&sort=name_asc',
  )

  if (!response.ok) {
    throw new Error('Could not load accommodations.')
  }

  const result: AccommodationListResponse = await response.json()
  return result.data
}