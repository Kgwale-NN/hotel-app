import storyImage from '../../assets/hotel-story.webp'
import styles from './HotelStory.module.css'

function HotelStory() {
    return (
        <section className={styles.story} aria-labelledby="story-title">
            <img decoding="async"
                className={styles.image}
                src={storyImage}
                alt="The hotel and its surroundings"
            />

            <div className={styles.content}>
                <p className={styles.eyebrow}>A SENSE OF PLACE</p>
                <h2 id="story-title">Find your own pace in Polokwane.</h2>
                <p>
                    At Hotel Heaven, your stay is shaped by the moments you make for yourself. Settle in, explore Polokwane, and enjoy a welcoming place to return to at the end of the day.
                </p>
            </div>
        </section>
    )
}

export default HotelStory