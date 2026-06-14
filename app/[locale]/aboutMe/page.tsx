import { useTranslations } from 'next-intl'
import Link from 'next/link'
import PhotoFrame from '../_components/photoFrame/PhotoFrame'
import styles from './aboutMe.module.css'

type Highlight = { word: string; href: string }

const imgUrl = process.env.PROFILE_IMG_URL


function parseLineWithHighlights(line: string, highlights: Highlight[]) {
  if (!highlights.length) return <span>{line}</span>

  const pattern = highlights
    .map(h => h.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const regex = new RegExp(`(${pattern})`, 'g')
  const parts = line.split(regex)

  return parts.map((part, i) => {
    const match = highlights.find(h => h.word === part)
    return match
      ? <Link key={i} href={match.href} className={styles.highlight}>{part}</Link>
      : <span key={i}>{part}</span>
  })
}

export default function AboutMe() {
  const t = useTranslations('aboutMePage')
  const title = t.raw('title') as string
  const bioLines   = t.raw('bioLines')   as string[]
  const highlights = t.raw('highlights') as Highlight[]
  return (
      <section className={styles.section}>
        <div className={styles.container}>
          {imgUrl && <PhotoFrame imgUrl={imgUrl} />}
          <div className={styles.textBlock}>
            <h2 className={styles.title}>{title}</h2>
          <div className={styles.bio}>
            {bioLines.map((line, i) => (
                          <p key={i} className={styles.bioLine}>
                            {parseLineWithHighlights(line, highlights)}
                          </p>
                        ))}
            </div>
          </div>

        </div>
      </section>
    );
}
