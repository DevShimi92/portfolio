import Home from '@/app/[locale]/home/page'
import AboutMe from '@/app/[locale]/aboutMe/page'
import Projects from '@/app/[locale]/projets/page'

export default function Root() {
  return (
      <>
        <section id="home"><Home /></section>
        <section id="about"><AboutMe /></section>
        <section id="projets"><Projects /></section>
      </>
  );
}
