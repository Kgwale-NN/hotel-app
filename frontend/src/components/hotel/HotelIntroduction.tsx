import styles from './HotelIntroduction.module.css'

function HotelIntroduction() {
  return (
    <section className={styles.introduction} id="about">
      <p className={styles.eyebrow}>WELCOME</p>
      <h2>A place to pause, reconnect, and feel at home.</h2>
      <p className={styles.description}>
        Discover a welcoming place to rest, explore, and make your stay
        memorable.
      </p>
    </section>
  )
}

export default HotelIntroduction