'use client'
import styles from './EasterEggLabel.module.css'

type Props = {
  words: string[]
  repeat: { word: string; key: number } | null
}

export default function EasterEggLabel({ words, repeat }: Props) {
  if (words.length === 0) return null

  return (
    <div className={styles.label} role="status" aria-live="polite">
      <span>Échap</span>
      {words.map(word => {
        const flashing = repeat?.word === word
        return (
          <span key={flashing ? `${word}-${repeat.key}` : word} className={styles.item}>
            <span className={styles.sep} aria-hidden="true">·</span>
            <span className={flashing ? styles.flash : undefined}>{word}</span>
          </span>
        )
      })}
    </div>
  )
}
