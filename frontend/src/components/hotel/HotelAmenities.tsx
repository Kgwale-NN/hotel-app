import AmenityIcon, { type AmenityIconName } from '../common/AmenityIcon'
import styles from './HotelAmenities.module.css'

const amenities: { icon: AmenityIconName; title: string; description: string }[] = [
  { icon: 'parking', title: 'On-site parking', description: 'Arrive, park and settle into your stay with ease.' },
  { icon: 'wellness', title: 'Wellness & relaxation', description: 'Quiet corners and calming spaces to slow down and recharge.' },
  { icon: 'transfer', title: 'Pick-up service', description: 'Speak to our team about arranging your arrival and local transfers.' },
  { icon: 'laundry', title: 'Laundry care', description: 'Ask our team about laundry services during your stay.' },
  { icon: 'wifi', title: 'Stay connected', description: 'Wi-Fi to keep you close to work, family and everything that matters.' },
  { icon: 'coffee', title: 'Morning refreshments', description: 'Ease into your morning with a comforting cup of tea or coffee.' },
  { icon: 'pool', title: 'Outdoor pool', description: 'Take a refreshing dip, unwind and enjoy a little time in the sun.' },
  { icon: 'security', title: 'Peace of mind', description: 'A welcoming setting where your comfort and care come first.' },
  { icon: 'service', title: 'Guest services', description: 'A helping hand with the little details that make your stay your own.' },
]

export default function HotelAmenities() {
  return (
    <section className={styles.section} id="amenities" aria-labelledby="amenities-title">
      <div className={styles.inner}>
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>ELEVATE YOUR STAY</p>
            <h2 id="amenities-title">Thoughtful details.<br /><em>A better stay.</em></h2>
          </div>
        </header>
        <ul className={styles.grid}>
          {amenities.map(amenity => (
            <li className={styles.card} key={amenity.icon}>
              <span className={styles.icon}><AmenityIcon name={amenity.icon} /></span>
              <div>
                <h3>{amenity.title}</h3>
                <p>{amenity.description}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className={styles.note}>For service availability and arrangements, speak to our team before your stay.</p>
      </div>
    </section>
  )
}
