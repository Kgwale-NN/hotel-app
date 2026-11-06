export type AccommodationReview = {
  id: string
  user_id: string
  guest_name: string
  rating: number
  comment: string
  created_at: string
  updated_at: string
}

export type AccommodationReviews = {
  count: number
  average_rating: string | null
  reviews: AccommodationReview[]
}