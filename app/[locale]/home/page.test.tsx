import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './page'

const DISCIPLINES = ['Code', 'Sécurité', 'Architecture']

const { messages } = vi.hoisted(() => ({
  messages: new Map<string, unknown>([
    ['name', 'Nom Par Défaut'],
    ['role', 'Full Stack & Security'],
    ['disciplines', ['Code', 'Sécurité', 'Architecture']],
  ]),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => messages.get(key) as string
    t.raw = (key: string) => messages.get(key)
    return t
  },
  useLocale: () => 'fr',
}))

const heroSpy = vi.fn()
vi.mock('@/app/[locale]/_components/heroContent/HeroContent', () => ({
  default: (props: Record<string, unknown>) => {
    heroSpy(props)
    return <div data-testid="hero" />
  },
}))

vi.mock('./home.module.css', () => ({
  default: { homeSection: 'homeSection' },
}))

describe('Home', () => {
  beforeEach(() => {
    heroSpy.mockClear()
    vi.unstubAllEnvs()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders HeroContent within a section-full', () => {
    const { container } = render(<Home />)
    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('section-full', 'homeSection')
  })

  it('past role, disciplines and local', () => {
    render(<Home />)
    expect(heroSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'Full Stack & Security',
        disciplines: DISCIPLINES,
        locale: 'fr',
      }),
    )
  })

  it('use LAST_FIRST_NAME if defined', () => {
    vi.stubEnv('LAST_FIRST_NAME', 'Jean Dupont')
    render(<Home />)
    expect(heroSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Jean Dupont' }),
    )
  })

  it('fallback to t("name") if env is missing', () => {
    vi.stubEnv('LAST_FIRST_NAME', undefined as unknown as string)
    render(<Home />)
    expect(heroSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Nom Par Défaut' }),
    )
  })

  it('env empty "" does not trigger the fallback (?? ≠ ||)', () => {
    vi.stubEnv('LAST_FIRST_NAME', '')
    render(<Home />)
    expect(heroSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: '' }),
    )
  })
})
