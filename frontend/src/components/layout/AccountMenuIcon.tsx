import { Settings, UserRound, CalendarDays, Heart, Bell, LogOut } from 'lucide-react'
export type AccountMenuIconName = 'settings' | 'profile' | 'bookings' | 'saved' | 'notifications' | 'logout'
const icons = { settings: Settings, profile: UserRound, bookings: CalendarDays, saved: Heart, notifications: Bell, logout: LogOut }
export default function AccountMenuIcon({ name }: { name: AccountMenuIconName }) { const Icon=icons[name]; return <Icon size={20} strokeWidth={1.6} aria-hidden="true" /> }
