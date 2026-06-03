import { Renderer } from './renderer';
import { buildBoard } from './buildBoard'

export function initThreeSceneBackground(mount: HTMLDivElement) {

  const { renderer, scene, camera, cleanEventResize } = Renderer(mount);
  buildBoard(scene);

  return {
    renderer, camera,
    cleanup: () => {
        renderer.setAnimationLoop(null)    // stoppe la boucle
        cleanEventResize()                 // retire le listener resize
        renderer.dispose()                 // libère le contexte WebGL
    }};
}
