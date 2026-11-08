import { useLayoutEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type Visit = { pathname: string }
const storageKey = 'hotelPageHistory'
const visits: Record<number, Visit> = (() => {
  try { return JSON.parse(sessionStorage.getItem(storageKey) || '{}') as Record<number, Visit> }
  catch { return {} }
})()

// Remember router entries so an in-page anchor does not count as another page.
export function usePageHistory() {
  const location = useLocation()
  useLayoutEffect(() => {
    const index: unknown = window.history.state?.idx
    if (typeof index !== 'number') return
    if (location.key === 'default' && index === 0) {
      for (const key of Object.keys(visits)) delete visits[Number(key)]
    }
    visits[index] = { pathname: location.pathname }
    try { sessionStorage.setItem(storageKey, JSON.stringify(visits)) } catch { /* In-memory navigation still works. */ }
  }, [location])
  return null
}

export function useBackNavigation() {
  const navigate = useNavigate()
  return () => {
    const index: unknown = window.history.state?.idx
    if (typeof index === 'number' && index > 0) {
      let target = index - 1
      while (target >= 0 && visits[target]?.pathname === window.location.pathname) target--
      if (target >= 0) { navigate(target - index); return }
    }
    navigate('/', { replace: true })
  }
}
