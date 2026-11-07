import { useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import SiteMenu from './SiteMenu'
import AuthModal from '../auth/AuthModal'
import styles from './SiteHeader.module.css'

function SiteHeader() {
  const { user, status } = useAppSelector(state => state.auth)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const checkingAccount = status === 'idle' || status === 'loading'

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.navbar} aria-label="Main navigation">
          <button
            type="button"
            className={styles.aboutButton}
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
          >
            <span className={styles.menuIcon} aria-hidden="true">
              <span />
              <span />
            </span>
            About us
          </button>

          <a href="/" className={styles.brand} aria-label="Hotel Heaven home">
            <span className={styles.brandMark} aria-hidden="true">✳</span>
            <span className={styles.brandName}>HOTEL HEAVEN</span>
          </a>

          <div className={styles.actions}>
            {checkingAccount ? (
              <span className={styles.accountLink}>Account…</span>
            ) : (
              user ? (
                <a href={user.role === 'admin' ? '/admin' : '/profile'} className={styles.accountLink}>{user.role === 'admin' ? 'Dashboard' : 'My account'}</a>
              ) : (
                <button
                  type="button"
                  className={styles.accountLink}
                  aria-haspopup="dialog"
                  aria-expanded={authOpen}
                  onClick={() => setAuthOpen(true)}
                >
                  Sign up
                </button>
              )
            )}

            <a href="/accommodations" className={styles.bookButton}>
              Book now <span aria-hidden="true">↗</span>
            </a>
          </div>
        </nav>
      </header>

      {menuOpen && <SiteMenu onClose={() => setMenuOpen(false)} />}
      {authOpen && !user && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  )
}

export default SiteHeader