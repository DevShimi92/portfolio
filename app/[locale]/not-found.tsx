import { useTranslations } from 'next-intl'
import Link from 'next/link';

export default function NotFound() {
  const t = useTranslations('errorNotFoundPage')
  const title = t.raw('title') as string
  const text = t.raw('text') as string
  const buttonText = t.raw('button') as string

  return (
    <main className="error-page">
      <p className="error-label">{ title }</p>
      <h1 className="error-code">404</h1>
      <div className="error-sep" aria-hidden="true" />
      <p className="error-msg">
        {text}
      </p>
      <Link href="/" className="btn-home">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {buttonText}
      </Link>
    </main>
  );
}
