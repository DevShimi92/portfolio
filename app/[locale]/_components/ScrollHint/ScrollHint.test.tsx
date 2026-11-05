import { render, screen, act } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import ScrollHint from './ScrollHint'
import { useActiveNavLink } from '@/app/[locale]/_hooks/useActiveNavLink'
import { useBackground } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'

vi.mock('@/app/[locale]/_hooks/useActiveNavLink', () => ({
  useActiveNavLink: vi.fn(),
}))

vi.mock('@/app/[locale]/_components/BackgroundContext/BackgroundContext', () => ({
  useBackground: vi.fn(),
}))

function setupMocks({ isStandaloneRoute = false, blurAmount = 0 } = {}) {
  vi.mocked(useActiveNavLink).mockReturnValue({
    isStandaloneRoute,
    activeRouteId: null,
    locale: 'fr',
  })
  vi.mocked(useBackground).mockReturnValue({
    blurAmount,
    setBlurAmount: vi.fn(),
    currentSection: 'home',
    setCurrentSection: vi.fn(),
  })
}

describe('ScrollHint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders button when visible conditions are met', () => {
    setupMocks({ isStandaloneRoute: false, blurAmount: 0 })
    render(<ScrollHint />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  test('renders nothing when isStandaloneRoute is true', () => {
    setupMocks({ isStandaloneRoute: true, blurAmount: 0 })
    const { container } = render(<ScrollHint />)
    expect(container).toBeEmptyDOMElement()
  })

  test('renders nothing when opacity reaches 0', () => {
    setupMocks({ isStandaloneRoute: false, blurAmount: 0.15 })
    const { container } = render(<ScrollHint />)
    expect(container).toBeEmptyDOMElement()
  })

  test('applies correct opacity style based on blurAmount', () => {
    setupMocks({ isStandaloneRoute: false, blurAmount: 0.075 })
    render(<ScrollHint />)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle({ opacity: '0.5' })
  })

  test('scrolls to #about section on click', () => {
    setupMocks({ isStandaloneRoute: false, blurAmount: 0 })

    const scrollIntoViewMock = vi.fn()
    const aboutSection = document.createElement('div')
    aboutSection.id = 'about'
    aboutSection.scrollIntoView = scrollIntoViewMock
    document.body.appendChild(aboutSection)

    render(<ScrollHint />)
    act(() => {
      screen.getByRole('button').click()
    })

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
    document.body.removeChild(aboutSection)
  })

  test('does nothing on click if #about section does not exist', () => {
    setupMocks({ isStandaloneRoute: false, blurAmount: 0 })
    render(<ScrollHint />)
    expect(() => {
      act(() => {
        screen.getByRole('button').click()
      })
    }).not.toThrow()
  })
})
