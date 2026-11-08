import { ParkingCircle, Flower2, CarTaxiFront, Shirt, Wifi, Coffee, Waves, ShieldCheck, BellRing } from 'lucide-react'
export type AmenityIconName = 'parking' | 'wellness' | 'transfer' | 'laundry' | 'wifi' | 'coffee' | 'pool' | 'security' | 'service'
const icons = { parking: ParkingCircle, wellness: Flower2, transfer: CarTaxiFront, laundry: Shirt, wifi: Wifi, coffee: Coffee, pool: Waves, security: ShieldCheck, service: BellRing }
export default function AmenityIcon({ name }: { name: AmenityIconName }) { const Icon=icons[name]; return <Icon size={38} strokeWidth={1.35} aria-hidden="true" /> }
