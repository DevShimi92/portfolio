import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticleSlugs, getArticle } from '@/app/lib/articles'
import { getArticleForRoute, getArticleMetadata } from '@/app/lib/articles/page-helpers'
import type { Locale } from '@/app/types/articles'
import { routing } from '@/app/i18n/routing'
import ArticleHeader from '../../_components/articleHeader/ArticleHeader'
import ArticleBody from '../../_components/articleBody/ArticleBody'
import styles from './page.module.css'

interface ArticlePageProps {
  params: Promise<{ locale: Locale; slug: string }>
}

//Route pour les articles listé (listed: true), accessibles uniquement par lien direct avec "/articles/nomDuDossierDeLarticle"
export async function generateStaticParams() {
  const slugs = getArticleSlugs()
  const params: { locale: Locale; slug: string }[] = []

  for (const locale of routing.locales) {
    for (const slug of slugs) {
      const article = await getArticle(slug, locale)
      if (article?.listed) params.push({ locale, slug })
    }
  }

  return params
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata>  {
  const { locale, slug } = await params
  return getArticleMetadata(slug, locale, true)
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params
  const article = await getArticleForRoute(slug, locale, true)

  if (!article) {
    notFound()
  }

  return (
    <article className={styles.page}>
      <ArticleHeader article={article} />
      <ArticleBody contentHtml={article.contentHtml} />
    </article>
  )
}
