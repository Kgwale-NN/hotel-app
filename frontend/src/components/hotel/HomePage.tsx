import SiteHeader from '../layout/SiteHeader'
import styles from './HomePage.module.css'
import HotelIntroduction from './HotelIntroduction'
import HotelStory from './HotelStory'
import RoomHighlights from './RoomHighlights'
import { useNavigate } from 'react-router-dom'
import HeroBookingBar, { type StaySearch } from '../booking/HeroBookingBar'

function HomePage() {

  const navigate = useNavigate()

  function handleStaySearch(stay: StaySearch) {
    const params = new URLSearchParams({
      check_in: stay.checkIn,
      check_out: stay.checkOut,
      rooms: String(stay.rooms),
      guests: String(stay.guests),
    })

    navigate(`/accommodations?${params}`)
  }

  return (
    <main className={styles.homePage}>
<section className={styles.hero} id="home">
  <SiteHeader />

  <div className={styles.heroContent}>
    <p className={styles.eyebrow}>A PLACE TO REMEMBER</p>
    <h1>Find your place to slow down.</h1>
  </div>

  <div className={styles.heroBooking}>
    <HeroBookingBar onSearch={handleStaySearch} />
  </div>
</section>

      <RoomHighlights />
      <HotelIntroduction />
      <HotelStory />

      <section className={styles.booking} id="booking">
        <h2>Ready to plan your stay?</h2>
        <p>Explore our rooms and find the right dates for your visit.</p>
      </section>
    </main>
  )
}

export default HomePage