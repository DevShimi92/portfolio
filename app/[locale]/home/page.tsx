import { useTranslations } from 'next-intl';


export default function Home() {
  const t = useTranslations('HomePage');
  return (
    <div>
      <section>
          <p >{t('title')}</p>
      </section>
    </div>
  );
}
