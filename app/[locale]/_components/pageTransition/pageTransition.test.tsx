import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageTransition from './pageTransition'

const { standaloneMock, scrollYMock, motionSpy } = vi.hoisted(() => ({
  standaloneMock: vi.fn(),
  scrollYMock: vi.fn(),
  motionSpy: vi.fn(),
}))

vi.mock('@/app/[locale]/_hooks/useActiveNavLink', () => ({
  useActiveNavLink: () => ({ isStandaloneRoute: standaloneMock() as boolean }),
}))

vi.mock('@/app/lib/scrollMemory', () => ({
  getLastScrollY: () => scrollYMock() as number,
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => {
      motionSpy(props)
      return <div data-testid="motion">{children}</div>
    },
  },
}))

const scrollToSpy = vi.fn()

describe('PageTransition', () => {
  beforeEach(() => {
    standaloneMock.mockReset().mockReturnValue(false)
    scrollYMock.mockReset().mockReturnValue(0)
    motionSpy.mockClear()
    scrollToSpy.mockClear()
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo
    window.location.hash = ''
  })

  afterEach(() => {
    window.location.hash = ''
  })

  describe('rendered', () => {
    it('animate=true (default) : envelops in motion.div', () => {
      render(<PageTransition><p>contenu</p></PageTransition>)
      expect(screen.getByTestId('motion')).toContainElement(screen.getByText('contenu'))
    })

    it('props of animation : initial / animate / transition', () => {
      render(<PageTransition><p>x</p></PageTransition>)
      expect(motionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          initial: { opacity: 0, y: 40 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
        }),
      )
    })

    it('animate=false : no motion.div, children returned as they are', () => {
      render(<PageTransition animate={false}><p>contenu</p></PageTransition>)
      expect(screen.queryByTestId('motion')).not.toBeInTheDocument()
      expect(screen.getByText('contenu')).toBeInTheDocument()
    })
  })

  describe('scroll : standalone route', () => {
    it('instant scroll to top', () => {
      standaloneMock.mockReturnValue(true)
      render(<PageTransition><p>x</p></PageTransition>)
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
    })

    it('ignore scroll memory and the hash', () => {
      standaloneMock.mockReturnValue(true)
      scrollYMock.mockReturnValue(500)
      window.location.hash = '#about'
      render(<PageTransition><p>x</p></PageTransition>)
      expect(scrollToSpy).toHaveBeenCalledTimes(1)
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
    })

    it('animate=false : scroll-to-top applied anyway', () => {
      standaloneMock.mockReturnValue(true)
      render(<PageTransition animate={false}><p>x</p></PageTransition>)
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
    })
  })

  describe('scroll : route section', () => {
    it('restores the last position if > 0', () => {
      scrollYMock.mockReturnValue(320)
      render(<PageTransition><p>x</p></PageTransition>)
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 320, behavior: 'instant' })
    })

    it('y = 0 : no scroll', () => {
      scrollYMock.mockReturnValue(0)
      render(<PageTransition><p>x</p></PageTransition>)
      expect(scrollToSpy).not.toHaveBeenCalled()
    })

    it('y negative : no scroll', () => {
      scrollYMock.mockReturnValue(-10)
      render(<PageTransition><p>x</p></PageTransition>)
      expect(scrollToSpy).not.toHaveBeenCalled()
    })

    it('hash here : priority to the anchor, no scrolling', () => {
      scrollYMock.mockReturnValue(320)
      window.location.hash = '#projets'
      render(<PageTransition><p>x</p></PageTransition>)
      expect(scrollToSpy).not.toHaveBeenCalled()
    })
  })

  describe('reaction to a change of route', () => {
    it('section → standalone : scroll top', () => {
      const { rerender } = render(<PageTransition><p>x</p></PageTransition>)
      scrollToSpy.mockClear()

      standaloneMock.mockReturnValue(true)
      rerender(<PageTransition><p>x</p></PageTransition>)
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
    })

    it('standalone → section : restores memory', () => {
      standaloneMock.mockReturnValue(true)
      const { rerender } = render(<PageTransition><p>x</p></PageTransition>)
      scrollToSpy.mockClear()

      standaloneMock.mockReturnValue(false)
      scrollYMock.mockReturnValue(150)
      rerender(<PageTransition><p>x</p></PageTransition>)
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 150, behavior: 'instant' })
    })

    it('rerender without a route change: no new scroll', () => {
      scrollYMock.mockReturnValue(200)
      const { rerender } = render(<PageTransition><p>x</p></PageTransition>)
      expect(scrollToSpy).toHaveBeenCalledTimes(1)

      rerender(<PageTransition><p>y</p></PageTransition>)
      expect(scrollToSpy).toHaveBeenCalledTimes(1)
    })
  })
})
