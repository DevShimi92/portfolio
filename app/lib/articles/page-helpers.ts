import type { Metadata } from 'next'
import { getArticle } from './index'
import { routing } from '@/app/i18n/routing'
import type { Locale, Article } from '@/app/types//articles'

const LOCALES = routing.locales

async function getArticleWithFallback(slug: string, locale: Locale): Promise<Article | null> {
  const primary = await getArticle(slug, locale)
  if (primary) return primary

  // S'il n'existe pas dans la langue demandé,on envoi l'autre langue.
  const fallbackLocale = LOCALES.find((candidate) => candidate !== locale)
  if (!fallbackLocale) return null

  return getArticle(slug, fallbackLocale)
}

export async function getArticleForRoute(slug: string, locale: Locale, expectedListed: boolean): Promise<Article | null> {

  const article = await getArticleWithFallback(slug, locale)
  if (!article) return null

  if (article.listed !== expectedListed) return null

  return article
}

export async function getArticleMetadata(slug: string, locale: Locale, expectedListed: boolean): Promise<Metadata> {

  const article = await getArticleForRoute(slug, locale, expectedListed)

  if (!article) return {}

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      images: article.coverUrl ? [{ url: article.coverUrl }] : undefined,
    },
  }
}
