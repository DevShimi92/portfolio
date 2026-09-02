'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { ArticleMeta } from '@/app/types/articles'
import MiniTag from '../miniTag/MiniTag'
import TagChip from '../tagChip/TagChip'
import styles from './ArticlesSommaire.module.css'

interface ArticlesSommaireProps {
  articles: ArticleMeta[]
  tags: string[]
}

export default function ArticlesSommaire({ articles, tags }: ArticlesSommaireProps) {
  const t = useTranslations('articlePage')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [activeSlug, setActiveSlug] = useState(articles[0]?.slug)

  function toggleTag(tag: string) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const filteredArticles = activeTags.length === 0 ? articles : articles.filter((article) => activeTags.every((tag) => article.tags.includes(tag)))

  const activeArticle =
    filteredArticles.find((article) => article.slug === activeSlug) ?? filteredArticles[0]

    const hasNoArticleAtAll = articles.length === 0
    const emptyMessage = hasNoArticleAtAll ? t('noArticle') : filteredArticles.length === 0 ? t('notFound') : null

  const tagFilterChips = (
    <>
      <TagChip label="Tous" isActive={activeTags.length === 0} onClick={() => setActiveTags([])} />
      {tags.map((tag) => (
        <TagChip key={tag} label={tag} isActive={activeTags.includes(tag)} onClick={() => toggleTag(tag)} />
      ))}
    </>
  )

  return (
    <>
      {/* Desktop */}
      <div className={styles.splitLayout}>
        <div className={styles.splitLeftCol}>
          {!hasNoArticleAtAll && (<div className={`${styles.tagFilterGroup} ${styles.tagFilterGroupDesktop}`}>{tagFilterChips}</div>)}
          {emptyMessage ? ( <p className={styles.emptyState}>{emptyMessage}</p> ) : (
          <div className={styles.splitList}>
            {filteredArticles.map((article) => (
              <Link key={article.slug} href={`/articles/${article.slug}`} className={`${styles.splitListItem} ${article.slug === activeSlug ? styles.active : ''}`}
                onMouseEnter={() => setActiveSlug(article.slug)} onFocus={() => setActiveSlug(article.slug)} >
                <span className={styles.splitListTitle}>{article.title}</span>
                <span className={styles.splitListMeta}>
                  {article.formattedDate && (
                    <>
                      <span>{article.formattedDate}</span>
                      <span>·</span>
                    </>
                  )}
                  <span>{article.readingTimeMinutes} min</span>
                </span>
                <p className={styles.splitListExcerpt}>{article.description}</p>
                <div className={styles.splitListTags}> {article.tags.map((tag) => ( <MiniTag key={tag}>{tag}</MiniTag> ))} </div>
              </Link>
            ))}
                </div>
            )}
        </div>


        {activeArticle && (
          <Link href={`/articles/${activeArticle.slug}`} className={styles.splitFeature}>
            {activeArticle.coverUrl && ( <Image src={activeArticle.coverUrl} alt="" fill sizes="(max-width: 1150px) 56vw, 62vw" className={styles.splitFeatureImg} /> )}
            <div className={styles.splitFeatureBody}>
              <h2 className={styles.splitTitle}>{activeArticle.title}</h2>
              <div className={styles.splitMeta}>
                {activeArticle.formattedDate && (
                  <>
                    <span>{activeArticle.formattedDate}</span>
                    <span>·</span>
                  </>
                )}
                <span>{activeArticle.readingTimeMinutes} min de lecture</span>
              </div>
              <p className={styles.splitExcerpt}>{activeArticle.description}</p>
              <div className={styles.splitTags}> {activeArticle.tags.map((tag) => ( <MiniTag key={tag}>{tag}</MiniTag> ))} </div>
            </div>
          </Link>
        )}
      </div>

      {/* Mobile */}
      <div className={styles.mobileGrid}>
        {!hasNoArticleAtAll && ( <div className={`${styles.tagFilterGroup} ${styles.tagFilterGroupMobile}`}>{tagFilterChips}</div> )}
        {emptyMessage ? (<p className={styles.emptyState}>{emptyMessage}</p>) : (<div>
          {filteredArticles.map((article) => (
            <Link key={article.slug} href={`/articles/${article.slug}`} className={styles.card}>
              {article.coverUrl && (
                <div className={styles.cardCover}>
                  <Image src={article.coverUrl} alt="" fill sizes="(max-width: 600px) 100vw, 50vw" />
                </div>
              )}
              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  {article.formattedDate && <span>{article.formattedDate}</span>}
                  <span>{article.readingTimeMinutes} min</span>
                </div>
                <h3 className={styles.cardTitle}>{article.title}</h3>
                <p className={styles.cardExcerpt}>{article.description}</p>
                <div className={styles.cardTags}>
                  {article.tags.map((tag) => (
                    <MiniTag key={tag}>{tag}</MiniTag>
                  ))}
                </div>
              </div>
            </Link>
            ))}
        </div>)}
      </div>
    </> // END mobile
  )
}
