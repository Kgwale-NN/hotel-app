import { useState } from 'react'
import styles from './SiteHeader.module.css'
import SiteMenu from './SiteMenu'

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.sideLink}
          onClick={() => setMenuOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
        >
          About us
        </button>

        <a href="/" className={styles.brand} aria-label="Hotel home">
          <span className={styles.brandMark} aria-hidden="true">✳</span>
          <span className={styles.brandName}>Hotel Heaven</span>
        </a>

        <a href="#booking" className={styles.sideLink}>
          Book now
        </a>
      </header>

      {menuOpen && <SiteMenu onClose={() => setMenuOpen(false)} />}
    </>
  )
}

export default SiteHeader