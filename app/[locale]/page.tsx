import Home from '@/app/[locale]/home/page'
import AboutMe from '@/app/[locale]/aboutMe/page'
import Projects from '@/app/[locale]/projets/page'
import Footer from '@/app/[locale]/_components/footer/footer';
import AnimatedSection from '@/app/[locale]/_components/AnimatedSection/AnimatedSection'
import PageTransition from '@/app/[locale]/_components/pageTransition/pageTransition'


export default function Root() {
  return (
    <PageTransition animate={false}>
        <AnimatedSection id="home" isHome ><Home /></AnimatedSection>
        <AnimatedSection id="about"><AboutMe /></AnimatedSection>
        <AnimatedSection id="projets"><Projects /></AnimatedSection>
        <Footer/>
    </PageTransition>
  );
}
