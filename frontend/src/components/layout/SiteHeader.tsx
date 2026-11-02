import styles from './SiteHeader.module.css'

function SiteHeader() {
  return (
    <header className={styles.header}>
      <a href="#about" className={styles.sideLink}>
        About us
      </a>

      <a href="/" className={styles.brand} aria-label="Hotel home">
        <span className={styles.brandMark} aria-hidden="true">✳</span>
        <span className={styles.brandName}>YOUR HOTEL</span>
      </a>

      <a href="#booking" className={styles.sideLink}>
        Book now
      </a>
    </header>
  )
}

export default SiteHeader