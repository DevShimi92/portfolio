import ThreeSceneLoader from "@/app/components/background/threeLoader"
import Home from '@/app/[locale]/home/page'

export default function Root() {
  return (
      <>
         <ThreeSceneLoader />
         <section id="home"><Home /></section>
      </>
  );
}
