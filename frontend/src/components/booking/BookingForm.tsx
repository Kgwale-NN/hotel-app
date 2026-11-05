import styles from './BookingForm.module.css'
import { useState, type FormEvent } from 'react'
import {
    createBooking,
    createBookingPayment,
    getAvailableRooms,
    type AvailableRoom,
} from '../../api/bookings'

type BookingFormProps = {
    accommodationId: string
}

function BookingForm({ accommodationId }: BookingFormProps) {

    const [checkIn, setCheckIn] = useState('')
    const [checkOut, setCheckOut] = useState('')
    const [adults, setAdults] = useState(1)
    const [children, setChildren] = useState(0)
    const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([])
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [selectedRoomId, setSelectedRoomId] = useState('')
    const [bookingLoading, setBookingLoading] = useState(false)
    const [bookingMessage, setBookingMessage] = useState('')

    async function handleSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setMessage('')
        setSelectedRoomId('')

        try {
            const rooms = await getAvailableRooms(accommodationId, checkIn, checkOut)
            const freeRooms = rooms.filter((room) => room.is_available)

            setAvailableRooms(freeRooms)
            setMessage(
                freeRooms.length === 0
                    ? 'No rooms are available for those dates.'
                    : `Found ${freeRooms.length} available room(s).`,
            )
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Could not check room availability.',
            )
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateBooking() {
        if (!selectedRoomId) return

        setBookingLoading(true)
        setBookingMessage('')

        try {
            const booking = await createBooking({
                roomIds: [selectedRoomId],
                checkIn,
                checkOut,
                adults: Number(adults),
                children: Number(children),
            })

            const payment = await createBookingPayment(booking.id)
            window.location.assign(payment.checkout_url)
        } catch (error) {
            setBookingMessage(
                error instanceof Error ? error.message : 'Could not create the reservation.',
            )
        } finally {
            setBookingLoading(false)
        }
    }

    return (
        <section className={styles.bookingForm}>
            <h2>Plan your stay</h2>

            <form onSubmit={handleSearch}>
                <label>
                    Check-in
                    <input type="date" name="checkIn" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required />
                </label>

                <label>
                    Check-out
                    <input type="date" name="checkOut" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required />
                </label>

                <label>
                    Adults
                    <input
                        type="number"
                        name="adults"
                        min="1"
                        value={adults}
                        onChange={(event) => setAdults(Number(event.target.value))}
                        required
                    />
                </label>

                <label>
                    Children
                    <input
                        type="number"
                        name="children"
                        min="0"
                        value={children}
                        onChange={(event) => setChildren(Number(event.target.value))}
                        required
                    />
                </label>

                <button type="submit" disabled={loading}>
                    {loading ? 'Checking…' : 'Check availability'}
                </button>
            </form>

            {message && <p role="status">{message}</p>}

            {availableRooms.map((room) => (
                <label key={room.id}>
                    <input
                        type="radio"
                        name="selectedRoom"
                        value={room.id}
                        checked={selectedRoomId === room.id}
                        onChange={() => setSelectedRoomId(room.id)}
                    />
                    Room {room.room_number} · Up to {room.capacity} guests ·{' '}
                    {room.currency} {room.price_per_night} per night
                </label>
            ))}

            <button
                type="button"
                onClick={handleCreateBooking}
                disabled={!selectedRoomId || bookingLoading}
            >
                {bookingLoading ? 'Creating reservation…' : 'Create reservation'}
            </button>

            {bookingMessage && <p role="status">{bookingMessage}</p>}
        </section>
    )
}

export default BookingForm