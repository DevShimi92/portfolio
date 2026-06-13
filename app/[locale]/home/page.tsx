import { useTranslations, useLocale } from 'next-intl';
import HeroContent from '@/app/[locale]/_components/heroContent/HeroContent';
import styles from './home.module.css';

export default function Home() {
  const t = useTranslations('HomePage');
  const locale = useLocale();
  const disciplines = t.raw('disciplines') as string[];
  const name = process.env.LAST_FIRST_NAME ?? t('name');


  return (
    <section id="home" className={`section-full ${styles.homeSection}`}>
      <HeroContent
        name={name}
        role={t('role')}
        disciplines={disciplines}
        locale={locale}
      />
    </section>
  );
}
