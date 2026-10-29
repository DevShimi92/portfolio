import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import ContactForm from './contactForm'
import { sendContactMessage } from './actions'

vi.mock('./actions', () => ({
  sendContactMessage: vi.fn(),
}))

const labels = {
  emailLabel: 'Email',
  emailPlaceholder: 'votre@email.com',
  messageLabel: 'Message',
  messagePlaceholder: 'Votre message',
  submitLabel: 'Envoyer',
  submitPending: 'Envoi...',
  successMessage: 'Message envoyé avec succès',
  errorMessages: {
    invalidEmail: 'Email invalide',
    messageTooShort: 'Message trop court',
    messageTooLong: 'Message trop long',
    sendFailed: 'Échec de l\'envoi',
    default: 'Une erreur est survenue',
  },
}

describe('ContactForm', () => {
  beforeEach(() => {
    vi.mocked(sendContactMessage).mockClear()
  })

  test('renders all form fields', () => {
    render(<ContactForm labels={labels} />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeInTheDocument()
  })

  test('honeypot field is hidden from real users', () => {
    render(<ContactForm labels={labels} />)
    const honeypot = document.querySelector('input[name="website"]')
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
})
