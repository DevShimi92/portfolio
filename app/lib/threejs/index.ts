import * as THREE from 'three';
import { Renderer } from './renderer';
import { buildBoard } from './buildBoard';
import { AnimatedTrace } from '@/app/types/animatedTrace';
import { updateAnimatedTrace } from './animatedTrace';
import { initElectricArcPool, updateElectricArcs, ElectricArcPool } from './electricArcs';
import { TRACE_SCRIPTS, DEFAULT_SCRIPT, resolveActiveTraces, resolveAnimationConfig } from './traceRegistry';


export function initThreeSceneBackground(mount: HTMLDivElement, perfLevel: string) {

  const { renderer, scene, camera, cleanEventResize } = Renderer(mount,perfLevel, (deltaTime: number) => onAnimationTick(deltaTime));

  // buildBoard construit toute la scène et retourne les traces animables
   const animatedTraceMap = buildBoard(scene);

   const activeAnimatedTraces: AnimatedTrace[]  = [];
   const activeArcPools:       ElectricArcPool[] = [];

   let currentAnimationConfig = resolveAnimationConfig(TRACE_SCRIPTS[DEFAULT_SCRIPT]);

   if (perfLevel === 'full') {
     const activeScript = TRACE_SCRIPTS[DEFAULT_SCRIPT];
     currentAnimationConfig = resolveAnimationConfig(activeScript);

     resolveActiveTraces(activeScript).forEach(traceDef => {
       const trace = animatedTraceMap.get(traceDef.traceId);
       if (!trace) return; // traceId non construit dans buildBoard — ignoré silencieusement

       activeAnimatedTraces.push(trace);
       activeArcPools.push(initElectricArcPool(new THREE.Color(traceDef.glowColor), scene));
     });
   }

  // Appelé par renderer.ts à chaque frame via le callback onAnimationTick
  function onAnimationTick(deltaTime: number) {
    activeAnimatedTraces.forEach((trace, i) => {
      updateAnimatedTrace(trace, deltaTime, currentAnimationConfig);

      // Brightness calculée depuis la phase courante — transmise aux arcs
      const brightness = !trace.animationState.hasStarted
        ? 0
        : trace.animationState.animationPhase === 'fade'
          ? Math.max(0, 1 - trace.animationState.phaseElapsedTime / currentAnimationConfig.fadeDuration)
          : 1;

      updateElectricArcs(
        activeArcPools[i],
        trace.traceSegments,
        trace.animationState.distanceTravelled,
        brightness,
        deltaTime,
        currentAnimationConfig
      );
    });
  }

  return {
    renderer, camera,
    cleanup: () => {
      renderer.setAnimationLoop(null);        // stoppe la boucle
      cleanEventResize();                     // retire le listener resize
      mount.removeChild(renderer.domElement)  // retire le canvas du DOM
      renderer.dispose();                     // libère le contexte WebGL
    }};
}
