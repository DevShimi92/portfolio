'use client'
import { useActionState, useState } from 'react'
import { sendContactMessage, type ContactFormState } from './actions'
import styles from './contactForm.module.css'

type Labels = {
  emailLabel: string
  emailPlaceholder: string
  messageLabel: string
  messagePlaceholder: string
  submitLabel: string
  submitPending: string
  successMessage: string
  errorMessages: Record<string, string>
}

const initialState: ContactFormState = { status: 'idle' }

export default function ContactForm({ labels }: { labels: Labels }) {
  const [state, formAction, isPending] = useActionState(contactAction, initialState)
  const [startedAt] = useState(() => Date.now())
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const isError = state.status === 'error'

  async function contactAction(prevState: ContactFormState, formData: FormData) {
    const result = await sendContactMessage(prevState, formData)
    if (result.status === 'success') {
      setEmail('')
      setMessage('')
    }
    return result
  }

  return (
    <form action={formAction} className={styles.form}>
      {/* Honeypot */}
      <input
        type="text"
        name="website"
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

      <button type="submit" className={styles.submit} disabled={isPending}>
        {isPending ? labels.submitPending : labels.submitLabel}
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
