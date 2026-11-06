import { useEffect, useState, type FormEvent } from 'react'
import { inventoryRequest, type InventoryItem, type HotelChoice } from '../../api/adminInventory'
import styles from './AdminAccommodations.module.css'

export default function AdminAccommodations() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [hotels, setHotels] = useState<HotelChoice[]>([])
  const [selected, setSelected] = useState<InventoryItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    Promise.all([inventoryRequest<InventoryItem[]>('/accommodations'), inventoryRequest<HotelChoice[]>('/hotels')])
      .then(([list, choices]) => { if (current) { setItems(list); setHotels(choices) } })
      .catch((e: unknown) => { if (current) setError(e instanceof Error ? e.message : 'Could not load inventory.') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [])

  async function openItem(id: string) {
    setBusy(true); setError(''); setMessage('')
    try {
      setSelected(await inventoryRequest<InventoryItem>(`/accommodations/${id}`))
      setCreating(false)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not open listing.') }
    finally { setBusy(false) }
  }

  async function mutate(path: string, method: string, body?: object, close = false) {
    setBusy(true); setError(''); setMessage('')
    try {
      await inventoryRequest(path, method, body)
      if (close) { setCreating(false); setSelected(null); setDeleteId(null) }
      setMessage('Changes saved successfully.')
      setItems(await inventoryRequest<InventoryItem[]>('/accommodations'))
      if (!close && selected) setSelected(await inventoryRequest<InventoryItem>(`/accommodations/${selected.id}`))
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Could not save changes.') }
    finally { setBusy(false) }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const fields = {
      name: String(data.get('name')).trim(), description: String(data.get('description')).trim(),
      room_type: String(data.get('room_type')).trim(), bed_description: String(data.get('bed_description')).trim(),
      capacity: Number(data.get('capacity')), price_per_night: String(data.get('price_per_night')),
    }
    void mutate(creating ? '/accommodations' : `/accommodations/${selected!.id}`, creating ? 'POST' : 'PATCH', creating ? { ...fields, hotel_id: data.get('hotel_id'), currency: 'ZAR' } : fields, true)
  }

  const visible = items.filter(item => `${item.name} ${item.hotel_name}`.toLowerCase().includes(search.toLowerCase()))
  return <main className={styles.page}>
    <nav className={styles.nav} aria-label="Admin navigation"><a href="/">Hotel home</a><a href="/admin/reservations">Reservations</a><a href="/admin/accommodations" aria-current="page">Accommodations</a></nav>
    <div className={styles.heading}><div><p>HOTEL ADMINISTRATION</p><h1>Accommodations</h1></div><button disabled={busy} onClick={() => { setSelected(null); setCreating(true); setError(''); setMessage('') }}>Add accommodation</button></div>
    <p>Manage listings, nightly prices and physical room availability.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {message && <p role="status" className={styles.success}>{message}</p>}
    {(creating || selected) && <section className={styles.panel} aria-label="Accommodation editor">
      <h2>{creating ? 'New accommodation' : `Edit ${selected!.name}`}</h2>
      <form key={creating ? 'new' : selected!.id} onSubmit={save}>
        <fieldset disabled={busy} className={styles.grid}>
          {creating && <label>Hotel<select name="hotel_id" required><option value="">Choose a hotel</option>{hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>}
          <label>Name<input name="name" maxLength={150} defaultValue={selected?.name || ''} required /></label>
          <label>Room type<input name="room_type" maxLength={50} defaultValue={selected?.room_type || ''} placeholder="double, deluxe, suite…" required /></label>
          <label>Guest capacity<input name="capacity" type="number" min={1} max={32767} step={1} defaultValue={selected?.capacity || 1} required /></label>
          <label>Price per night (ZAR)<input name="price_per_night" type="number" min="0" max="9999999999.99" step="0.01" defaultValue={selected?.price_per_night || ''} required /></label>
          <label>Bed description<input name="bed_description" maxLength={150} defaultValue={selected?.bed_description || ''} required /></label>
          <label className={styles.wide}>Description<textarea name="description" maxLength={10000} defaultValue={selected?.description || ''} required /></label>
        </fieldset>
        <div className={styles.actions}><button disabled={busy || (creating && !hotels.length)}>{busy ? 'Saving…' : 'Save accommodation'}</button><button type="button" disabled={busy} onClick={() => { setSelected(null); setCreating(false) }}>Close editor</button></div>
      </form>
      {selected && <section className={styles.rooms}><h3>Physical rooms</h3><p>Deactivate a room to stop new bookings. Existing reservations are preserved.</p>
        {selected.rooms.length === 0 && <p>No physical rooms yet. Add one below to make this listing bookable.</p>}
        {selected.rooms.map(room => <form key={`${room.id}-${room.room_number}`} className={styles.roomRow} onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void mutate(`/rooms/${room.id}`, 'PATCH', { room_number: data.get('room_number') }) }}>
          <label>Room number<input name="room_number" defaultValue={room.room_number} maxLength={20} pattern="[A-Za-z0-9-]{1,20}" required disabled={busy} /></label><span>{room.is_active ? 'Active' : 'Inactive'}</span><button disabled={busy}>Rename</button><button type="button" disabled={busy} onClick={() => void mutate(`/rooms/${room.id}`, 'PATCH', { is_active: !room.is_active })}>{room.is_active ? 'Deactivate' : 'Activate'}</button>
        </form>)}
        <form className={styles.roomRow} onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void mutate(`/accommodations/${selected.id}/rooms`, 'POST', { room_number: data.get('room_number') }) }}><label>New room number<input name="room_number" pattern="[A-Za-z0-9-]{1,20}" maxLength={20} required disabled={busy} /></label><button disabled={busy}>Add room</button></form>
      </section>}
    </section>}
    <label className={styles.search}>Search listings<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Accommodation or hotel name" /></label>
    {loading ? <p role="status">Loading accommodations…</p> : <p>{visible.length} listing(s)</p>}
    <div className={styles.list}>{visible.map(item => <article key={item.id} className={styles.panel}>
      <div className={styles.heading}><div><h2>{item.name}</h2><p>{item.hotel_name} · {item.room_type}</p></div><strong>{item.is_active ? 'Visible' : 'Hidden'}</strong></div>
      <p>Up to {item.capacity} guests · {item.total_rooms} physical rooms · {item.currency} {Number(item.price_per_night).toLocaleString('en-ZA')} / night</p>
      <div className={styles.actions}><button disabled={busy} onClick={() => void openItem(item.id)}>Edit listing & rooms</button><button disabled={busy} onClick={() => void mutate(`/accommodations/${item.id}`, 'PATCH', { is_active: !item.is_active })}>{item.is_active ? 'Hide listing' : 'Restore listing'}</button><button disabled={busy} onClick={() => setDeleteId(item.id)}>Delete</button></div>
      {deleteId === item.id && <div className={styles.confirm}><p>Delete {item.name}? This cannot be undone. Listings with booking or review history must be hidden instead.</p><div className={styles.actions}><button disabled={busy} onClick={() => void mutate(`/accommodations/${item.id}`, 'DELETE', undefined, true)}>Confirm deletion</button><button disabled={busy} onClick={() => setDeleteId(null)}>Keep listing</button></div></div>}
    </article>)}</div>
    {!loading && !visible.length && <p>No accommodations found.</p>}
  </main>
}
