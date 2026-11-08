import styles from './PageState.module.css'
type Props = { label?: string; count?: number; cards?: boolean }
export default function LoadingSkeleton({ label = 'Loading...', count = 3, cards = false }: Props) {
  return <div role="status" aria-live="polite" className={styles.loading}><span className={styles.srOnly}>{label}</span><div aria-hidden="true" className={cards ? styles.cards : styles.rows}>{Array.from({ length: count }, (_, index) => <div className={cards ? styles.card : styles.row} key={index}><span className={styles.shape} /><div className={styles.lines}><span /><span /><span /></div></div>)}</div></div>
}
