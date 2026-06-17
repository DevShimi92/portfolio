import { Renderer } from './renderer/renderer';
import { buildBoard } from './board/buildBoard';
import { setCameraScroll } from './renderer/scrollCamera';
import { updateAnimatedTrace } from './traces/animatedTrace';
import { updateElectricArcs } from './traces/electricArcs';
import { createScriptController } from './traces/scriptController';
import { createScriptSequencer } from './traces/sequencer';
import { DEFAULT_SCRIPT_ROTATION } from './traces/scripts';


export function initThreeSceneBackground(mount: HTMLDivElement, perfLevel: string) {

  const { renderer, scene, camera, target, applyCamera, cleanEventResize } = Renderer(mount,perfLevel, (deltaTime: number) => onAnimationTick(deltaTime));

  const animatedTraceMap = buildBoard(scene);
  const scriptController = createScriptController(animatedTraceMap, scene);
  const sequencer        = createScriptSequencer(scriptController);

  if (perfLevel === 'full') sequencer.start(DEFAULT_SCRIPT_ROTATION);

  function onAnimationTick(deltaTime: number) {
    scriptController.getActiveEntries().forEach(({ trace, config, arcPool }) => {
      updateAnimatedTrace(trace, deltaTime, config);

      const brightness = !trace.animationState.hasStarted
        ? 0
        : trace.animationState.animationPhase === 'fade'
          ? Math.max(0, 1 - trace.animationState.phaseElapsedTime / config.fadeDuration)
          : 1;

      updateElectricArcs(
        arcPool,
        trace.traceSegments,
        trace.animationState.distanceTravelled,
        trace.animationState.startDistance,
        brightness,
        deltaTime,
        config
      );
    });

    sequencer.tick();
  }

  return {
    renderer, camera,
    playTriggeredScript: sequencer.playTriggeredScript,
    releaseTriggered:    sequencer.releaseTriggered,
    setCameraScroll: (scrollProgress: number) => setCameraScroll(scrollProgress, target, applyCamera),
    cleanup: () => {
      renderer.setAnimationLoop(null);        // stoppe la boucle
      cleanEventResize();                     // retire le listener resize
      scriptController.deactivate();          // libère arcs + renderOrder (anti-fuite)
      mount.removeChild(renderer.domElement)  // retire le canvas du DOM
      renderer.dispose();                     // libère le contexte WebGL
    }};
}
