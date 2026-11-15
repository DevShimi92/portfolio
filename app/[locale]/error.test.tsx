import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Error from './error'

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

describe('Error (500)', () => {
  beforeEach(() => {
    messages.clear()
    namespaceSpy.mockClear()
    messages.set('title', 'Erreur serveur')
    messages.set('text', 'Quelque chose a mal tourné')
    messages.set('button', 'Retour accueil')
  })

  it('use the serverErrorPage namespace', () => {
    render(<Error />)
    expect(namespaceSpy).toHaveBeenCalledWith('serverErrorPage')
  })

  it('main.error-page', () => {
    const { container } = render(<Error />)
    expect(container.querySelector('main')).toHaveClass('error-page')
  })

  it('translated labels and messages', () => {
    render(<Error />)
    expect(screen.getByText('Erreur serveur')).toHaveClass('error-label')
    expect(screen.getByText('Quelque chose a mal tourné')).toHaveClass('error-msg')
  })

  it('h1 = 500', () => {
    render(<Error />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('500')
  })

  it('decorative divider aria-hidden', () => {
    const { container } = render(<Error />)
    expect(container.querySelector('.error-sep')).toHaveAttribute('aria-hidden', 'true')
  })

  it('back link: href "/", class, translated label', () => {
    render(<Error />)
    const link = screen.getByRole('link', { name: 'Retour accueil' })
    expect(link).toHaveAttribute('href', '/')
    expect(link).toHaveClass('btn-home')
  })

  it('link icon aria-hidden', () => {
    const { container } = render(<Error />)
    expect(container.querySelector('a svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
