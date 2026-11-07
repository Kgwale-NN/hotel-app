import { useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import SiteMenu from './SiteMenu'
import AccountMenu from './AccountMenu'
import AuthModal from '../auth/AuthModal'
import styles from './SiteHeader.module.css'

function SiteHeader() {
  const { user, status } = useAppSelector(state => state.auth)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const signedInGuest = Boolean(user && user.role !== 'admin')
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
              signedInGuest ? (
                <a href="/accommodations" className={styles.bookButton}>Book now <span aria-hidden="true">↗</span></a>
              ) : user ? (
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

            {signedInGuest && !checkingAccount ? (
              <button type="button" className={styles.accountMenuButton} onClick={() => setAccountMenuOpen(true)} aria-label="Open account menu" aria-haspopup="dialog" aria-expanded={accountMenuOpen} aria-controls={accountMenuOpen ? 'guest-account-menu' : undefined}>
                <span className={styles.accountMenuIcon} aria-hidden="true"><span /><span /><span /></span>
              </button>
            ) : (
              <a href="/accommodations" className={styles.bookButton}>
                Book now <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </nav>
      </header>

      {menuOpen && <SiteMenu onClose={() => setMenuOpen(false)} />}
      {accountMenuOpen && signedInGuest && user && <AccountMenu name={user.full_name} onClose={() => setAccountMenuOpen(false)} />}
      {authOpen && !user && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  )
}

export default SiteHeader