import styles from './HotelIntroduction.module.css'

function HotelIntroduction() {
    return (
        <section className={styles.introduction} id="about">
            <p className={styles.eyebrow}>ABOUT US</p>
            <h2>A quieter stay in Polokwane</h2>
            <p className={styles.description}>
                Hotel Heaven is a welcoming place to pause, settle in, and feel at ease while visiting Polokwane. Whether you’re here for a short visit or a longer stay, we want your time with us to feel comfortable, thoughtful, and your own.      </p>
        </section>
    )
}

export default HotelIntroduction