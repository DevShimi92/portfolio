import Home from '@/app/[locale]/home/page'
import AboutMe from '@/app/[locale]/aboutMe/page'

export default function Root() {
  return (
      <>
        <section id="home"><Home /></section>
        <section id="about"><AboutMe /></section>
      </>
  );
}
