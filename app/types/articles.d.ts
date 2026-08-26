import type { ReactElement } from 'react'
import type { routing } from '@/app/i18n/routing'

export type Locale = (typeof routing.locales)[number]

export interface ArticleFrontmatter {
  title: string
  dateISO?: string
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
  formattedDate: string | null
}

export interface Article extends ArticleMeta {
  content: ReactElement
}
