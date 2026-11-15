import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import Contact, { metadata } from './page'

// ── Mocks hoistés ──
const { useTranslationsMock, formProps } = vi.hoisted(() => ({
  useTranslationsMock: vi.fn(),
  formProps: { current: null as { labels: Record<string, unknown> } | null },
}))

// next-intl : t(key) renvoie la clé → on vérifie le mapping clé → label
vi.mock('next-intl', () => ({
  useTranslations: useTranslationsMock,
}))

// Enfants mockés : on teste la page, pas eux
vi.mock('../_components/contactForm/contactForm', () => ({
  default: (props: { labels: Record<string, unknown> }) => {
    formProps.current = props
    return <div data-testid="contact-form" />
  },
}))

vi.mock('../_components/pageTransition/pageTransition', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-transition">{children}</div>
  ),
}))

vi.mock('@/app/[locale]/_components/footer/footer', () => ({
  default: () => <footer data-testid="footer" />,
}))

describe('Contact page', () => {
  beforeEach(() => {
    formProps.current = null
    useTranslationsMock.mockReset()
    useTranslationsMock.mockReturnValue((key: string) => key)
  })

  test('exports the page metadata title', () => {
    expect(metadata.title).toBe('Contact')
  })

  test('uses the contactPage translation namespace', () => {
    render(<Contact />)
    expect(useTranslationsMock).toHaveBeenCalledWith('contactPage')
  })

  test('renders the translated title', () => {
    render(<Contact />)
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  test('renders the contact form, footer and page transition', () => {
    render(<Contact />)
    expect(screen.getByTestId('page-transition')).toBeInTheDocument()
    expect(screen.getByTestId('contact-form')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  test('wraps the content inside PageTransition', () => {
    render(<Contact />)
    const transition = screen.getByTestId('page-transition')
    expect(transition).toContainElement(screen.getByTestId('contact-form'))
    expect(transition).toContainElement(screen.getByTestId('footer'))
  })

  test('passes every label to ContactForm with the right translation key', () => {
    render(<Contact />)
    expect(formProps.current?.labels).toEqual({
      emailLabel: 'emailLabel',
      emailPlaceholder: 'emailPlaceholder',
      messageLabel: 'messageLabel',
      messagePlaceholder: 'messagePlaceholder',
      submitLabel: 'submitLabel',
      submitPending: 'submitPending',
      captchaPending: 'captchaPending',
      successMessage: 'successMessage',
      errorMessages: {
        invalidEmail: 'errors.invalidEmail',
        messageTooShort: 'errors.messageTooShort',
        messageTooLong: 'errors.messageTooLong',
        sendFailed: 'errors.sendFailed',
        default: 'errors.default',
        captchaFailed: 'errors.captchaFailed',
        captchaExpired: 'errors.captchaExpired',
      },
    })
  })
})
