import restaurantPhoto from '../../assets/dining-restaurant.jpg'
import mealPhoto from '../../assets/Fine dining food.jpg'
import coffeePhoto from '../../assets/dining-breakfast.jpg'
import styles from './HotelDining.module.css'

export default function HotelDining() {
  return (
    <section className={styles.section} id="dining" aria-labelledby="dining-title">
      <div className={styles.layout}>
        <figure className={styles.mainPhoto}>
          <img src={restaurantPhoto} alt="A warmly lit restaurant with tables set for dining" loading="lazy" decoding="async" width="1000" height="1400" />
          <figcaption>A moment to savour</figcaption>
        </figure>

        <div className={styles.content}>
          <p className={styles.eyebrow}>THE DINING EXPERIENCE</p>
          <h2 id="dining-title">Good food.<br />Great company.<br /><em>Memorable stays.</em></h2>
          <p className={styles.description}>Slow mornings over coffee, conversations around the table, and time to enjoy every bite. Make dining part of your Hotel Heaven escape.</p>
          <details className={styles.details}>
            <summary>More details <span className={styles.plus} aria-hidden="true">+</span></summary>
            <div className={styles.detailsContent}>
              <h3>Make a little time for the table.</h3>
              <p>Speak to reception about dining options, current menus and meal times during your visit.</p>
              <p>Let our team know about allergies or dietary requirements before ordering. Availability and meal charges can be confirmed with the hotel.</p>
            </div>
          </details>
        </div>

        <figure className={styles.coffeePhoto}>
          <img src={coffeePhoto} alt="Fresh coffee and pastries on a breakfast table" loading="lazy" decoding="async" width="500" height="660" />
        </figure>
        <figure className={styles.mealPhoto}>
          <img src={mealPhoto} alt="An elegantly plated meal with steak and colourful vegetables" loading="lazy" decoding="async" width="850" height="540" />
        </figure>
      </div>
    </section>
  )
}
