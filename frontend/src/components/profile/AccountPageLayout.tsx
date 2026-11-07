import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import styles from './AccountPageLayout.module.css'

export default function AccountPageLayout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return <div className={styles.layout}>
    <Link to="/" className={styles.back} aria-label="Return to hotel home" title="Back to home">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 4-8 8 8 8" /></svg>
    </Link>
    <div className={styles.content}><Outlet /></div>
  </div>
}
