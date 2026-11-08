import type { MyBooking } from '../api/bookings'

// PostgreSQL DATE values may arrive as local-midnight timestamps. Keep hotel calendar days in South Africa.
export function hotelCalendarDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parts = new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value))
  const part = (type: string) => parts.find(item => item.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function formatStayDate(value: string): string {
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(hotelCalendarDate(value) + 'T00:00:00Z'))
}

export function bookingPriceDetails(booking: MyBooking) {
  const checkIn = Date.parse(hotelCalendarDate(booking.check_in) + 'T00:00:00Z')
  const checkOut = Date.parse(hotelCalendarDate(booking.check_out) + 'T00:00:00Z')
  const nights = Math.round((checkOut - checkIn) / 86_400_000)
  const nightlyCents = booking.rooms.reduce((sum, room) => sum + Math.round(Number(room.price_per_night) * 100), 0)
  const feesCents = Math.round(Number(booking.taxes_and_fees) * 100)
  const roomCents = nightlyCents * nights
  const totalCents = roomCents + feesCents
  if (nights < 1 || ![nightlyCents, feesCents, roomCents, totalCents].every(Number.isSafeInteger) || totalCents < 0) throw new Error('Price details are unavailable.')
  return { nights, roomTotal: roomCents / 100, fees: feesCents / 100, total: totalCents / 100 }
}

export function formatBookingMoney(amount: number | string, currency: string): string {
  return `${currency} ${new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount))}`
}
