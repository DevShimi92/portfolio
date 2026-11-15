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

// False positive : the input does not come from the user.
// eslint-disable-next-line security/detect-object-injection
const base = disciplines[discIndex] ?? '';
const current = locale === 'fr' ? base : `${base}\n${role}`;

useEffect(() => {
  if (!disciplines.length) return;

  const fullyTyped = !isDeleting && displayed === current;
  const delay = fullyTyped ? 1600 : isDeleting ? 45 : 80;

  const timeout = setTimeout(() => {
    if (fullyTyped) {
      setIsDeleting(true);
      return;
    }
    if (!isDeleting) {
      setDisplayed(current.slice(0, displayed.length + 1));
    } else {
      const next = current.slice(0, displayed.length - 1);
      setDisplayed(next);
      if (next.length === 0) {
        setIsDeleting(false);
        setDiscIndex(i => (i + 1) % disciplines.length);
      }
    }
  }, delay);

  return () => clearTimeout(timeout);
}, [displayed, isDeleting, current, disciplines.length]);

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
