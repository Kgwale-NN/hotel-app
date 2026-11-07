export type AdminIconName = 'dashboard' | 'rooms' | 'bookings' | 'updates' | 'profile' | 'settings' | 'exit'
const paths: Record<AdminIconName, string> = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  rooms: 'M3 20V7m18 13V7M3 16h18M3 10h18v6M6 10V7h5v3m2 0V7h5v3',
  bookings: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2-3v6m10-6v6M3 11h18m-13 5 3 3 5-5',
  updates: 'm3 10 15-6v16L3 14v-4Zm5 6 2 6h3l-2-5m10-9 2-1m-2 8 2 1',
  profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  settings: 'm10 3-1 3-3 1-3-1-1 4 2 2v3l-2 2 2 4 3-1 3 1 1 3h4l1-3 3-1 3 1 2-4-2-2v-3l2-2-2-4-3 1-3-1-1-3h-4Zm6 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  exit: 'M9 3H4v18h5m5-15 6 6-6 6m-7-6h13',
}
export default function AdminIcon({ name }: { name: AdminIconName }) {
  return <svg viewBox="0 0 26 27" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
