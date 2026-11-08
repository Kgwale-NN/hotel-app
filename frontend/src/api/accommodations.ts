import type {
  AccommodationDetail,
  AccommodationSummary,
} from '../types/accommodation'

type AccommodationListResponse = {
  data: AccommodationSummary[]
  pagination: { total_pages: number }
}

type AccommodationDetailResponse = {
  data: AccommodationDetail
}

export async function getFeaturedAccommodations(): Promise<
  AccommodationSummary[]
> {
  const rooms: AccommodationSummary[] = []
  let page = 1
  let totalPages: number
  do {
    const response = await fetch(
      '/api/accommodations?page_size=100&sort=name_asc&page=' + page,
    )
    if (!response.ok) throw new Error('Could not load accommodations.')
    const result: AccommodationListResponse = await response.json()
    rooms.push(...result.data)
    totalPages = result.pagination.total_pages
    page += 1
  } while (page <= totalPages)
  return rooms
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