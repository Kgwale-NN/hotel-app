import { useState } from 'react'
import styles from './SiteHeader.module.css'
import SiteMenu from './SiteMenu'
import { useAppSelector } from '../../store/hooks'

function SiteHeader() {
  const { user, status } = useAppSelector(state => state.auth)
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
          {user && <a href="/profile" className={styles.sideLink}>My profile</a>}
          {user?.role === 'admin' && <a href="/admin/reservations" className={styles.sideLink}>Admin</a>}
          {!user && status !== 'loading' && <a href="/api/auth/google" className={styles.sideLink}>Sign in</a>}
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