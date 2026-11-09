import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { removeToast, type Toast } from '../../store/toastSlice'
import styles from './ToastViewport.module.css'

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch()
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const timeout = window.setTimeout(() => dispatch(removeToast(toast.id)), 4000)
    return () => window.clearTimeout(timeout)
  }, [dispatch, toast.id, paused])
  const Icon = toast.tone === 'error' ? CircleAlert : toast.tone === 'info' ? Info : CircleCheck
  return <div className={styles.toast} data-tone={toast.tone}
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false) }}>
    <Icon className={styles.icon} size={21} aria-hidden="true" />
    <p role={toast.tone === 'error' ? 'alert' : 'status'}>{toast.message}</p>
    <button type="button" onClick={() => dispatch(removeToast(toast.id))} aria-label="Dismiss notification"><X size={17} aria-hidden="true" /></button>
  </div>
}

export default function ToastViewport() {
  const toasts = useAppSelector(state => state.toasts)
  return createPortal(<div className={styles.viewport} aria-label="Action notifications">
    {toasts.map(toast => <ToastItem key={toast.id} toast={toast} />)}
  </div>, document.body)
}
