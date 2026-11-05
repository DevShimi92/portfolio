'use client'
import { useActionState, useState, useRef } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { sendContactMessage, type ContactFormState } from './actions'
import styles from './contactForm.module.css'

type Labels = {
  emailLabel: string
  emailPlaceholder: string
  messageLabel: string
  messagePlaceholder: string
  submitLabel: string
  captchaPending: string
  submitPending: string
  successMessage: string
  errorMessages: Record<string, string>
}

const initialState: ContactFormState = { status: 'idle' }

const TurnstileSiteKey = String(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

export default function ContactForm({ labels }: { labels: Labels }) {
  const [state, formAction, isPending] = useActionState(contactAction, initialState)
  const [startedAt] = useState(() => Date.now())
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const isError = state.status === 'error'
  const turnstileRef = useRef<TurnstileInstance>(null)
  const [captchaReady, setCaptchaReady] = useState(false)

  async function contactAction(prevState: ContactFormState, formData: FormData) {
    const result = await sendContactMessage(prevState, formData)
    if (result.status === 'success') {
      setEmail('')
      setMessage('')
    }
    turnstileRef.current?.reset()
    setCaptchaReady(false)
    return result
  }

  return (
    <form action={formAction} className={styles.form}>
      {/* Honeypot */}
      <input
        type="text"
        name="company_url"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className={styles.honeypot}
      />
      <input type="hidden" name="startedAt" value={startedAt} />

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>{labels.emailLabel}</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder={labels.emailPlaceholder}
          className={styles.input}
          disabled={isPending}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="message" className={styles.label}>{labels.messageLabel}</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          placeholder={labels.messagePlaceholder}
          className={styles.textarea}
          disabled={isPending}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <Turnstile
        ref={turnstileRef} siteKey={TurnstileSiteKey} options={{ theme: 'auto', size: 'flexible', appearance: 'interaction-only', refreshExpired: 'auto' }}
        onSuccess={() => setCaptchaReady(true)} onExpire={() => setCaptchaReady(false)} onError={() => setCaptchaReady(false)}
      />

      <button type="submit" className={styles.submit} disabled={isPending || !captchaReady}>
        {isPending ? labels.submitPending
          : !captchaReady ? labels.captchaPending
          : labels.submitLabel}
      </button>

      {state.status === 'success' && (
        <p className={styles.statusSuccess} role="status">{labels.successMessage}</p>
      )}
      {isError && (
        <p className={styles.statusError} role="alert">
          {labels.errorMessages[state.message ?? ''] ?? labels.errorMessages.default}
        </p>
      )}
    </form>
  )
}
