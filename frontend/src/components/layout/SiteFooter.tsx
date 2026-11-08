import { Sparkles, ArrowUpRight, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './SiteFooter.module.css'

const information = {
  privacy: {
    title: 'Your privacy',
    paragraphs: [
      'Hotel Heaven uses your account and booking details to manage your stays, payments and guest notifications. You can edit your personal details and promotion preference in My account.',
      'Google handles Google sign-in and Paystack handles online checkout. The app uses a session cookie to keep you signed in. Please speak to the hotel team about questions concerning your personal information.',
    ],
  },
  terms: {
    title: 'Planning your stay',
    paragraphs: [
      'Check your dates, guest numbers, room selection and price before creating a reservation. Complete payment before the deadline shown in your booking details.',
      'You can manage your reservations in My bookings. Pending bookings may be cancelled online when payment is not in progress. For a paid reservation or other changes, contact the hotel team to discuss your options.',
    ],
  },
  help: {
    title: 'Booking help',
    paragraphs: [
      'Choose Rooms and suites to explore accommodation, check dates and create your reservation. Sign in to view your bookings, saved rooms and notifications.',
      'If checkout is interrupted, check My bookings before making another reservation. Your payment and booking status will help you decide the next step. For personal assistance, speak to reception at Hotel Heaven.',
    ],
  },
}
type InformationKey = keyof typeof information

export default function SiteFooter() {
  const [openInfo, setOpenInfo] = useState<InformationKey | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const shareUrl = encodeURIComponent(window.location.origin + '/')

  useEffect(() => {
    if (!openInfo) return
    const dialog = dialogRef.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    dialog?.showModal()
    closeButtonRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [openInfo])

  return (
    <footer className={styles.footer} id="contacts">
      <div className={styles.shell}>
        <div className={styles.columns}>
          <section className={styles.about} id="about" aria-label="About Hotel Heaven">
            <a className={styles.brand} href="#home"><span aria-hidden="true"><Sparkles size={18} aria-hidden="true" /></span>HOTEL HEAVEN</a>
            <p>A welcoming place to pause in Polokwane. Find comfortable rooms, thoughtful details and a little more time for yourself.</p>
            <span className={styles.location}>POLOKWANE · LIMPOPO</span>
          </section>

          <section aria-labelledby="footer-contact-title">
            <h2 id="footer-contact-title">Contact us</h2>
            <address className={styles.address}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
              <div>112 Magazyn St<br />Polokwane Ext 4<br />Polokwane, 0700<br />South Africa</div>
            </address>
            <a className={styles.textLink} href="https://www.google.com/maps?q=-23.897154,29.464561" target="_blank" rel="noopener noreferrer">Get directions <span aria-hidden="true"><ArrowUpRight size={18} aria-hidden="true" /></span></a>
          </section>

          <nav aria-labelledby="footer-info-title">
            <h2 id="footer-info-title">Information</h2>
            <ul className={styles.links}>
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About us</a></li>
              <li><Link to="/accommodations">Rooms & suites</Link></li>
              <li><a href="#amenities">Amenities</a></li>
              <li><a href="#dining">Dining</a></li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-support-title">
            <h2 id="footer-support-title">Support</h2>
            <ul className={styles.links}>
              <li><button type="button" onClick={() => setOpenInfo('help')}>Booking help</button></li>
              <li><Link to="/profile/bookings">My bookings</Link></li>
              <li><Link to="/profile">My account</Link></li>
              <li><button type="button" onClick={() => setOpenInfo('privacy')}>Privacy</button></li>
              <li><button type="button" onClick={() => setOpenInfo('terms')}>Terms of stay</button></li>
            </ul>
          </nav>

          <section className={styles.updates} aria-labelledby="footer-updates-title">
            <h2 id="footer-updates-title">Stay in the know</h2>
            <p>Choose whether to receive hotel offers in your account. Manage your preferences whenever you like.</p>
            <Link className={styles.updatesButton} to="/profile">Manage updates <span aria-hidden="true"><ArrowUpRight size={18} aria-hidden="true" /></span></Link>
            <h3>Share Hotel Heaven</h3>
            <div className={styles.social}>
              <a href={'https://www.facebook.com/sharer/sharer.php?u=' + shareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share Hotel Heaven on Facebook"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 21v-8h3l.5-4H14V7c0-1 .5-1.5 1.5-1.5H18V2h-3c-3.5 0-5 2-5 5v2H7v4h3v8Z"/></svg></a>
              <a href={'https://wa.me/?text=' + encodeURIComponent('Explore Hotel Heaven: ') + shareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share Hotel Heaven on WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.1-4.3A8.5 8.5 0 1 1 20 11.5Z"/><path d="M8 7c-2 3 3 8 6 7l1-2-2-1-1 1-2-2 1-1-1-2Z"/></svg></a>
              <a href={'mailto:?subject=Discover%20Hotel%20Heaven&body=' + shareUrl} aria-label="Share Hotel Heaven by email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg></a>
            </div>
          </section>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Hotel Heaven. All rights reserved.</p>
          <span className={styles.payments}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>Online checkout with Paystack</span>
          <div className={styles.legal}><button type="button" onClick={() => setOpenInfo('terms')}>Terms of stay</button><button type="button" onClick={() => setOpenInfo('privacy')}>Privacy</button></div>
        </div>
      </div>
      {openInfo && <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="footer-dialog-title" onCancel={event => { event.preventDefault(); setOpenInfo(null) }}>
        <button ref={closeButtonRef} type="button" className={styles.close} aria-label="Close information" onClick={() => setOpenInfo(null)}><X size={18} aria-hidden="true" /></button>
        <h2 id="footer-dialog-title">{information[openInfo].title}</h2>
        {information[openInfo].paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        <Link to="/profile" onClick={() => setOpenInfo(null)}>Go to My account <span aria-hidden="true"><ArrowUpRight size={18} aria-hidden="true" /></span></Link>
      </dialog>}
    </footer>
  )
}
