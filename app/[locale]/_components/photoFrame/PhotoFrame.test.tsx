import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import PhotoFrame from './PhotoFrame'

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (_key: string) => _key
    t.raw = (_key: string) => 'Télécharger CV'
    return t
  },
}))

vi.mock('next/image', () => ({
  default: (props: React.ComponentProps<'img'>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />
  },
}))

let observeMock: (target: Element) => void
let disconnectMock: () => void
let observerCallback: (entries: Partial<IntersectionObserverEntry>[]) => void

class MockIntersectionObserver implements IntersectionObserver {
  root: Element | null = null
  rootMargin: string = ''
  scrollMargin: string = ''
  thresholds: ReadonlyArray<number> = []

  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback as (entries: Partial<IntersectionObserverEntry>[]) => void
  }

  observe = observeMock
  disconnect = disconnectMock
  unobserve = vi.fn()
  takeRecords = vi.fn(() => [])
}

beforeEach(() => {
  observeMock = vi.fn<(target: Element) => void>()
  disconnectMock = vi.fn<() => void>()
  global.IntersectionObserver = MockIntersectionObserver
})

describe('PhotoFrame', () => {
  test('renders image with provided url', () => {
    render(<PhotoFrame imgUrl="/images/me.jpg" cvUrl="/cv.pdf" />)
    const img = screen.getByAltText('Picture profile')
    expect(img).toHaveAttribute('src', '/images/me.jpg')
  })

  test('falls back to placeholder when imgUrl is empty', () => {
    render(<PhotoFrame imgUrl="" cvUrl="/cv.pdf" />)
    const img = screen.getByAltText('Picture profile')
    expect(img).toHaveAttribute('src', '/images/profile-placeholder.jpg')
  })

  test('renders download link with correct href', () => {
    render(<PhotoFrame imgUrl="/images/me.jpg" cvUrl="/cv.pdf" />)
    const link = screen.getByText('Télécharger CV')
    expect(link).toHaveAttribute('href', '/cv.pdf')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('observes wrapper on mount', () => {
    render(<PhotoFrame imgUrl="/images/me.jpg" cvUrl="/cv.pdf" />)
    expect(observeMock).toHaveBeenCalled()
  })

  test('adds draw class when intersecting', () => {
    const { container } = render(<PhotoFrame imgUrl="/images/me.jpg" cvUrl="/cv.pdf" />)
    const wrapper = container.firstChild as HTMLElement

    observerCallback([{ isIntersecting: true }])

    expect(wrapper.className).toContain('draw')
    expect(disconnectMock).toHaveBeenCalled()
  })

  test('does not add draw class when not intersecting', () => {
    const { container } = render(<PhotoFrame imgUrl="/images/me.jpg" cvUrl="/cv.pdf" />)
    const wrapper = container.firstChild as HTMLElement

    observerCallback([{ isIntersecting: false }])

    expect(wrapper.className).not.toContain('draw')
  })

  test('prevents context menu on right click', () => {
    const { container } = render(<PhotoFrame imgUrl="/images/me.jpg" cvUrl="/cv.pdf" />)
    const wrapper = container.firstChild as HTMLElement

    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    wrapper.dispatchEvent(event)
    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})
