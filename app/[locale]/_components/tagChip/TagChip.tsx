'use client'

import styles from './TagChip.module.css'

interface TagChipProps {
  label: string
  isActive: boolean
  onClick: () => void
}

export default function TagChip({ label, isActive, onClick }: TagChipProps) {
  return (
    <button
      type="button"
      className={`${styles.tagChip} ${isActive ? styles.tagChipOn : ''}`}
      onClick={onClick}
      aria-pressed={isActive}
    >
      {label}
    </button>
  )
}
