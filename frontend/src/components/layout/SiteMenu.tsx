import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import styles from './SiteMenu.module.css'

type SiteMenuProps = { onClose: () => void }

export default function SiteMenu({ onClose }: SiteMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  return <dialog ref={dialogRef} className={styles.menu} aria-labelledby="about-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <header className={styles.header}>
      <button ref={closeRef} className={styles.closeButton} type="button" onClick={onClose}><span aria-hidden="true">×</span> Close</button>
      <Link className={styles.brand} to="/" onClick={onClose}>HOTEL HEAVEN</Link>
      <span className={styles.location}>POLOKWANE · LIMPOPO</span>
    </header>

    <div className={styles.content}>
      <p className={styles.eyebrow}>ABOUT US</p>
      <h1 id="about-title">A warm welcome.<br /><em>A place to feel at home.</em></h1>
      <p className={styles.intro}>Welcome to Hotel Heaven, your place to pause in Polokwane. We bring together comfortable stays, good food and the simple pleasure of feeling welcome.</p>

      <div className={styles.columns}>
        <section className={styles.column} aria-labelledby="our-story">
          <p className={styles.sectionLabel}>OUR STORY</p>
          <h2 id="our-story">Hospitality, with a personal touch.</h2>
          <p>Our idea of a memorable stay starts with the everyday things: a restful room, a friendly welcome and time to settle in. At Hotel Heaven, we want you to feel comfortable from the moment you arrive.</p>
          <p>Rooted in Polokwane, Limpopo, we welcome guests travelling for work, visiting loved ones or simply taking a well-earned break.</p>
        </section>
        <section className={styles.column} aria-labelledby="your-stay">
          <p className={styles.sectionLabel}>YOUR STAY</p>
          <h2 id="your-stay">Make a little room for yourself.</h2>
          <p>Choose a room that suits your plans, enjoy an unhurried morning and make time for a meal in good company. Whether you are staying for one night or a little longer, this is your space to unwind.</p>
          <p>Explore our rooms, find your dates and plan your next visit. We look forward to being part of your time in Polokwane.</p>
        </section>
      </div>

      <footer className={styles.footer}>
        <p>Your time. Your space. Your stay.</p>
        <Link className={styles.bookButton} to="/accommodations" onClick={onClose}>Find your stay <span aria-hidden="true">↗</span></Link>
      </footer>
    </div>
  </dialog>
}
