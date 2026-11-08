import LoadingSkeleton from '../common/LoadingSkeleton'
import SiteHeader from '../layout/SiteHeader'
import SiteFooter from '../layout/SiteFooter'
import styles from './HomePage.module.css'
import RoomHighlights from './RoomHighlights'
import HotelAmenities from './HotelAmenities'
import HotelDining from './HotelDining'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import HeroBookingBar, { type StaySearch } from '../booking/HeroBookingBar'

function HomePage() {

  const navigate = useNavigate()
  const { user, status } = useAppSelector(state => state.auth)

  function handleStaySearch(stay: StaySearch) {
    const params = new URLSearchParams({
      check_in: stay.checkIn,
      check_out: stay.checkOut,
      rooms: String(stay.rooms),
      guests: String(stay.guests),
    })

    navigate(`/accommodations?${params}`)
  }

  if (status === 'idle' || status === 'loading') return <main className={styles.homePage}><section style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}><LoadingSkeleton label="Opening the hotel" /></section></main>
  if (user?.role === 'admin') return <Navigate to="/admin" replace />

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