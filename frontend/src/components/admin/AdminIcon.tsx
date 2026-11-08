import { LayoutDashboard, BedDouble, CalendarDays, Megaphone, UserRound, Settings, LogOut, Bell } from 'lucide-react'
export type AdminIconName = 'dashboard' | 'rooms' | 'bookings' | 'updates' | 'profile' | 'settings' | 'exit' | 'notifications'
const icons = { dashboard: LayoutDashboard, rooms: BedDouble, bookings: CalendarDays, updates: Megaphone, profile: UserRound, settings: Settings, exit: LogOut, notifications: Bell }
export default function AdminIcon({ name }: { name: AdminIconName }) { const Icon=icons[name]; return <Icon size={22} strokeWidth={1.5} aria-hidden="true" /> }
