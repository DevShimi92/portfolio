import { Renderer } from './renderer';
import { buildBoard } from './buildBoard';
import { createMaterials } from './materials';

export function initThreeSceneBackground(mount: HTMLDivElement) {

  const { renderer, scene, camera, ld, cleanEventResize } = Renderer(mount);

  const materials = createMaterials();
  materials.matGlassFront.uniforms.uLightDir.value.copy(ld);

  buildBoard(scene, materials);

  return {
    renderer, camera,
    cleanup: () => {
      renderer.setAnimationLoop(null);    // stoppe la boucle
      cleanEventResize();                 // retire le listener resize
      renderer.dispose();                 // libère le contexte WebGL
    }};
}
