import type { ComponentProps } from 'react'
import styles from './DateInput.module.css'

export default function DateInput(props: Omit<ComponentProps<'input'>, 'type'>) {
  return <span className={styles.field}>
    <input {...props} type="date" />
    <svg className={styles.calendar} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="7" fill="#50ad9c" />
      <rect x="4" y="9" width="32" height="28" rx="3" fill="#fafaf5" />
      <path d="M11 6v6M29 6v6" stroke="#d5d8d3" strokeWidth="3.5" strokeLinecap="round" />
      <text x="20" y="30" textAnchor="middle" fill="#898c86" fontFamily="Georgia, serif" fontSize="20" fontWeight="bold">11</text>
    </svg>
  </span>
}
