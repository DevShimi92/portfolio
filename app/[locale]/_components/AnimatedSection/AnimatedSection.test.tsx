import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AnimatedSection from './AnimatedSection'

const { useInViewMock, motionSpy, setBlurAmount, setCurrentSection, setLastScrollY } =
  vi.hoisted(() => ({
    useInViewMock: vi.fn(),
    motionSpy: vi.fn(),
    setBlurAmount: vi.fn(),
    setCurrentSection: vi.fn(),
    setLastScrollY: vi.fn(),
  }))

vi.mock('framer-motion', () => ({
  useInView: (...args: unknown[]) => useInViewMock(...args) as boolean,
  motion: {
    section: ({
      children,
      ref,
      ...props
    }: { children: React.ReactNode; ref?: React.Ref<HTMLElement> } & Record<string, unknown>) => {
      motionSpy(props)
      return (
        <section ref={ref} id={props.id as string} data-testid="section">
          {children}
        </section>
      )
    },
  },
}))

vi.mock('@/app/[locale]/_components/BackgroundContext/BackgroundContext', () => ({
  useBackground: () => ({ setBlurAmount, setCurrentSection }),
}))

vi.mock('@/app/lib/scrollMemory', () => ({
  setLastScrollY: (y: number) => setLastScrollY(y),
}))

// ── IntersectionObserver stub ──
type IOCallback = (entries: { isIntersecting: boolean }[]) => void
class MockIO {
  static instances: MockIO[] = []
  observe = vi.fn()
  disconnect = vi.fn()
  constructor(
    public cb: IOCallback,
    public options: { threshold: number },
  ) {
    MockIO.instances.push(this)
  }
}

// ── rAF stub (flush manuel) ──
let rafQueue = new Map<number, FrameRequestCallback>()
let rafCounter = 0
const flushRaf = () => {
  const cbs = [...rafQueue.values()]
  rafQueue.clear()
  cbs.forEach(cb => cb(0))
}

const setScrollY = (y: number) =>
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true })
const scroll = () => window.dispatchEvent(new Event('scroll'))

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')

const setup = (props: { id?: string; isHome?: boolean } = {}) =>
  render(
    <AnimatedSection id={props.id ?? 'about'} isHome={props.isHome}>
      <p>contenu</p>
    </AnimatedSection>,
  )

describe('AnimatedSection', () => {
  beforeEach(() => {
    useInViewMock.mockReset().mockReturnValue(false)
    motionSpy.mockClear()
    setBlurAmount.mockClear()
    setCurrentSection.mockClear()
    setLastScrollY.mockClear()
    MockIO.instances = []
    rafQueue = new Map()
    rafCounter = 0

    vi.stubGlobal('IntersectionObserver', MockIO)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCounter += 1
      rafQueue.set(rafCounter, cb)
      return rafCounter
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafQueue.delete(id)
    })

    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 1000,
    })
    setScrollY(0)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    if (originalOffsetHeight) {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight)
    }
  })

  describe('rendu', () => {
    it('section with id and childs', () => {
      setup({ id: 'projets' })
      const section = screen.getByTestId('section')
      expect(section).toHaveAttribute('id', 'projets')
      expect(section).toContainElement(screen.getByText('contenu'))
    })

    it('useInView : once + margin -100px', () => {
      setup()
      expect(useInViewMock).toHaveBeenCalledWith(
        expect.objectContaining({ current: expect.anything() }),
        { once: true, margin: '-100px' },
      )
    })

    it('out of view: initial hidden, animation empty', () => {
      useInViewMock.mockReturnValue(false)
      setup()
      expect(motionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          initial: { opacity: 0, y: 40 },
          animate: {},
          transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
        }),
      )
    })

    it('in the view: animation visible', () => {
      useInViewMock.mockReturnValue(true)
      setup()
      expect(motionSpy).toHaveBeenCalledWith(
        expect.objectContaining({ animate: { opacity: 1, y: 0 } }),
      )
    })
  })

  describe('scroll (isHome)', () => {
    it('isHome : listener scroll passif added', () => {
      const add = vi.spyOn(window, 'addEventListener')
      setup({ isHome: true })
      expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    })

    it('not isHome : not listener scroll, no effect', () => {
      const add = vi.spyOn(window, 'addEventListener')
      setup({ isHome: false })
      expect(add).not.toHaveBeenCalledWith('scroll', expect.anything(), expect.anything())

      setScrollY(500)
      scroll()
      flushRaf()
      expect(setBlurAmount).not.toHaveBeenCalled()
      expect(setLastScrollY).not.toHaveBeenCalled()
    })

    it('scroll : blur = scrollY / offsetHeight, memory scrollY', () => {
      setup({ isHome: true })
      setScrollY(250)
      scroll()
      expect(setBlurAmount).not.toHaveBeenCalled() // différé au frame
      flushRaf()
      expect(setBlurAmount).toHaveBeenCalledWith(0.25)
      expect(setLastScrollY).toHaveBeenCalledWith(250)
    })

    it('progression capped at 1', () => {
      setup({ isHome: true })
      setScrollY(5000)
      scroll()
      flushRaf()
      expect(setBlurAmount).toHaveBeenCalledWith(1)
      expect(setLastScrollY).toHaveBeenCalledWith(5000)
    })

    it('negative scrollY (rubber-band iOS) : capped at 0', () => {
      setup({ isHome: true })
      setScrollY(-40)
      scroll()
      flushRaf()
      expect(setBlurAmount).toHaveBeenCalledWith(0)
    })

    it('scroll bursts: only one process per frame (last one wins)', () => {
      setup({ isHome: true })
      setScrollY(100)
      scroll()
      setScrollY(300)
      scroll()
      setScrollY(500)
      scroll()
      flushRaf()
      expect(setBlurAmount).toHaveBeenCalledTimes(1)
      expect(setBlurAmount).toHaveBeenCalledWith(0.5)
    })

    it('unmount : listener removed', () => {
      const remove = vi.spyOn(window, 'removeEventListener')
      const { unmount } = setup({ isHome: true })
      unmount()
      expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
    })

    it('unmount : frame pending canceled', () => {
      const { unmount } = setup({ isHome: true })
      setScrollY(200)
      scroll()
      unmount()
      flushRaf()
      expect(setBlurAmount).not.toHaveBeenCalled()
      expect(setLastScrollY).not.toHaveBeenCalled()
    })

    it('scroll after unmount : ignored', () => {
      const { unmount } = setup({ isHome: true })
      unmount()
      setScrollY(200)
      scroll()
      flushRaf()
      expect(setBlurAmount).not.toHaveBeenCalled()
    })

    it('isHome true → false : listener removed', () => {
      const remove = vi.spyOn(window, 'removeEventListener')
      const { rerender } = setup({ isHome: true })
      rerender(
        <AnimatedSection id="about" isHome={false}>
          <p>contenu</p>
        </AnimatedSection>,
      )
      expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
    })
  })

  describe('IntersectionObserver → currentSection', () => {
    it('look at the section with threshold 0.5', () => {
      setup()
      expect(MockIO.instances).toHaveLength(1)
      const [io] = MockIO.instances
      expect(io.options).toEqual({ threshold: 0.5 })
      expect(io.observe).toHaveBeenCalledWith(screen.getByTestId('section'))
    })

    it('intersecting : setCurrentSection(id)', () => {
      setup({ id: 'projets' })
      MockIO.instances[0].cb([{ isIntersecting: true }])
      expect(setCurrentSection).toHaveBeenCalledWith('projets')
    })

    it('not intersecting : nothing', () => {
      setup()
      MockIO.instances[0].cb([{ isIntersecting: false }])
      expect(setCurrentSection).not.toHaveBeenCalled()
    })

    it('active when outside of isHome', () => {
      setup({ isHome: false })
      expect(MockIO.instances).toHaveLength(1)
    })

    it('unmount : disconnect', () => {
      const { unmount } = setup()
      const [io] = MockIO.instances
      unmount()
      expect(io.disconnect).toHaveBeenCalledTimes(1)
    })

    it('ID change: old observer disconnected, new one created', () => {
      const { rerender } = setup({ id: 'about' })
      const [first] = MockIO.instances
      rerender(
        <AnimatedSection id="projets">
          <p>contenu</p>
        </AnimatedSection>,
      )
      expect(first.disconnect).toHaveBeenCalledTimes(1)
      expect(MockIO.instances).toHaveLength(2)

      MockIO.instances[1].cb([{ isIntersecting: true }])
      expect(setCurrentSection).toHaveBeenCalledWith('projets')
    })
  })
})
