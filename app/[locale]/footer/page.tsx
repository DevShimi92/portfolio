import { useTranslations } from 'next-intl'
import styles from './footer.module.css';

export default function Footer() {
  const t = useTranslations('footer')
  const text = t.raw('text') as string

  const name = process.env.LAST_FIRST_NAME ?? 'Portfolio';
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footer__row}>
        <span className={styles.footer__name}>© {year} {name}.</span>
      </div>
      <div className={styles.footer__row}>
        <a href="/humain.txt" className={styles.footer__link} target="_blank" rel="noopener noreferrer" >
          {text}
        </a>
      </div>
    </footer>
  );
}
