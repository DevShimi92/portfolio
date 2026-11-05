import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import ContactForm from './contactForm'
import { sendContactMessage } from './actions'

vi.mock('./actions', () => ({
  sendContactMessage: vi.fn(),
}))

const { resetMock, captchaState } = vi.hoisted(() => ({
  resetMock: vi.fn(),
  captchaState: {
    autoSuccess: true,
    onExpire: undefined as (() => void) | undefined,
    onError: undefined as (() => void) | undefined,
  },
}))

vi.mock('@marsidev/react-turnstile', async () => {
  const React = await import('react')
  return {
    Turnstile: React.forwardRef(function MockTurnstile(
      { onSuccess, onExpire, onError }: {
        onSuccess?: () => void
        onExpire?: () => void
        onError?: () => void
      },
      ref: React.Ref<{ reset: () => void }>
    ) {
      captchaState.onExpire = onExpire
      captchaState.onError = onError
      const onSuccessRef = React.useRef(onSuccess)
      onSuccessRef.current = onSuccess

      React.useImperativeHandle(ref, () => ({
        reset: () => {
          resetMock()
          if (captchaState.autoSuccess) {
            // simule le nouveau challenge : token async
            setTimeout(() => onSuccessRef.current?.(), 0)
          }
        },
      }))
      React.useEffect(() => {
        if (captchaState.autoSuccess) onSuccessRef.current?.()
      }, [])
      return null
    }),
  }
})

const labels = {
  emailLabel: 'Email',
  emailPlaceholder: 'votre@email.com',
  messageLabel: 'Message',
  messagePlaceholder: 'Votre message',
  submitLabel: 'Envoyer',
  submitPending: 'Envoi...',
  successMessage: 'Message envoyé avec succès',
  captchaPending: 'Vérification...',
  errorMessages: {
    invalidEmail: 'Email invalide',
    messageTooShort: 'Message trop court',
    messageTooLong: 'Message trop long',
    sendFailed: 'Échec de l\'envoi',
    default: 'Une erreur est survenue',
    captchaFailed: 'Échec de la vérification',
    captchaExpired: 'Vérification expirée',
  },
}

describe('ContactForm', () => {
  beforeEach(() => {
    vi.mocked(sendContactMessage).mockClear()
    resetMock.mockClear()
    captchaState.autoSuccess = true
  })

  test('renders all form fields', () => {
    render(<ContactForm labels={labels} />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeInTheDocument()
  })

  test('honeypot field is hidden from real users', () => {
    render(<ContactForm labels={labels} />)
    const honeypot = document.querySelector('input[name="company_url"]')
    expect(honeypot).toHaveAttribute('aria-hidden', 'true')
    expect(honeypot).toHaveAttribute('tabIndex', '-1')
  })

  test('updates email input value on change', async () => {
    const user = userEvent.setup()
    render(<ContactForm labels={labels} />)
    const emailInput = screen.getByLabelText('Email')

    await user.type(emailInput, 'test@example.com')
    expect(emailInput).toHaveValue('test@example.com')
  })

  test('updates message textarea value on change', async () => {
    const user = userEvent.setup()
    render(<ContactForm labels={labels} />)
    const messageInput = screen.getByLabelText('Message')

    await user.type(messageInput, 'Mon message')
    expect(messageInput).toHaveValue('Mon message')
  })

  test('displays success message and clears fields on successful submission', async () => {
    vi.mocked(sendContactMessage).mockResolvedValue({ status: 'success' })
    const user = userEvent.setup()

    render(<ContactForm labels={labels} />)
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Message'), 'Un message valide de test.')
    await user.click(screen.getByRole('button', { name: 'Envoyer' }))

    expect(await screen.findByText('Message envoyé avec succès')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Message')).toHaveValue('')
  })

  test('displays known error message on failed submission', async () => {
    vi.mocked(sendContactMessage).mockResolvedValue({ status: 'error', message: 'invalidEmail' })
    const user = userEvent.setup()

    const { container } = render(<ContactForm labels={labels} />)
    await user.type(screen.getByLabelText('Email'), 'bad-email')
    await user.type(screen.getByLabelText('Message'), 'Un message valide de test.')

    const form = container.querySelector('form')
    if (!form) throw new Error('form not found')
    await act(async () => {
      fireEvent.submit(form)
    })

    expect(await screen.findByText('Email invalide')).toBeInTheDocument()
  })

  test('displays default error message for unknown error key', async () => {
    vi.mocked(sendContactMessage).mockResolvedValue({ status: 'error', message: 'unknownKey' })
    const user = userEvent.setup()

    render(<ContactForm labels={labels} />)
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Message'), 'Un message valide de test.')
    await user.click(screen.getByRole('button', { name: 'Envoyer' }))

    expect(await screen.findByText('Une erreur est survenue')).toBeInTheDocument()
  })

  test('does not clear fields on error', async () => {
    vi.mocked(sendContactMessage).mockResolvedValue({ status: 'error', message: 'invalidEmail' })
    const user = userEvent.setup()

    const { container } = render(<ContactForm labels={labels} />)
    await user.type(screen.getByLabelText('Email'), 'bad-email')
    await user.type(screen.getByLabelText('Message'), 'Un message valide de test.')
    const form = container.querySelector('form')
    if (!form) throw new Error('form not found')
      await act(async () => {
        fireEvent.submit(form)
      })

    await screen.findByText('Email invalide')
    expect(screen.getByLabelText('Email')).toHaveValue('bad-email')
  })

  test('displays default error message when error has no message', async () => {
    vi.mocked(sendContactMessage).mockResolvedValue({ status: 'error' })
    const user = userEvent.setup()

    const { container } = render(<ContactForm labels={labels} />)
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Message'), 'Un message valide de test.')

    const form = container.querySelector('form')
    if (!form) throw new Error('form not found')

    await act(async () => {
      fireEvent.submit(form)
    })

    expect(await screen.findByText('Une erreur est survenue')).toBeInTheDocument()
  })

  test('button is disabled and shows captchaPending until captcha is ready', () => {
    captchaState.autoSuccess = false
    render(<ContactForm labels={labels} />)
    const btn = screen.getByRole('button', { name: 'Vérification...' })
    expect(btn).toBeDisabled()
  })

  test('button is enabled once captcha succeeds', () => {
    render(<ContactForm labels={labels} />)
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeEnabled()
  })

  test('resets captcha after successful submission', async () => {
    vi.mocked(sendContactMessage).mockResolvedValue({ status: 'success' })
    const user = userEvent.setup()
    render(<ContactForm labels={labels} />)
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Message'), 'Un message valide de test.')
    await user.click(screen.getByRole('button', { name: 'Envoyer' }))

    await screen.findByText('Message envoyé avec succès')
    expect(resetMock).toHaveBeenCalledTimes(1)
  })

  test.each([
    ['captchaFailed', 'Échec de la vérification'],
    ['captchaExpired', 'Vérification expirée'],
  ])('displays %s error message', async (key, text) => {
    vi.mocked(sendContactMessage).mockResolvedValue({ status: 'error', message: key })
    const user = userEvent.setup()
    render(<ContactForm labels={labels} />)
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Message'), 'Un message valide de test.')
    await user.click(screen.getByRole('button', { name: 'Envoyer' }))

    expect(await screen.findByText(text)).toBeInTheDocument()
  })

  test('button is re-enabled with a new token after reset', async () => {
    vi.mocked(sendContactMessage).mockResolvedValue({ status: 'error', message: 'invalidEmail' })
    const user = userEvent.setup()
    render(<ContactForm labels={labels} />)
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Message'), 'Un message valide de test.')
    await user.click(screen.getByRole('button', { name: 'Envoyer' }))

    await screen.findByText('Email invalide')
    expect(resetMock).toHaveBeenCalledTimes(1)
    // nouveau token → bouton réactivé
    expect(await screen.findByRole('button', { name: 'Envoyer' })).toBeEnabled()
  })

  test('disables button when captcha token expires', () => {
    render(<ContactForm labels={labels} />)
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeEnabled()

    act(() => captchaState.onExpire?.())

    expect(screen.getByRole('button', { name: 'Vérification...' })).toBeDisabled()
  })

  test('disables button when captcha errors', () => {
    render(<ContactForm labels={labels} />)
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeEnabled()

    act(() => captchaState.onError?.())

    expect(screen.getByRole('button', { name: 'Vérification...' })).toBeDisabled()
  })
})
