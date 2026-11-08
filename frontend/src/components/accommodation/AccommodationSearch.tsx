import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchAccommodations, type SearchResult } from '../../api/search'
import BackButton from '../layout/BackButton'
import AccommodationCard from './AccommodationCard'
import styles from './AccommodationSearch.module.css'

export default function AccommodationSearch() {
  const [params, setParams] = useSearchParams()
  const [request, setRequest] = useState<{ query: string; result: SearchResult | null; error: string } | null>(null)
  const [validationError, setValidationError] = useState('')
  const query = params.toString()
  const loading = !request || request.query !== query
  const result = loading ? null : request.result
  const error = validationError || (loading ? '' : request.error)

  useEffect(() => {
    const controller = new AbortController()
    const requestParams = new URLSearchParams(query)
    requestParams.set('page_size', '6')
    searchAccommodations(requestParams, controller.signal)
      .then(data => { if (!controller.signal.aborted) setRequest({ query, result: data, error: '' }) })
      .catch((e: unknown) => { if (!controller.signal.aborted) setRequest({ query, result: null, error: e instanceof Error ? e.message : 'Could not load results.' }) })
    return () => controller.abort()
  }, [query])

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError('')
    const form = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const [key, value] of form.entries()) {
      const text = String(value).trim()
      if (text) next.set(key, text)
    }
    const min = next.get('min_price'), max = next.get('max_price')
    if (min && max && Number(min) > Number(max)) { setValidationError('Maximum price must be at least the minimum price.'); return }
    next.set('page', '1')
    setParams(next, { replace: true })
  }

  function changePage(page: number) {
    const next = new URLSearchParams(params)
    next.set('page', String(page))
    setParams(next, { replace: true })
  }

  return <div className={styles.screen}>
    <BackButton />
    <main className={styles.page}>
    <header className={styles.heading}><p className={styles.eyebrow}>YOUR NEXT GETAWAY</p><h1>Find your stay</h1><p>Explore our rooms and suites. Choose a room to check dates and reserve your stay.</p></header>
    <form onSubmit={search} className={styles.filters} key={query}>
      <label>City<input name="city" maxLength={100} defaultValue={params.get('city') || ''} placeholder="e.g. Polokwane" /></label>
      <label>Country<input name="country" maxLength={100} defaultValue={params.get('country') || ''} placeholder="e.g. South Africa" /></label>
      <label>Minimum price (ZAR)<input name="min_price" type="number" min="0" step="0.01" defaultValue={params.get('min_price') || ''} /></label>
      <label>Maximum price (ZAR)<input name="max_price" type="number" min="0" step="0.01" defaultValue={params.get('max_price') || ''} /></label>
      <label>Guests per room<input name="min_capacity" type="number" min="1" step="1" defaultValue={params.get('min_capacity') || ''} /></label>
      <label>Room type<input name="room_type" maxLength={50} defaultValue={params.get('room_type') || ''} placeholder="e.g. suite" /></label>
      <label>View<input name="view_type" maxLength={50} defaultValue={params.get('view_type') || ''} placeholder="e.g. garden" /></label>
      <label>Sort by<select name="sort" defaultValue={params.get('sort') || 'price_asc'}><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="name_asc">Name</option><option value="rating_desc">Highest rated</option></select></label>
      <div className={styles.actions}><button type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search rooms'}</button><button type="button" disabled={loading} onClick={() => { setValidationError(''); setParams({}, { replace: true }) }}>Clear filters</button></div>
    </form>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {loading && <p role="status">Loading rooms…</p>}
    {result && <>
      <p role="status">{result.pagination.total} accommodation{result.pagination.total === 1 ? '' : 's'} found.</p>
      {result.data.length ? <div className={styles.grid}>{result.data.map(item => <AccommodationCard key={item.id} accommodation={item} />)}</div> : <p>No rooms match these filters. Try another price range or location.</p>}
      {result.pagination.total_pages > 1 && <nav className={styles.actions} aria-label="Search result pages"><button disabled={result.pagination.page <= 1} onClick={() => changePage(result.pagination.page - 1)}>Previous</button><span>Page {result.pagination.page} of {result.pagination.total_pages}</span><button disabled={result.pagination.page >= result.pagination.total_pages} onClick={() => changePage(result.pagination.page + 1)}>Next</button></nav>}
    </>}
  </main>
  </div>
}
