import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { authenticateWithEmail } from '../../api/auth'
import { useAppDispatch } from '../../store/hooks'
import { sessionEstablished } from '../../store/authSlice'
import styles from './AuthModal.module.css'

type Props = { onClose: () => void }
export default function AuthModal({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [recoveringPassword, setRecoveringPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const signup = mode === 'signup'

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    const panel = panelRef.current
    if (!dialog || !panel) return

    // Fit the whole form, including validation messages, without a scroll area.
    function fitPopup() {
      if (!dialog || !panel) return
      const viewport = window.visualViewport
      const width = Math.max(1, Math.min(480, (viewport?.width ?? window.innerWidth) - 32))
      const height = (viewport?.height ?? window.innerHeight) - 32
      panel.style.width = (width - 2) + 'px'
      const contentHeight = panel.offsetHeight
      const scale = Math.min(1, Math.max(1, height - 2) / contentHeight)
      panel.style.transform = 'scale(' + scale + ')'
      dialog.style.width = ((width - 2) * scale) + 'px'
      dialog.style.height = (contentHeight * scale) + 'px'
    }

    fitPopup()
    const observer = new ResizeObserver(fitPopup)
    observer.observe(panel)
    window.addEventListener('resize', fitPopup)
    window.visualViewport?.addEventListener('resize', fitPopup)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', fitPopup)
      window.visualViewport?.removeEventListener('resize', fitPopup)
      dialog.close()
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      const user = await authenticateWithEmail(mode, {
        email: email.trim(), password, remember_me: remember,
        ...(signup ? { full_name: name.trim() } : {}),
      })
      dispatch(sessionEstablished(user))
      onClose()
      if (user.role === 'admin') navigate('/admin', { replace: true })
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Could not complete your request. Please try again.')
      setBusy(false)
    }
  }

  function continueWithGoogle() {
    if (busy) return
    setBusy(true); setError('')
    try { sessionStorage.setItem('hotelAuthReturnTo', window.location.pathname + window.location.search + window.location.hash) } catch { /* Sign-in still works when browser storage is unavailable. */ }
    const params = new URLSearchParams()
    if (email.trim()) params.set('login_hint', email.trim())
    window.location.assign(`/api/auth/google${params.size ? `?${params}` : ''}`)
  }

  return createPortal(<dialog ref={dialogRef} className={styles.dialog} aria-labelledby="auth-title" aria-describedby="auth-description" onCancel={event => { event.preventDefault(); if (!busy) onClose() }} onClick={event => {
    if (busy || event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
  }}>
    <div ref={panelRef} className={styles.panel}>
      <button type="button" className={styles.close} aria-label="Close account popup" disabled={busy} onClick={onClose}>×</button>

      <div className={styles.brand}><span aria-hidden="true">✳</span><p>HOTEL HEAVEN</p></div>

      <p className={styles.eyebrow}>{signup ? 'YOUR STAY STARTS HERE' : 'A FAMILIAR WELCOME'}</p>

      <h2 id="auth-title">{recoveringPassword ? 'Forgot your password?' : signup ? 'Make yourself at home.' : 'Welcome back.'}</h2>

      <p id="auth-description" className={styles.description}>{recoveringPassword ? 'Password reset emails are not available yet. If you created your account with Google, use Continue with Google below.' : signup ? 'Create your guest account and keep every stay in one place.' : 'Sign in to your account and pick up where you left off.'}</p>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {!recoveringPassword && <form onSubmit={event => void submit(event)} className={styles.form} aria-busy={busy}>

        {signup && 
        
        <div 
        
        className={styles.field}><label htmlFor="account-name">Full name</label><input id="account-name" name="full_name" autoComplete="name" placeholder="Your full name" maxLength={150} value={name} onChange={event => setName(event.target.value)} required disabled={busy} />
        
        </div>
        
        }

        <div className={styles.field}><label htmlFor="account-email">Email address</label><input id="account-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} required disabled={busy} /></div>
        <div className={styles.field}><label htmlFor="account-password">Password</label><div className={styles.passwordField}><input id="account-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} placeholder={signup ? 'Create a password' : 'Your password'} minLength={signup ? 15 : 1} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} required disabled={busy} /><button type="button" className={styles.passwordToggle} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} disabled={busy}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{!showPassword && <path d="m3 3 18 18" />}</svg></button></div></div>
        <div className={styles.accountOptions}><label className={styles.remember}><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} disabled={busy} />Remember me on this device</label>
          {!signup && <button type="button" className={styles.forgotPassword} disabled={busy} onClick={() => { setRecoveringPassword(true); setPassword(''); setError('') }}>Forgot password?</button>}</div>
        <button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}<span aria-hidden="true">↗</span></button>
      </form>}
      <div className={styles.or}><span />{recoveringPassword ? 'Google account' : 'Or continue with'}<span /></div>
      <button type="button" className={styles.googleButton} disabled={busy} onClick={continueWithGoogle}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z" /><path fill="#34A853" d="M12 22c2.7 0 5-1 6.7-2.4l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z" /><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.4H3a10 10 0 0 0 0 9.2l3.4-2.7Z" /><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.4l3.4 2.7A6 6 0 0 1 12 6Z" /></svg>
        Continue with Google
      </button>
      <p className={styles.switch}>{recoveringPassword ? 'Remember your password?' : signup ? 'Already have an account?' : 'New to Hotel Heaven?'} <button type="button" disabled={busy} onClick={() => { setMode(recoveringPassword || signup ? 'signin' : 'signup'); setRecoveringPassword(false); setPassword(''); setShowPassword(false); setError('') }}>{recoveringPassword || signup ? 'Sign in' : 'Create an account'}</button></p>
    </div>
  </dialog>, document.body)
}
