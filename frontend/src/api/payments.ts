export type PaymentVerification = { payment_status: string; booking_status?: string }
export async function verifyPayment(reference: string, signal?: AbortSignal): Promise<PaymentVerification> {
  const csrfResponse = await fetch('/api/auth/csrf', { signal })
  if (!csrfResponse.ok) throw new Error('Please sign in with the account used to make this booking, then check again.')
  const { csrfToken } = await csrfResponse.json()
  const response = await fetch('/api/payments/verify', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ reference }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'Could not verify your payment. Check again before starting another payment.')
  return result.data as PaymentVerification
}
