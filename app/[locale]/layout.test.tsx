import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Metadata } from 'next'
import RootLayout, { generateMetadata } from './layout'

const { getTranslationsMock } = vi.hoisted(() => ({
  getTranslationsMock: vi.fn(),
}))

vi.mock('next/font/google', () => ({
  Syne: () => ({ variable: 'syne-var' }),
  JetBrains_Mono: () => ({ variable: 'mono-var' }),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: (args: unknown) => getTranslationsMock(args) as unknown,
}))

vi.mock('next-intl', () => ({
  NextIntlClientProvider: ({
    locale,
    children,
  }: { locale: string; children: React.ReactNode }) => (
    <div data-testid="intl" data-locale={locale}>{children}</div>
  ),
}))

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <i data-testid="analytics" />,
}))
vi.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => <i data-testid="speed" />,
}))
vi.mock('@/app/[locale]/_components/BackgroundContext/BackgroundContext', () => ({
  BackgroundProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bg">{children}</div>
  ),
}))
vi.mock('@/app/[locale]/_components/backgroundThreeJS/threeLoader', () => ({
  default: () => <i data-testid="three" />,
}))
vi.mock('./_components/ScrollHint/ScrollHint', () => ({
  default: () => <i data-testid="hint" />,
}))
vi.mock('./_components/navBar/navbar', () => ({
  default: () => <i data-testid="nav" />,
}))
vi.mock('./globals.css', () => ({}))

const params = (locale: string) => Promise.resolve({ locale })

describe('generateMetadata', () => {
  beforeEach(() => {
    getTranslationsMock.mockReset().mockResolvedValue((key: string) => `t:${key}`)
    vi.stubEnv('WEBSITE_NAME', 'Mon Site')
    vi.stubEnv('SHORT_NAME', 'MS')
    vi.stubEnv('WEBSITE_URL', 'https://site.dev')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('getTranslations : locale + namespace seoMetadata', async () => {
    await generateMetadata({ params: params('en') })
    expect(getTranslationsMock).toHaveBeenCalledWith({
      locale: 'en',
      namespace: 'seoMetadata',
    })
  })

  it('title : template + default', async () => {
    const meta: Metadata = await generateMetadata({ params: params('fr') })
    expect(meta.title).toEqual({
      template: 'Mon Site | %s ',
      default: 'Mon Site | t:home',
    })
  })

  it('description, icon', async () => {
    const meta = await generateMetadata({ params: params('fr') })
    expect(meta.description).toBe('t:description')
    expect(meta.icons).toEqual({ icon: '/favicon.svg' })
  })

  it('alternates: canonical + languages', async () => {
    const meta = await generateMetadata({ params: params('fr') })
    expect(meta.alternates).toEqual({
      canonical: '/',
      languages: { 'en-US': '/en', 'fr-FR': '/fr' },
    })
  })

  it('robots : index/follow + googleBot', async () => {
    const meta = await generateMetadata({ params: params('fr') })
    expect(meta.robots).toEqual({
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    })
  })

  it('openGraph : concatenation shortName + url + type', async () => {
    const meta = await generateMetadata({ params: params('fr') })
    expect(meta.openGraph).toMatchObject({
      title: 'MSt:openGraph.title',
      description: 't:openGraph.description',
      url: 'https://site.dev',
      siteName: 't:openGraph.siteNameMS',
      type: 'profile',
    })
  })

  it('openGraph.locale : en → en_US', async () => {
    const meta = await generateMetadata({ params: params('en') })
    expect(meta.openGraph).toMatchObject({ locale: 'en_US' })
  })

  it('openGraph.locale : fr → fr_FR', async () => {
    const meta = await generateMetadata({ params: params('fr') })
    expect(meta.openGraph).toMatchObject({ locale: 'fr_FR' })
  })

  it('openGraph.locale : unknown locale → fr_FR', async () => {
    const meta = await generateMetadata({ params: params('de') })
    expect(meta.openGraph).toMatchObject({ locale: 'fr_FR' })
  })

  it('fallbacks if env variables are missing', async () => {
    vi.stubEnv('WEBSITE_NAME', undefined as unknown as string)
    vi.stubEnv('SHORT_NAME', undefined as unknown as string)
    vi.stubEnv('WEBSITE_URL', undefined as unknown as string)
    const meta = await generateMetadata({ params: params('fr') })
    expect(meta.title).toMatchObject({ default: 'WEBSITE NAME | t:home' })
    expect(meta.openGraph).toMatchObject({
      title: 'SHORT NAMEt:openGraph.title',
      url: 'WEBSITE URL',
      siteName: 't:openGraph.siteNameSHORT NAME',
    })
  })
})

describe('RootLayout', () => {
  const render = async (locale = 'fr') =>
    renderToStaticMarkup(
      await RootLayout({
        children: <p data-testid="child">contenu</p>,
        params: params(locale),
      } as Parameters<typeof RootLayout>[0]),
    )

  it('HTML: font variable classes', async () => {
    expect(await render()).toMatch(/<html[^>]*class="syne-var mono-var"/)
  })

  it('transmet la locale à NextIntlClientProvider', async () => {
    expect(await render('en')).toContain('data-locale="en"')
  })

  it('render background, nav, hint, analytics, speed insights, children', async () => {
    const html = await render()
    for (const id of ['bg', 'three', 'nav', 'hint', 'intl', 'analytics', 'speed', 'child']) {
      expect(html).toContain(`data-testid="${id}"`)
    }
  })

  it('children + Analytics + SpeedInsights in the international provider', async () => {
    const html = await render()
    const open = html.indexOf('data-testid="intl"')
    for (const id of ['child', 'analytics', 'speed']) {
      expect(html.indexOf(`data-testid="${id}"`)).toBeGreaterThan(open)
    }
  })

  it('ThreeSceneLoader, NavBar, ScrollHint in BackgroundProvider, outside provider intl', async () => {
    const html = await render()
    const bg = html.indexOf('data-testid="bg"')
    const intl = html.indexOf('data-testid="intl"')
    for (const id of ['three', 'nav', 'hint']) {
      const pos = html.indexOf(`data-testid="${id}"`)
      expect(pos).toBeGreaterThan(bg)
      expect(pos).toBeLessThan(intl)
    }
  })
})
