import { ArrowUpRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import styles from './HeroBookingBar.module.css'

export type StaySearch = {
  checkIn: string
  checkOut: string
  rooms: number
  guests: number
}

type Props = {
  onSearch: (stay: StaySearch) => void
}

function HeroBookingBar({ onSearch }: Props) {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')

  const today = new Date()
  const minimumDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (checkOut <= checkIn) {
      const checkoutInput =
        event.currentTarget.querySelector<HTMLInputElement>(
          'input[name="checkOut"]',
        )

      checkoutInput?.setCustomValidity('Check-out must be after check-in.')
      checkoutInput?.reportValidity()
      return
    }

    const form = new FormData(event.currentTarget)

    onSearch({
      checkIn,
      checkOut,
      rooms: Number(form.get('rooms')),
      guests: Number(form.get('guests')),
    })
  }

  return (
    <form
      className={styles.bar}
      onSubmit={handleSubmit}
      aria-label="Find your stay"
    >
      <label className={styles.field}>
        Check-in
        <input
          type="date"
          value={checkIn}
          min={minimumDate}
          onChange={event => {
            const nextDate = event.target.value
            setCheckIn(nextDate)

            if (checkOut && checkOut <= nextDate) {
              setCheckOut('')
            }
          }}
          required
        />
      </label>

      <label className={styles.field}>
        Check-out
        <input
          type="date"
          name="checkOut"
          value={checkOut}
          min={checkIn || minimumDate}
          onChange={event => setCheckOut(event.target.value)}
          onInput={event => event.currentTarget.setCustomValidity('')}
          onInvalid={event => {
            if (checkOut && checkOut <= checkIn) {
              event.currentTarget.setCustomValidity(
                'Check-out must be after check-in.',
              )
            }
          }}
          required
        />
      </label>

      <label className={styles.field}>
        Rooms
        <select name="rooms" defaultValue="1">
          {[1, 2, 3, 4, 5].map(number => (
            <option key={number} value={number}>
              {number} {number === 1 ? 'room' : 'rooms'}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        Guests
        <input
          name="guests"
          type="number"
          min="1"
          max="30"
          step="1"
          defaultValue="2"
          required
        />
      </label>

      <button className={styles.searchButton} type="submit">
        Check availability <span aria-hidden="true"><ArrowUpRight size={18} aria-hidden="true" /></span>
      </button>
    </form>
  )
}

export default HeroBookingBar