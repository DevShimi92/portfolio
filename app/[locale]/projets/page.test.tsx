import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Projets from './page'

const { messages } = vi.hoisted(() => ({
  messages: new Map<string, unknown>(),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => messages.get(key) as string
    t.raw = (key: string) => messages.get(key)
    return t
  },
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

type Slide = {
  title: string
  label: string
  description: string
  isHobby?: boolean
  video: { src: string } | null
  href?: string
  hrefLabel?: string
}

const SLIDES: Slide[] = [
  {
    title: 'Alpha', label: 'Web', description: 'Desc A', isHobby: false,
    video: { src: '/a.webm' }, href: 'https://a.dev', hrefLabel: 'Voir A',
  },
  { title: 'Beta', label: 'Cyber', description: 'Desc B', isHobby: true, video: null },
  { title: 'Gamma', label: '3D', description: 'Desc C', isHobby: false, video: { src: '/c.webm' } },
]

function setup(slides: Slide[] = SLIDES) {
  messages.set('title', 'Projets')
  messages.set('projects', slides)
  return render(<Projets />)
}

const nextBtn = () => screen.getByRole('button', { name: 'Catégorie suivante' })
const prevBtn = () => screen.getByRole('button', { name: 'Catégorie précédente' })
const info = () => document.querySelector('[aria-expanded]') as HTMLElement
const spinner = (c: HTMLElement) => c.querySelector('[class*="spinner"]')
const videoEl = (c: HTMLElement) => c.querySelector('video') as HTMLVideoElement
const wait = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })
const go = (btn: HTMLElement) => {
  fireEvent.click(btn)
  wait(200)
}

describe('Projets', () => {
  beforeEach(() => {
    messages.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial rendering', () => {
    it('titre h2', () => {
      setup()
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Projets')
    })

    it('label, h3 title, and description for the 1st slide', () => {
      setup()
      expect(screen.getByText('Web')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Alpha')
      expect(screen.getByText('Desc A')).toBeInTheDocument()
    })

    it('no Hobby badge if isHobby=false', () => {
      setup()
      expect(screen.queryByText('Hobby')).not.toBeInTheDocument()
    })

    it('info block visible (isVisible) in its resting state', () => {
      setup()
      expect(info().className).toContain('isVisible')
    })
  })

  describe('vidéo / placeholder', () => {
    it('vidéo : src, loop, muted, autoplay, playsInline, aria-label', () => {
      const { container } = setup()
      const v = videoEl(container)
      expect(v).toHaveAttribute('src', '/a.webm')
      expect(v.loop).toBe(true)
      expect(v.muted).toBe(true)
      expect(v.autoplay).toBe(true)
      expect(v.playsInline).toBe(true)
      expect(v).toHaveAttribute('aria-label', 'Aperçu Alpha')
    })

    it('spinner displayed while "canplay" has not been emitted; removed afterwards', () => {
      const { container } = setup()
      expect(spinner(container)).toBeInTheDocument()
      fireEvent.canPlay(videoEl(container))
      expect(spinner(container)).not.toBeInTheDocument()
    })

    it('placeholder if video is null : label "<titre>.webm", no <video>', () => {
      const { container } = setup()
      go(nextBtn())
      expect(screen.getByText('beta.webm')).toBeInTheDocument()
      expect(container.querySelector('video')).not.toBeInTheDocument()
    })

    it('transition to another video slide: spinner reappears (remounts)', () => {
      const { container } = setup()
      fireEvent.canPlay(videoEl(container))
      expect(spinner(container)).not.toBeInTheDocument()
      go(prevBtn()) // wrap → Gamma
      expect(videoEl(container)).toHaveAttribute('src', '/c.webm')
      expect(spinner(container)).toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('next: content changes after 200ms, not before', () => {
      setup()
      fireEvent.click(nextBtn())
      wait(199)
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Alpha')
      wait(1)
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Beta')
    })

    it('previous from 0: wrap to the last', () => {
      setup()
      go(prevBtn())
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Gamma')
    })

    it('next after the last: wrap to the first', () => {
      setup()
      go(prevBtn()) // Gamma
      go(nextBtn())
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Alpha')
    })

    it('clicks during animation ignored', () => {
      setup()
      fireEvent.click(nextBtn())
      fireEvent.click(nextBtn())
      fireEvent.click(nextBtn())
      wait(200)
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Beta')
    })

    it('during the animation: gifBlock isHidden, info without isVisible', () => {
      const { container } = setup()
      fireEvent.click(nextBtn())
      expect(container.querySelector('[class*="gifBlock"]')?.className).toContain('isHidden')
      expect(info().className).not.toContain('isVisible')
      wait(200)
      expect(container.querySelector('[class*="gifBlock"]')?.className).not.toContain('isHidden')
      expect(info().className).toContain('isVisible')
    })

    it('Hobby badge displayed on the isHobby slide', () => {
      setup()
      go(nextBtn())
      expect(screen.getByText('Hobby').className).toContain('isVisible')
    })

    it('Hobby badge disappears during the animation', () => {
      setup()
      go(nextBtn()) // Beta (hobby)
      expect(screen.getByText('Hobby').className).toContain('isVisible')

      fireEvent.click(nextBtn()) // animation en cours, slide courant = Beta
      expect(screen.getByText('Hobby').className).not.toContain('isVisible')

      wait(200) // Gamma, non hobby
      expect(screen.queryByText('Hobby')).not.toBeInTheDocument()
    })
  })

  describe('tiroir (expand)', () => {
    it('click toggle aria-expanded', () => {
      setup()
      expect(info()).toHaveAttribute('aria-expanded', 'false')
      fireEvent.click(info())
      expect(info()).toHaveAttribute('aria-expanded', 'true')
      fireEvent.click(info())
      expect(info()).toHaveAttribute('aria-expanded', 'false')
    })

    it('Enter toggle, another touch non', () => {
      setup()
      fireEvent.keyDown(info(), { key: 'a' })
      expect(info()).toHaveAttribute('aria-expanded', 'false')
      fireEvent.keyDown(info(), { key: 'Enter' })
      expect(info()).toHaveAttribute('aria-expanded', 'true')
    })

    it('tabIndex 0', () => {
      setup()
      expect(info()).toHaveAttribute('tabindex', '0')
    })

    it('reset at the navigation', () => {
      setup()
      fireEvent.click(info())
      expect(info()).toHaveAttribute('aria-expanded', 'true')
      go(nextBtn())
      expect(info()).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('link projet', () => {
    it('href, target _blank, rel noopener, label', () => {
      setup()
      const link = screen.getByRole('link', { name: /Voir A/ })
      expect(link).toHaveAttribute('href', 'https://a.dev')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('clicking the link does not toggle the drawer', () => {
      setup()
      fireEvent.click(screen.getByRole('link', { name: /Voir A/ }))
      expect(info()).toHaveAttribute('aria-expanded', 'false')
    })

    it('no link if href is absent', () => {
      setup()
      go(nextBtn())
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })

})
