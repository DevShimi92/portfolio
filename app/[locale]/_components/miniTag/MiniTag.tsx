import styles from './MiniTag.module.css'

interface MiniTagProps {
  children: string
}

export default function MiniTag({ children }: MiniTagProps) {
  return <span className={styles.miniTag}>{children}</span>
}
