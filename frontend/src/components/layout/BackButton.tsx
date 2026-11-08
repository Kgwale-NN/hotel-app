import type { ReactNode } from 'react'
import { useBackNavigation } from './pageHistory'
import styles from './BackButton.module.css'

type Props = { className?: string; children?: ReactNode }

export default function BackButton({ className, children }: Props) {
  const goBack = useBackNavigation()
  return <button type="button" className={className ?? styles.back} aria-label="Back to previous page" title="Go back" onClick={goBack}>
    {children ?? <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 4-8 8 8 8" /></svg>}
  </button>
}
