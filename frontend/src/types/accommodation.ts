export type AccommodationSummary = {

  id: string
  name: string
  description: string | null
  room_type: string
  capacity: number
  bed_description: string | null
  size_sqm: number | string | null
  view_type: string | null
  price_per_night: string
  currency: string
  hotel_name: string
  city: string
  country: string
  average_rating: number | string
  review_count: number
cover_image: string | null

}