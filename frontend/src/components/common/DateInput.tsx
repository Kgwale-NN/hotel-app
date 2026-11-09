import { useState, type ComponentProps } from 'react'
import styles from './DateInput.module.css'

export default function DateInput({ onChange, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [localValue, setLocalValue] = useState(String(props.defaultValue ?? ''))
  const value = String(props.value ?? localValue)
  // Read the calendar day directly so timezone conversion cannot shift it.
  const selectedDay = /^\d{4}-\d{2}-(\d{2})$/.exec(value)?.[1]
  const day = selectedDay ? Number(selectedDay) : new Date().getDate()

  return <span className={styles.field}>
    <input {...props} type="date" onChange={event => {
      setLocalValue(event.target.value)
      onChange?.(event)
    }} />
    <svg className={styles.calendar} viewBox="0 0 32 34" fill="none" aria-hidden="true" focusable="false">
      <rect className={styles.paper} x="2" y="5" width="28" height="27" rx="5" />
      <path className={styles.outline} d="M2 13h28M10 2v7M22 2v7" strokeWidth="1.6" strokeLinecap="round" />
      <text className={styles.day} x="16" y="26" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="600">{day}</text>
    </svg>
  </span>
}
