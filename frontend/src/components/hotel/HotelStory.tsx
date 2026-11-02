import storyImage from '../../assets/hotel-story.jpg'
import styles from './HotelStory.module.css'

function HotelStory() {
  return (
    <section className={styles.story} aria-labelledby="story-title">
      <img
        className={styles.image}
        src={storyImage}
        alt="The hotel and its surroundings"
      />

      <div className={styles.content}>
        <p className={styles.eyebrow}>A SENSE OF PLACE</p>
        <h2 id="story-title">Take time to enjoy where you are.</h2>
        <p>
          Make space to slow down, explore your surroundings, and enjoy the
          moments that make a stay memorable.
        </p>
      </div>
    </section>
  )
}

export default HotelStory