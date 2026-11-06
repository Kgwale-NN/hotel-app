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

        <div className={styles.headerActions}>
          <a href="/profile" className={styles.sideLink}>My profile</a>
          <a href="/admin/reservations" className={styles.sideLink}>Admin</a>
          <a href="/api/auth/google" className={styles.sideLink}>
            Sign in
          </a>
          <a href="#booking" className={styles.sideLink}>
            Book now 
          </a>
        </div>
      </header>

      {menuOpen && <SiteMenu onClose={() => setMenuOpen(false)} />}
    </>
  )
}

export default SiteHeader