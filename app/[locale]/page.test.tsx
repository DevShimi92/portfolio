import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Root from './page'

const { transitionSpy, sectionSpy } = vi.hoisted(() => ({
  transitionSpy: vi.fn(),
  sectionSpy: vi.fn(),
}))

vi.mock('@/app/[locale]/home/page', () => ({
  default: () => <div data-testid="home" />,
}))
vi.mock('@/app/[locale]/aboutMe/page', () => ({
  default: () => <div data-testid="about" />,
}))
vi.mock('@/app/[locale]/projets/page', () => ({
  default: () => <div data-testid="projets" />,
}))
vi.mock('@/app/[locale]/_components/footer/footer', () => ({
  default: () => <footer data-testid="footer" />,
}))

vi.mock('@/app/[locale]/_components/pageTransition/pageTransition', () => ({
  default: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => {
    transitionSpy(props)
    return <div data-testid="transition">{children}</div>
  },
}))

vi.mock('@/app/[locale]/_components/AnimatedSection/AnimatedSection', () => ({
  default: ({
    children,
    id,
    isHome,
  }: { children: React.ReactNode; id: string; isHome?: boolean }) => {
    sectionSpy({ id, isHome })
    return <section data-testid={`section-${id}`}>{children}</section>
  },
}))

describe('Root page', () => {
  beforeEach(() => {
    transitionSpy.mockClear()
    sectionSpy.mockClear()
  })

  it('PageTransition avec animate=false', () => {
    render(<Root />)
    expect(transitionSpy).toHaveBeenCalledWith(expect.objectContaining({ animate: false }))
  })

  it('sections home / about / projets dans l’ordre, footer en dernier', () => {
    render(<Root />)
    const children = Array.from(screen.getByTestId('transition').children)
    expect(children.map(c => c.getAttribute('data-testid'))).toEqual([
      'section-home',
      'section-about',
      'section-projets',
      'footer',
    ])
  })

  it('each section contains its own page', () => {
    render(<Root />)
    expect(screen.getByTestId('section-home')).toContainElement(screen.getByTestId('home'))
    expect(screen.getByTestId('section-about')).toContainElement(screen.getByTestId('about'))
    expect(screen.getByTestId('section-projets')).toContainElement(screen.getByTestId('projets'))
  })

  it('isHome only on the home section', () => {
    render(<Root />)
    expect(sectionSpy).toHaveBeenCalledWith({ id: 'home', isHome: true })
    expect(sectionSpy).toHaveBeenCalledWith({ id: 'about', isHome: undefined })
    expect(sectionSpy).toHaveBeenCalledWith({ id: 'projets', isHome: undefined })
  })

  it('footer outside the lively sections', () => {
    render(<Root />)
    expect(screen.getByTestId('footer').closest('[data-testid^="section-"]')).toBeNull()
  })
})
