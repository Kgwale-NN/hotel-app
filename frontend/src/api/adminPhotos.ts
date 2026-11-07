import { inventoryRequest } from './adminInventory'

export type RoomPhoto = {
  id: string
  accommodation_id: string
  image_url: string
  alt_text: string
  sort_order: number
}

export const getRoomPhotos = (id: string) =>
  inventoryRequest<RoomPhoto[]>(`/accommodations/${encodeURIComponent(id)}/images`)

export const makeRoomPhotoCover = (id: string) =>
  inventoryRequest<RoomPhoto>(`/images/${encodeURIComponent(id)}`, 'PATCH', { make_cover: true })

export const deleteRoomPhoto = (id: string) =>
  inventoryRequest<void>(`/images/${encodeURIComponent(id)}`, 'DELETE')

export async function uploadRoomPhoto(id: string, file: File, description: string, cover: boolean, replacement?: string): Promise<RoomPhoto> {
  const csrf = await fetch('/api/auth/csrf')
  if (!csrf.ok) throw new Error('Please sign in with your administrator account.')
  const { csrfToken } = await csrf.json()
  const body = new FormData()
  body.append('photo', file)
  body.append('alt_text', description)
  body.append('make_cover', String(cover))
  if (replacement) body.append('replace_image_id', replacement)
  const response = await fetch(`/api/admin/accommodations/${encodeURIComponent(id)}/images/upload`, {
    method: 'POST', headers: { 'X-CSRF-Token': csrfToken }, body,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'Could not upload this photo.')
  return result.data
}
