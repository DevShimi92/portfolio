import type { Metadata } from 'next'
import { getAllArticles, getAllTags } from '@/app/lib/articles'
import type { Locale } from '@/app/types/articles'
import ArticlesInteractive from '../_components/articleSommaire/ArticlesSommaire'
import styles from './articles.module.css'

interface ArticlesSommaireProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: ArticlesSommaireProps): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Articles',
    description:
      locale === 'fr'
        ? 'Notes sur le développement, la sécurité et l’architecture.'
        : 'Notes on development, security, and architecture.',
  }
}

export default async function ArticlesSommairePage({ params }: ArticlesSommaireProps) {
  const { locale } = await params
  const articles = getAllArticles(locale)
  const tags = getAllTags(locale)

  return (
    <div className={styles.page}>
      <div className={styles.listingHead}>
        <h1 className={styles.listingTitle}>Articles</h1>
      </div>

      <ArticlesInteractive articles={articles} tags={tags} />
    </div>
  )
}
