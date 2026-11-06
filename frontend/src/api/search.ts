import type { AccommodationSummary } from '../types/accommodation'

export type SearchResult = {
  data: AccommodationSummary[]
  pagination: { page: number; page_size: number; total: number; total_pages: number }
}
export async function searchAccommodations(params: URLSearchParams, signal: AbortSignal): Promise<SearchResult> {
  const response = await fetch(`/api/accommodations?${params}`, { signal })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'Could not search accommodations.')
  return result as SearchResult
}
