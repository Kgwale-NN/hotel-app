import { BedDouble, Bell, CalendarDays, Heart, Image, Search, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './PageState.module.css'
const icons = { rooms: BedDouble, notifications: Bell, bookings: CalendarDays, favourites: Heart, photos: Image, search: Search, reviews: Star }
type Props = { title: string; children: ReactNode; kind?: keyof typeof icons; action?: ReactNode }
export default function EmptyState({ title, children, kind = 'rooms', action }: Props) {
  const Icon = icons[kind]
  return <section className={styles.empty}><span className={styles.icon}><Icon aria-hidden="true" size={28} strokeWidth={1.5} /></span><h2>{title}</h2><p>{children}</p>{action && <div className={styles.action}>{action}</div>}</section>
}
