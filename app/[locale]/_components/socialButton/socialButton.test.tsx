import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import SocialLinks, { SocialLinksInline } from './socialButton'

vi.mock('./socials', () => ({
  socials: [
    { label: 'GitHub', href: 'https://github.com/test', icon: 'github' },
    { label: 'LinkedIn', href: 'https://linkedin.com/test', icon: 'linkedin' },
  ],
}))

describe.each([
  ['SocialLinks', SocialLinks],
  ['SocialLinksInline', SocialLinksInline], // Besoin de refacto le composant pour pas a testé 2 fois la même chose
])('%s', (_name, Component) => {
  test('renders a link for each social entry', () => {
    render(<Component />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
  })

  test('renders correct href for each link', () => {
    render(<Component />)
    expect(screen.getByLabelText('GitHub')).toHaveAttribute('href', 'https://github.com/test')
    expect(screen.getByLabelText('LinkedIn')).toHaveAttribute('href', 'https://linkedin.com/test')
  })

  test('opens links in a new tab safely', () => {
    render(<Component />)
    const links = screen.getAllByRole('link')
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  test('renders aria-label matching social label', () => {
    render(<Component />)
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument()
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
  })
})
