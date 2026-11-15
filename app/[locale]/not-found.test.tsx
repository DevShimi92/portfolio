import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotFound from './not-found'

const { messages, namespaceSpy } = vi.hoisted(() => ({
  messages: new Map<string, unknown>(),
  namespaceSpy: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => {
    namespaceSpy(ns)
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

describe('NotFound (404)', () => {
  beforeEach(() => {
    messages.clear()
    namespaceSpy.mockClear()
    messages.set('title', 'Page introuvable')
    messages.set('text', 'Cette page n’existe pas')
    messages.set('button', 'Retour accueil')
  })

  it('uses the errorNotFoundPage namespace', () => {
    render(<NotFound />)
    expect(namespaceSpy).toHaveBeenCalledWith('errorNotFoundPage')
  })

  it('main.error-page', () => {
    const { container } = render(<NotFound />)
    expect(container.querySelector('main')).toHaveClass('error-page')
  })

  it('translated labels and messages', () => {
    render(<NotFound />)
    expect(screen.getByText('Page introuvable')).toHaveClass('error-label')
    expect(screen.getByText('Cette page n’existe pas')).toHaveClass('error-msg')
  })

  it('h1 = 404', () => {
    render(<NotFound />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404')
  })

  it('decorative divider aria-hidden', () => {
    const { container } = render(<NotFound />)
    expect(container.querySelector('.error-sep')).toHaveAttribute('aria-hidden', 'true')
  })

  it('back link: href "/", class, translated label', () => {
    render(<NotFound />)
    const link = screen.getByRole('link', { name: 'Retour accueil' })
    expect(link).toHaveAttribute('href', '/')
    expect(link).toHaveClass('btn-home')
  })

  it('link icon aria-hidden', () => {
    const { container } = render(<NotFound />)
    expect(container.querySelector('a svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
