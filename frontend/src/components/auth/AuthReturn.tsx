import { Sparkles } from 'lucide-react'
import LoadingSkeleton from '../common/LoadingSkeleton'
import BackButton from '../layout/BackButton'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { loadSession } from '../../store/authSlice'
import styles from './AuthReturn.module.css'

function returnPath(role: string) {
  let path = '/profile'
  try {
    const saved = sessionStorage.getItem('hotelAuthReturnTo')
    sessionStorage.removeItem('hotelAuthReturnTo')
    if (saved) {
      const url = new URL(saved, window.location.origin)
      if (url.origin === window.location.origin && !url.pathname.startsWith('/auth/') && !url.pathname.startsWith('/api/')) {
        path = url.pathname + url.search + url.hash
      }
    }
  } catch { /* Continue to the profile if storage is unavailable. */ }
  return role === 'admin' ? '/admin' : path
}

export default function AuthReturn() {
  const { user, status, error } = useAppSelector(state => state.auth)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (status === 'ready' && user) navigate(returnPath(user.role), { replace: true })
  }, [user, status, navigate])
  return <main className={styles.page}>
    <div className={styles.card}><p className={styles.brand}><Sparkles size={20} aria-hidden="true" /> HOTEL HEAVEN</p><h1>{status === 'failed' || (status === 'ready' && !user) ? 'Let’s try again.' : 'Welcome to your next stay.'}</h1>
      {status === 'failed' || (status === 'ready' && !user) ? <><p role="alert">{error || 'Your session could not be confirmed. Please sign in again.'}</p><button onClick={() => void dispatch(loadSession())}>Check my account</button><a href="/api/auth/google">Continue with Google</a></> : <LoadingSkeleton count={1} label="Finishing your sign-in" />}
      <BackButton>Go back</BackButton>
    </div>
  </main>
}
