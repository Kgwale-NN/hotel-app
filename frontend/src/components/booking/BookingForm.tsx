import styles from './BookingForm.module.css'

function BookingForm() {
  return (
    <section className={styles.bookingForm}>
      <h2>Plan your stay</h2>

      <form>
        <label>
          Check-in
          <input type="date" name="checkIn" required />
        </label>

        <label>
          Check-out
          <input type="date" name="checkOut" required />
        </label>

        <label>
          Adults
          <input
            type="number"
            name="adults"
            min="1"
            defaultValue="1"
            required
          />
        </label>

        <label>
          Children
          <input
            type="number"
            name="children"
            min="0"
            defaultValue="0"
            required
          />
        </label>

        <button type="submit">Check availability</button>
      </form>
    </section>
  )
}

export default BookingForm