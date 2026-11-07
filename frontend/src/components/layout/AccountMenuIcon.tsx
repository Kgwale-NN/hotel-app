export type AccountMenuIconName = 'settings' | 'profile' | 'bookings' | 'saved' | 'notifications' | 'logout'

const paths: Record<AccountMenuIconName, string> = {
  settings: 'M9.5 3 9 5a7 7 0 0 0-2 .9l-1.8-.6-2 3.4 1.4 1.5a7 7 0 0 0 0 2.4l-1.4 1.5 2 3.4 1.8-.6a7 7 0 0 0 2 .9l.5 2h4l.5-2a7 7 0 0 0 2-.9l1.8.6 2-3.4-1.4-1.5a7 7 0 0 0 0-2.4l1.4-1.5-2-3.4-1.8.6a7 7 0 0 0-2-.9l-.5-2h-4ZM14.5 11.4a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  bookings: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2-3v6m10-6v6M3 11h18m-13 5 3 3 5-5',
  saved: 'M6 3h12v18l-6-4-6 4V3Z',
  notifications: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 10h18c0-3-3-3-3-10ZM10 21h4',
  logout: 'M9 3H4v18h5m5-15 6 6-6 6m-7-6h13',
}

export default function AccountMenuIcon({ name }: { name: AccountMenuIconName }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
