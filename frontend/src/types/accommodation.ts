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

export type AccommodationDetail = {
  id: string
  name: string
  description: string
  room_type: string
  capacity: number
  bed_description: string
  size_sqm: string | number | null
  view_type: string | null
  price_per_night: string
  currency: string
  hotel: {
    id: string
    name: string
    address: string
    city: string
    country: string
    latitude: string | number | null
    longitude: string | number | null
    star_rating: number | null
    check_in_time: string
    check_out_time: string
    policies: string
  }
  images: {
    id: string
    image_url: string
    alt_text: string | null
    sort_order: number
  }[]
  amenities: {
    id: string
    name: string
  }[]
}