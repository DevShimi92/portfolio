'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const targetMail = String(process.env.CONTACT_TARGET_EMAIL)

export type ContactFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_SUBMIT_DELAY_MS = 2000

export async function sendContactMessage(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // ── Honeypot : champ rempli → bot, faux succès ──
  if (formData.get('website')) {
    return { status: 'success' }
  }

  // ── Délai de soumission trop court → bot ──
  const startedAt = Number(formData.get('startedAt'))
  if (!startedAt || Date.now() - startedAt < MIN_SUBMIT_DELAY_MS) {
    return { status: 'success' }
  }

  // ── Validation serveur ──
  const email = String(formData.get('email') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()

  if (!EMAIL_REGEX.test(email)) {
    return { status: 'error', message: 'invalidEmail' }
  }
  if (message.length < 10) {
    return { status: 'error', message: 'messageTooShort' }
  }
  if (message.length > 2000) {
    return { status: 'error', message: 'messageTooLong' }
  }

  // ── Envoi via Resend ──
  try {
    await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: targetMail,
      replyTo: email,
      subject: 'Nouveau message depuis le portfolio',
      text: `De : ${email}\n\n${message}`,
    })
    return { status: 'success' }
  } catch (err) {
    console.error('Resend error:', err)
    return { status: 'error', message: 'sendFailed' }
    }
}
