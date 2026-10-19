import { useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Click the button to check.')
  const [loading, setLoading] = useState(false)

  async function checkBackend() {
    setLoading(true)
    setMessage('Connecting...')

    try {
      const response = await fetch('/api/health')

      if (!response.ok) {
        throw new Error('The backend returned an error.')
      }

      const data = await response.json()

      setMessage(data.message)
    } catch {
      setMessage('Could not connect. Check that your backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app">
      <h1>Hotel App</h1>

      <p>Our first frontend and backend connection.</p>

      <button
        type="button"
        onClick={checkBackend}
        disabled={loading}
      >
        {loading ? 'Checking...' : 'Check backend'}
      </button>

      <p role="status">{message}</p>
    </main>
  )
}

export default App