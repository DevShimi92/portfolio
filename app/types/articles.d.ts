export type Locale = 'fr' | 'en'

export interface ArticleFrontmatter {
  title: string
  dateISO: string
  description: string
  tags: string[]
  listed: boolean
  cover?: string
  readingTime?: number // override le temps en minute si rempli
}

export interface ArticleMeta extends ArticleFrontmatter {
  slug: string
  locale: Locale
  coverUrl?: string
  readingTimeMinutes: number
}

export interface Article extends ArticleMeta {
  contentHtml: string
}
