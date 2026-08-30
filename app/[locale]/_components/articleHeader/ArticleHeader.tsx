import { Fragment } from 'react'
import Image from 'next/image'
import type { ArticleMeta } from '@/app/types/articles'
import MiniTag from '../miniTag/MiniTag'
import styles from './ArticleHeader.module.css'


interface ArticleHeaderProps {
  article: Pick<ArticleMeta, 'title' | 'formattedDate' | 'readingTimeMinutes' | 'tags' | 'coverUrl' | 'locale' | 'listed'>
}

export default function ArticleHeader({ article }: ArticleHeaderProps) {
  const readingTimeLabel =
    article.locale === 'fr'
      ? `${article.readingTimeMinutes} min de lecture`
      : `${article.readingTimeMinutes} min read`

  const metaItems = [
    article.formattedDate,
    article.listed ? readingTimeLabel : null,
  ].filter((item): item is string => item !== null)

  const metaRow = metaItems.length > 0 && (
      <div className={styles.metaRow}>
        {metaItems.map((item, i) => (
          <Fragment key={item}>
            {i > 0 && <span className={styles.dot} aria-hidden="true" />}
            <span>{item}</span>
          </Fragment>
        ))}
      </div>
    )

  const tagsRow = (
    <div className={styles.tags}>
      {article.tags.map((tag) => (
        <MiniTag key={tag}>{tag}</MiniTag>
      ))}
    </div>
  )

    if (article.coverUrl) {
      return (
        <div className={styles.hero}>
          <Image
            src={article.coverUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 900px) 100vw, 1440px"
          />
          <div className={styles.heroContent}>
            {metaRow}
            <h1 className={styles.title}>{article.title}</h1>
            {tagsRow}
          </div>
        </div>
      )
    }

    return (
      <div className={styles.heroPlain}>
        {metaRow}
        <h1 className={styles.title}>{article.title}</h1>
        {tagsRow}
        <div className={styles.heroSep} aria-hidden="true" />
      </div>
    )
  }
