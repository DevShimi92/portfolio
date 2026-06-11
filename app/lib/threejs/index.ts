import * as THREE from 'three';
import { Renderer } from './renderer';
import { buildBoard } from './buildBoard';
import { AnimatedTrace } from '@/app/types/animatedTrace';
import { updateAnimatedTrace } from './animatedTrace';
import { initElectricArcPool, updateElectricArcs, ElectricArcPool } from './electricArcs';
import { createScriptController } from './scriptController';
import { TRACE_SCRIPTS, DEFAULT_SCRIPT, resolveActiveTraces, resolveAnimationConfig } from './traceRegistry';


export function initThreeSceneBackground(mount: HTMLDivElement, perfLevel: string) {

  const { renderer, scene, camera, cleanEventResize } = Renderer(mount,perfLevel, (deltaTime: number) => onAnimationTick(deltaTime));

  // buildBoard construit toute la scène et retourne les traces animables
  const animatedTraceMap = buildBoard(scene);
  const scriptController = createScriptController(animatedTraceMap, scene);

   if (perfLevel === 'full')scriptController.activateScript(DEFAULT_SCRIPT);

  // Appelé par renderer.ts à chaque frame via le callback onAnimationTick
  function onAnimationTick(deltaTime: number) {
      const traces  = scriptController.getActiveTraces();
      const pools   = scriptController.getActiveArcPools();
      const config  = scriptController.getAnimationConfig();

      traces.forEach((trace, i) => {
        updateAnimatedTrace(trace, deltaTime, config);

        const brightness = !trace.animationState.hasStarted
          ? 0
          : trace.animationState.animationPhase === 'fade'
            ? Math.max(0, 1 - trace.animationState.phaseElapsedTime / config.fadeDuration)
            : 1;

        updateElectricArcs(
          pools[i],
          trace.traceSegments,
          trace.animationState.distanceTravelled,
          brightness,
          deltaTime,
          config
        );
      });
    }

  return {
    renderer, camera,
    activateScript: scriptController.activateScript,
    cleanup: () => {
      renderer.setAnimationLoop(null);        // stoppe la boucle
      cleanEventResize();                     // retire le listener resize
      mount.removeChild(renderer.domElement)  // retire le canvas du DOM
      renderer.dispose();                     // libère le contexte WebGL
    }};
}
