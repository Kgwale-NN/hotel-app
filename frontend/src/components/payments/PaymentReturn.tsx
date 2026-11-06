import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { verifyPayment, type PaymentVerification } from '../../api/payments'
import styles from '../profile/ProfilePage.module.css'

export default function PaymentReturn() {
  const [params] = useSearchParams()
  const reference = params.get('reference') || params.get('trxref') || ''
  const [result, setResult] = useState<PaymentVerification | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!reference) return
    const controller = new AbortController()
    setLoading(true); setError(''); setResult(null)
    verifyPayment(reference, controller.signal)
      .then(data => { if (!controller.signal.aborted) setResult(data) })
      .catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not verify your payment.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [reference, attempt])

  const paid = result?.payment_status === 'succeeded'
  const confirmed = paid && ['confirmed', 'completed'].includes(result?.booking_status || '')
  const failed = result && ['failed', 'abandoned', 'reversed'].includes(result.payment_status)
  return <main className={styles.page}>
    <nav className={styles.nav}><a href="/">Hotel home</a><a href="/profile/bookings">My bookings</a></nav>
    <h1>{loading ? 'Checking your payment' : confirmed ? 'Booking confirmed' : paid ? 'Payment received' : failed ? 'Payment not completed' : 'Payment status'}</h1>
    {!reference && <p role="alert">No payment reference was supplied. Open My bookings to continue your reservation.</p>}
    {loading && <p role="status">Please wait while we verify your payment securely.</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {result && <section className={styles.panel}>
      <p role="status">{confirmed ? 'Your payment was received and your reservation is confirmed.' : paid ? 'Your payment was received, but your reservation could not be confirmed. Please contact the hotel before making another payment.' : failed ? 'This payment was not completed. Open My bookings to resume payment for your existing reservation.' : 'Your payment is still awaiting confirmation. Check again before making another payment.'}</p>
      <p>Payment: {result.payment_status}</p>{result.booking_status && <p>Reservation: {result.booking_status}</p>}
    </section>}
    {reference && <p style={{ overflowWrap: 'anywhere' }}>Payment reference: {reference}</p>}
    <div className={styles.actions}>{reference && !confirmed && <button disabled={loading} onClick={() => setAttempt(value => value + 1)}>Check payment again</button>}<a href="/profile/bookings">View my bookings</a>{error && <a href="/api/auth/google" target="_blank" rel="noopener noreferrer">Sign in in a new tab</a>}</div>
  </main>
}
