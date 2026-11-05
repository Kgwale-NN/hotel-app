export type FavouriteAccommodation = {
  id: string
  name: string
  room_type: string
  capacity: number
  price_per_night: string
  currency: string
  hotel_name: string
  city: string
  country: string
  cover_image: string | null
}

async function getCsrfToken() {
  const response = await fetch('/api/auth/csrf')

  if (!response.ok) {
    throw new Error('Could not prepare the request.')
  }

  const result: { csrfToken: string } = await response.json()
  return result.csrfToken
}

export async function getMyFavourites(): Promise<FavouriteAccommodation[]> {
  const response = await fetch('/api/favourites')

  if (!response.ok) {
    throw new Error('Could not load your favourites.')
  }

  const result: { data: FavouriteAccommodation[] } = await response.json()
  return result.data
}

export async function addFavourite(accommodationId: string): Promise<void> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(
    `/api/favourites/${encodeURIComponent(accommodationId)}`,
    {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken },
    },
  )

  if (!response.ok) {
    throw new Error('Could not add this accommodation to favourites.')
  }
}

export async function removeFavourite(accommodationId: string): Promise<void> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(
    `/api/favourites/${encodeURIComponent(accommodationId)}`,
    {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    },
  )

  if (!response.ok) {
    throw new Error('Could not remove this accommodation from favourites.')
  }
}