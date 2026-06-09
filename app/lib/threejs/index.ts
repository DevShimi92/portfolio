import * as THREE from 'three';
import { Renderer } from './renderer';
import { buildBoard } from './buildBoard';
import { createMaterials } from './materials';
import { AnimatedTrace } from '@/app/types/animatedTrace';
import { initAnimatedTrace, updateAnimatedTrace } from './animatedTrace';
import { initElectricArcPool, updateElectricArcs, ElectricArcPool } from './electricArcs';
import { TRACE_SCRIPTS, DEFAULT_SCRIPT, resolveActiveTraces, resolveAnimationConfig } from './traceRegistry';


let currentAnimationConfig = resolveAnimationConfig(TRACE_SCRIPTS[DEFAULT_SCRIPT]);

export function initThreeSceneBackground(mount: HTMLDivElement, perfLevel: string) {

  const { renderer, scene, camera, lightDirection, cleanEventResize } = Renderer(mount,perfLevel, (deltaTime: number) => onAnimationTick(deltaTime));

  const materials = createMaterials(perfLevel);
  if(perfLevel == 'full') materials.matGlassFront.uniforms.uLightDir.value.copy(lightDirection);

  buildBoard(scene, materials);

  const activeAnimatedTraces: AnimatedTrace[] = [];
  const activeArcPools:       ElectricArcPool[] = [];

  if (perfLevel === 'full') {
    const activeScript        = TRACE_SCRIPTS[DEFAULT_SCRIPT];
    const activeTracesDefs    = resolveActiveTraces(activeScript);
    const activeConfig        = resolveAnimationConfig(activeScript);

    activeTracesDefs.forEach(traceDef => {
      const initializedTrace = initAnimatedTrace(
        traceDef.waypointsInGrid,
        new THREE.Color(traceDef.glowColor),
        traceDef.startupDelay,
        scene
      );
      activeAnimatedTraces.push(initializedTrace);

      const arcPool = initElectricArcPool(
        new THREE.Color(traceDef.glowColor),
        scene
      );
      activeArcPools.push(arcPool);

    });

    // On stocke la config résolue pour qu'elle soit accessible
    // dans le tick sans avoir à la recalculer à chaque frame
    currentAnimationConfig = activeConfig;

  }

  // Appelé par renderer.ts à chaque frame via le callback onAnimationTick
  function onAnimationTick(deltaTime: number) {
    activeAnimatedTraces.forEach((animatedTrace, traceIndex) => {
      updateAnimatedTrace(animatedTrace, deltaTime, currentAnimationConfig);

      const brightness = !animatedTrace.animationState.hasStarted
          ? 0
          : animatedTrace.animationState.animationPhase === 'fade'
            ? Math.max(0, 1 - animatedTrace.animationState.phaseElapsedTime / currentAnimationConfig.fadeDuration)
            : 1;

      updateElectricArcs(
        activeArcPools[traceIndex],
        animatedTrace.traceSegments,
        animatedTrace.animationState.distanceTravelled,
        brightness,   // calculé depuis la phase courante
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
