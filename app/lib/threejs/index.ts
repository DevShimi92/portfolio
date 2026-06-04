import { Renderer } from './renderer';
import { buildBoard } from './buildBoard';
import { createMaterials } from './materials';

export function initThreeSceneBackground(mount: HTMLDivElement, perfLevel: string) {

  const { renderer, scene, camera, ld, cleanEventResize } = Renderer(mount,perfLevel);

  const materials = createMaterials(perfLevel);
  if(perfLevel == 'full') materials.matGlassFront.uniforms.uLightDir.value.copy(ld);

  buildBoard(scene, materials);

  return {
    renderer, camera,
    cleanup: () => {
      renderer.setAnimationLoop(null);    // stoppe la boucle
      cleanEventResize();                 // retire le listener resize
      renderer.dispose();                 // libère le contexte WebGL
    }};
}
