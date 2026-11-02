import SiteHeader from '../layout/SiteHeader'
import styles from './HomePage.module.css'
import HotelIntroduction from './HotelIntroduction'

function HomePage() {
  return (
    <main className={styles.homePage}>
      <section className={styles.hero} id="home">
        <SiteHeader />

        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>A PLACE TO REMEMBER</p>
          <h1>Find your place to slow down.</h1>
          <a className={styles.discoverLink} href="#about">
            Discover the hotel <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

     <HotelIntroduction />

      <section className={styles.booking} id="booking">
        <h2>Ready to plan your stay?</h2>
        <p>Explore our rooms and find the right dates for your visit.</p>
      </section>
    </main>
  )
}

export default HomePage