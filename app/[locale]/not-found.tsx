import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="error-page">
      <p className="error-label">Erreur</p>
      <h1 className="error-code">404</h1>
      <div className="error-sep" aria-hidden="true" />
      <p className="error-msg">
        Cette page n&apos;existe pas<br />
        ou a été déplacée.
      </p>
      <Link href="/" className="btn-home">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
