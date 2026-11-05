import type {
  AccommodationDetail,
  AccommodationSummary,
} from '../types/accommodation'

type AccommodationListResponse = {
  data: AccommodationSummary[]
}

type AccommodationDetailResponse = {
  data: AccommodationDetail
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

export async function getAccommodationById(
  id: string,
): Promise<AccommodationDetail> {
  const response = await fetch(`/api/accommodations/${encodeURIComponent(id)}`)

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new Error(
      errorBody?.message ?? 'Could not load accommodation details.',
    )
  }

  const result: AccommodationDetailResponse = await response.json()
  return result.data
}