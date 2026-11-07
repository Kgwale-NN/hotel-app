import styles from './SiteMenu.module.css'

type SiteMenuProps = {
  onClose: () => void
}

function SiteMenu({ onClose }: SiteMenuProps) {
  return (
    <div
      className={styles.menu}
      role="dialog"
      aria-modal="true"
      aria-label="Hotel menu"
    >
      <button
        className={styles.closeButton}
        type="button"
        onClick={onClose}
      >
        × Close
      </button>

      <a className={styles.brand} href="#home" onClick={onClose}>
        Hotel Heaven
      </a>

   <nav className={styles.columns} aria-label="Main menu">
  <section className={styles.column}>
    <h2>
      <em>Hotel Heaven</em>
      <span>Moods</span>
    </h2>
    <a href="#villeggiatura" onClick={onClose}>Getaway</a>
    <a href="#interiors" onClick={onClose}>Interiors</a>
    <a href="#gardens" onClick={onClose}>Gardens</a>
    <a href="#taste" onClick={onClose}>Taste</a>
    <a href="#pool" onClick={onClose}>Pool</a>
    <a href="#lake" onClick={onClose}>Lake</a>
  </section>

  <section className={styles.column}>
    <h2>
      <span>Inside</span>
      <em>Hotel Heaven</em>
    </h2>
    <a href="/accommodations" onClick={onClose}>Rooms</a>
    <a href="#dining" onClick={onClose}>Dining</a>
    <a href="#spa" onClick={onClose}>Spa</a>
    <a href="#experiences" onClick={onClose}>Experiences</a>
    <a href="#contacts" onClick={onClose}>Contacts</a>
  </section>
</nav>

      <footer className={styles.footer}>
  <p>POLOKWANE · LIMPOPO</p>
  <a href="/accommodations" onClick={onClose}>Book now</a>
</footer>
    </div>
  )
}

export default SiteMenu