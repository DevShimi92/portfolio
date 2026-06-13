'use client';

import { useEffect, useState } from 'react';
import styles from './HeroContent.module.css';

type Props = {
  role: string;
  name: string;
  disciplines: string[];
  locale: string;
};

export default function HeroContent({ role, name, disciplines, locale }: Props) {
  const [displayed, setDisplayed] = useState('');
  const [discIndex, setDiscIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const current = locale === 'fr'
    ? disciplines[discIndex]
    : `${disciplines[discIndex]}\n${role}`;

  useEffect(() => {
    const speed = isDeleting ? 45 : 80;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayed(current.slice(0, displayed.length + 1));
        if (displayed.length + 1 === current.length) {
          setTimeout(() => setIsDeleting(true), 1600);
        }
      } else {
        setDisplayed(current.slice(0, displayed.length - 1));
        if (displayed.length - 1 === 0) {
          setIsDeleting(false);
          setDiscIndex(i => (i + 1) % disciplines.length);
        }
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, discIndex, current, disciplines.length]);

  return (
    <div className={styles.hero}>
      <h1 className={styles.name}>{name}</h1>
      {locale === 'fr' && (
          <p className={styles.role}>{role}</p>
        )}
        <p className={styles.discipline}>
          {displayed}
          <span className={styles.cursor} aria-hidden="true">_</span>
        </p>
    </div>
  );
}
