import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import NavBar from './navbar'
import { useActiveNavLink } from '@/app/[locale]/_hooks/useActiveNavLink'
import { useBackground } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'

vi.mock('@/app/[locale]/_hooks/useActiveNavLink', () => ({
  useActiveNavLink: vi.fn(),
}))

vi.mock('@/app/[locale]/_components/BackgroundContext/BackgroundContext', () => ({
  useBackground: vi.fn(),
}))

vi.mock('@/app/[locale]/_components/socialButton/socialButton', () => ({
  default: () => <div data-testid="social-links" />,
  SocialLinksInline: () => <div data-testid="social-links-inline" />,
}))

vi.mock('../langToggle/langToggle', () => ({
  default: () => <div data-testid="lang-toggle" />,
  LangToggleInline: () => <div data-testid="lang-toggle-inline" />,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, onClick, className, tabIndex }: {
    href: string
    children: React.ReactNode
    onClick?: () => void
    className?: string
    tabIndex?: number
  }) => (
    <a href={href} onClick={onClick} className={className} tabIndex={tabIndex}>
      {children}
    </a>
  ),
}))

function setupMocks({
  isStandaloneRoute = false,
  activeRouteId = null as string | null,
  currentSection = 'home',
} = {}) {
  vi.mocked(useActiveNavLink).mockReturnValue({
    isStandaloneRoute,
    activeRouteId,
    locale: 'fr',
  })
  vi.mocked(useBackground).mockReturnValue({
    blurAmount: 0,
    setBlurAmount: vi.fn(),
    currentSection,
    setCurrentSection: vi.fn(),
  })
}

describe('NavBar', () => {
  beforeEach(() => {
    setupMocks()
  })

  test('renders all nav links twice (desktop + mobile overlay)', () => {
    render(<NavBar />)
    expect(screen.getAllByText('Home')).toHaveLength(2)
    expect(screen.getAllByText('Info')).toHaveLength(2)
    expect(screen.getAllByText('Projets')).toHaveLength(2)
    expect(screen.getAllByText('Contact')).toHaveLength(2)
  })

  test('renders section link as button when on root page', () => {
    setupMocks({ isStandaloneRoute: false, currentSection: 'home' })
    render(<NavBar />)
    const homeButtons = screen.getAllByText('Home')
    expect(homeButtons[0]?.closest('button')).toBeInTheDocument()
  })

  test('renders section link as anchor link when on standalone route', () => {
    setupMocks({ isStandaloneRoute: true, currentSection: 'home' })
    render(<NavBar />)
    const homeLinks = screen.getAllByText('Home')
    expect(homeLinks[0]?.closest('a')).toHaveAttribute('href', '/fr#home')
  })

  test('renders route link as anchor with correct href', () => {
    render(<NavBar />)
    const contactLinks = screen.getAllByText('Contact')
    expect(contactLinks[0]?.closest('a')).toHaveAttribute('href', '/fr/contact')
  })

  test('marks active route link correctly', () => {
    setupMocks({ activeRouteId: 'contact' })
    render(<NavBar />)
    const contactLinks = screen.getAllByText('Contact')
    expect(contactLinks[0]?.closest('a')?.className).toContain('navBtnActive')
  })

  test('marks active section link correctly', () => {
    setupMocks({ isStandaloneRoute: false, currentSection: 'projets' })
    render(<NavBar />)
    const projetsButtons = screen.getAllByText('Projets')
    expect(projetsButtons[0]?.closest('button')?.className).toContain('navBtnActive')
  })

  test('section link is not active when on a standalone route', () => {
    setupMocks({ isStandaloneRoute: true, currentSection: 'home' })
    render(<NavBar />)
    const homeLinks = screen.getAllByText('Home')
    expect(homeLinks[0]?.closest('a')?.className).not.toContain('navBtnActive')
  })

  test('scrolls to section and closes menu on section button click', () => {
    const scrollIntoViewMock = vi.fn()
    const homeSection = document.createElement('div')
    homeSection.id = 'home'
    homeSection.scrollIntoView = scrollIntoViewMock
    document.body.appendChild(homeSection)

    render(<NavBar />)
    const homeButtons = screen.getAllByText('Home')
    act(() => {
      homeButtons[0]?.closest('button')?.click()
    })

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
    document.body.removeChild(homeSection)
  })

  test('toggles mobile menu open and closed', async () => {
    const user = userEvent.setup()
    render(<NavBar />)

    const toggleButton = screen.getByLabelText('Ouvrir le menu')
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggleButton)
    expect(screen.getByLabelText('Fermer le menu')).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByLabelText('Fermer le menu'))
    expect(screen.getByLabelText('Ouvrir le menu')).toHaveAttribute('aria-expanded', 'false')
  })

  test('closes mobile menu when a route link is clicked', async () => {
    const user = userEvent.setup()
    render(<NavBar />)

    await user.click(screen.getByLabelText('Ouvrir le menu'))
    expect(screen.getByLabelText('Fermer le menu')).toBeInTheDocument()

    const contactLinks = screen.getAllByText('Contact')
    await user.click(contactLinks[1]!) // le lien dans l'overlay mobile

    expect(screen.getByLabelText('Ouvrir le menu')).toBeInTheDocument()
  })

  test('applies pinned style when currentSection is in PINNED_SECTIONS', () => {
    setupMocks({ currentSection: 'articles' })
    const { container } = render(<NavBar />)
    const nav = container.querySelector('nav')
    expect(nav?.className).toContain('navbarPinned')
  })

  test('applies hidden style when currentSection is not pinned', () => {
    setupMocks({ currentSection: 'home' })
    const { container } = render(<NavBar />)
    const nav = container.querySelector('nav')
    expect(nav?.className).toContain('navbarHidden')
  })

  test('renders social links and lang toggle components', () => {
    render(<NavBar />)
    expect(screen.getByTestId('social-links')).toBeInTheDocument()
    expect(screen.getByTestId('lang-toggle')).toBeInTheDocument()
    expect(screen.getByTestId('social-links-inline')).toBeInTheDocument()
    expect(screen.getByTestId('lang-toggle-inline')).toBeInTheDocument()
  })

  test('closes menu when route link is clicked in overlay', () => {
    render(<NavBar />)

    act(() => {
      screen.getByLabelText('Ouvrir le menu').click()
    })

    const contactLinks = screen.getAllByText('Contact')
    const overlayLink = contactLinks[1]?.closest('a')

    act(() => {
      overlayLink?.click()
    })

    expect(screen.queryByLabelText('Fermer le menu')).not.toBeInTheDocument()
  })
})
