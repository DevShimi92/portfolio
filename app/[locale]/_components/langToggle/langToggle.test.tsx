import { render, screen, act } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import LangToggle, { LangToggleInline } from './langToggle'
import { useParams, usePathname } from 'next/navigation'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  usePathname: vi.fn(),
  useRouter: () => ({ push: pushMock }),
}))

// ── Source unique pour les langues testées ──
const locales = ['fr', 'en']

// Règle de langue suivante : la seule connue à ce jour (binaire fr<->en).
// À faire évoluer si le composant devient cycle-based sur N langues.
function expectedNextLocale(locale: string) {
  return locale === 'fr' ? 'en' : 'fr'
}

function setLocale(locale: string, path = 'projets') {
  vi.mocked(useParams).mockReturnValue({ locale })
  vi.mocked(usePathname).mockReturnValue(`/${locale}/${path}`)
}

describe.each([ // Besoin de refacto le composant pour pas a testé 2 fois la même chose
  ['LangToggle', LangToggle],
  ['LangToggleInline', LangToggleInline],
])('%s', (_name, Component) => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  test.each(locales)('renders %s uppercase correctly', (locale) => {
    setLocale(locale)
    render(<Component />)
    expect(screen.getByText(locale.toUpperCase())).toBeInTheDocument()
  })

  test.each(locales)('has correct aria-label for %s', (locale) => {
    setLocale(locale)
    render(<Component />)
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      `Changer la langue — actuellement ${locale.toUpperCase()}`
    )
  })

  test.each(locales)('navigates to expected next locale from %s', (locale) => {
    setLocale(locale)
    render(<Component />)
    act(() => {
      screen.getByRole('button').click()
    })
    const expected = expectedNextLocale(locale)
    expect(pushMock).toHaveBeenCalledWith(`/${expected}/projets`)
  })

  test('falls back to en when locale param is missing', () => {
    vi.mocked(useParams).mockReturnValue({})
    vi.mocked(usePathname).mockReturnValue('/projets')
    render(<Component />)
    expect(screen.getByText('EN')).toBeInTheDocument()
  })
})
