import { useTranslations } from 'next-intl'
import ContactForm from '../_components/contactForm/contactForm'
import PageTransition from '../_components/pageTransition/pageTransition'
import Footer from '@/app/[locale]/_components/footer/footer';
import styles from './contact.module.css'

export default function Contact() {
  const t = useTranslations('contactPage')

  const labels = {
    emailLabel: t('emailLabel'),
    emailPlaceholder: t('emailPlaceholder'),
    messageLabel: t('messageLabel'),
    messagePlaceholder: t('messagePlaceholder'),
    submitLabel: t('submitLabel'),
    submitPending: t('submitPending'),
    successMessage: t('successMessage'),
    errorMessages: {
      invalidEmail: t('errors.invalidEmail'),
      messageTooShort: t('errors.messageTooShort'),
      messageTooLong: t('errors.messageTooLong'),
      sendFailed: t('errors.sendFailed'),
      default: t('errors.default'),
    },
  }

  return (
    <PageTransition>
       <div className={styles.page}>
         <div className={styles.section}>
           <div className={styles.container}>
             <div className={styles.title}>{t('title')}</div>
              <ContactForm labels={labels} />
            </div>
          </div>
        <Footer/>
      </div>
    </PageTransition>
  )
}
