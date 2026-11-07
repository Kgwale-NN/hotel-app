import SiteHeader from '../layout/SiteHeader'
import SiteFooter from '../layout/SiteFooter'
import styles from './HomePage.module.css'
import RoomHighlights from './RoomHighlights'
import HotelAmenities from './HotelAmenities'
import HotelDining from './HotelDining'
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
    <>
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
      <HotelAmenities />
      <HotelDining />
    </main>
    <SiteFooter />
    </>
  )
}

export default HomePage