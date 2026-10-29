import { describe, test, expect, vi, beforeEach } from 'vitest'
import { sendContactMessage, type ContactFormState } from './actions'

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}))

vi.mock('resend', () => {
  class MockResend {
    emails = { send: sendMock }
  }
  return { Resend: MockResend }
})

const initialState: ContactFormState = { status: 'idle' }

function buildFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData()
  formData.set('email', 'test@example.com')
  formData.set('message', 'Ceci est un message de test valide.')
  formData.set('startedAt', String(Date.now() - 3000))
  formData.set('website', '')
  Object.entries(overrides).forEach(([key, value]) => formData.set(key, value))
  return formData
}

describe('sendContactMessage', () => {
  beforeEach(() => {
    sendMock.mockClear()
    sendMock.mockResolvedValue({ data: {}, error: null })
  })

  test('returns success silently when honeypot is filled (bot)', async () => {
    const formData = buildFormData({ website: 'im-a-bot' })
    const result = await sendContactMessage(initialState, formData)
    expect(result.status).toBe('success')
    expect(sendMock).not.toHaveBeenCalled()
  })

  test('returns success silently when submitted too fast (bot)', async () => {
    const formData = buildFormData({ startedAt: String(Date.now()) })
    const result = await sendContactMessage(initialState, formData)
    expect(result.status).toBe('success')
    expect(sendMock).not.toHaveBeenCalled()
  })

  test('returns success silently when startedAt is missing', async () => {
    const formData = buildFormData({ startedAt: '' })
    const result = await sendContactMessage(initialState, formData)
    expect(result.status).toBe('success')
    expect(sendMock).not.toHaveBeenCalled()
  })

  test('rejects invalid email format', async () => {
    const formData = buildFormData({ email: 'not-an-email' })
    const result = await sendContactMessage(initialState, formData)
    expect(result).toEqual({ status: 'error', message: 'invalidEmail' })
    expect(sendMock).not.toHaveBeenCalled()
  })

  test('rejects message shorter than 10 characters', async () => {
    const formData = buildFormData({ message: 'short' })
    const result = await sendContactMessage(initialState, formData)
    expect(result).toEqual({ status: 'error', message: 'messageTooShort' })
    expect(sendMock).not.toHaveBeenCalled()
  })

  test('rejects message  nger than 2000 characters', async () => {
    const formData = buildFormData({ message: 'a'.repeat(2001) })
    const result = await sendContactMessage(initialState, formData)
    expect(result).toEqual({ status: 'error', message: 'messageTooLong' })
    expect(sendMock).not.toHaveBeenCalled()
  })

  test('sends email and returns success on valid submission', async () => {
    const formData = buildFormData()
    const result = await sendContactMessage(initialState, formData)
    expect(result).toEqual({ status: 'success' })
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.any(String),
        replyTo: 'test@example.com',
        subject: 'Nouveau message depuis le portfolio',
      })
    )
  })

  test('returns sendFailed error when Resend throws', async () => {
    sendMock.mockRejectedValue(new Error('network error'))
    const formData = buildFormData()
    const result = await sendContactMessage(initialState, formData)
    expect(result).toEqual({ status: 'error', message: 'sendFailed' })
  })

  test('rejects when email field is completely missing from formData', async () => {
    const formData = new FormData()
    formData.set('message', 'Message valide de plus de dix caractères.')
    formData.set('startedAt', String(Date.now() - 3000))
    formData.set('website', '')
    // pas de 'email' du tout

    const result = await sendContactMessage(initialState, formData)
    expect(result).toEqual({ status: 'error', message: 'invalidEmail' })
  })

  test('rejects when message field is completely missing from formData', async () => {
    const formData = new FormData()
    formData.set('email', 'test@example.com')
    formData.set('startedAt', String(Date.now() - 3000))
    formData.set('website', '')
    // pas de 'message' du tout

    const result = await sendContactMessage(initialState, formData)
    expect(result).toEqual({ status: 'error', message: 'messageTooShort' })
  })
})
