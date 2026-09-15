import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import Footer from './footer'

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => key
    t.raw = (_key: string) => 'Texte de test'
    return t
  },
}))

describe('Footer', () => {
  test('Renders copyright with current year', () => {
    render(<Footer />)
    const year = new Date().getFullYear()
    expect(screen.getByText(`© ${year} Portfolio.`)).toBeInTheDocument()
  })

  test('Renders translated link text', () => {
    render(<Footer />)
    expect(screen.getByText('Texte de test')).toBeInTheDocument()
  })

  test('Link to humain.txt', () => {
    render(<Footer />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/humain.txt')
  })
})
