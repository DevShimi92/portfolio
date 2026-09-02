import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { compileArticleMdx } from './mdx'
import { estimateReadingTime } from './reading-time'
import type { Article, ArticleFrontmatter, ArticleMeta, Locale } from '@/app/types//articles'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'articles')
const SAFE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isSafeSlug(value: string): boolean {
   return SAFE_SLUG_RE.test(value)
 }


function readFrontmatterFile(slug: string, locale: Locale) {
  const filePath = path.join(CONTENT_DIR, slug, `${locale}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf8')
  return matter(raw)
}

export function getArticleSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => isSafeSlug(slug))
}

function toArticleMeta( slug: string, locale: Locale, frontmatter: ArticleFrontmatter, rawContent: string ): ArticleMeta {
  const readingTimeMinutes = frontmatter.readingTime ?? estimateReadingTime(rawContent)
  const coverUrl = frontmatter.cover ? `/content/articles/${slug}/${frontmatter.cover}` : undefined

  const formattedDate = frontmatter.dateISO
      ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
          new Date(frontmatter.dateISO)
        )
      : null


  return { ...frontmatter, slug, locale, coverUrl, readingTimeMinutes, formattedDate,  }
}

export function getArticleMeta(slug: string, locale: Locale): ArticleMeta | null {
  const parsed = readFrontmatterFile(slug, locale)
  if (!parsed) return null
  return toArticleMeta(slug, locale, parsed.data as ArticleFrontmatter, parsed.content)
}

export async function getArticle(slug: string, locale: Locale): Promise<Article | null> {
  const parsed = readFrontmatterFile(slug, locale)
  if (!parsed) return null

  const meta = toArticleMeta(slug, locale, parsed.data as ArticleFrontmatter, parsed.content)
  const content = await compileArticleMdx(parsed.content, slug)

  return { ...meta, content }
}

interface GetAllArticlesOptions {
  includeUnlisted?: boolean
}

export function getAllArticles(locale: Locale, options: GetAllArticlesOptions = {}): ArticleMeta[] {
  const { includeUnlisted = false } = options

  const metas = getArticleSlugs()
    .map((slug) => getArticleMeta(slug, locale))
    .filter((meta): meta is ArticleMeta => meta !== null)
    .filter((meta) => includeUnlisted || meta.listed)

  const getTime = (meta: ArticleMeta) => (meta.dateISO ? new Date(meta.dateISO).getTime() : 0)
  return metas.sort((a, b) => getTime(b) - getTime(a))
}

export function getAllTags(locale: Locale): string[] {
  const tags = getAllArticles(locale).flatMap((article) => article.tags)
  return Array.from(new Set(tags)).sort()
}
