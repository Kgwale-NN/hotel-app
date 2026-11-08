import BackButton from '../layout/BackButton'
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import styles from './AccountPageLayout.module.css'

export default function AccountPageLayout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return <div className={styles.layout}>
    <BackButton />
    <div className={styles.content}><Outlet /></div>
  </div>
}
