import PageTransition from '../_components/pageTransition/pageTransition'
import Footer from '@/app/[locale]/_components/footer/footer';
import styles from './contact.module.css'
import { getArticle } from '@/app/lib/articles'


export default async function Articles() {

  const article = await getArticle('exemple-homelab-proxmox', 'fr')

  return (
    <PageTransition>
      <div>
        {article?.contentHtml}
        <Footer/>
      </div>
    </PageTransition>
  )
}
