import * as THREE from 'three';
import { AnimatedTrace }        from '@/app/types/animatedTrace';
import { TraceAnimationConfig } from '@/app/types/traceAnimationConfig';
import { initElectricArcPool, ElectricArcPool } from './electricArcs';
import {
  TRACE_SCRIPTS,
  resolveActiveTraces,
  resolveAnimationConfig,
  resolveStartupDelay,
} from './traceRegistry';

// ═══════════════════════════════════════════════════════════════
//  SCRIPT CONTROLLER
//
//  Responsabilité unique : gérer le cycle de vie des scripts.
//    — activation d'un script (reset des traces, délais, arcs)
//    — libération des ressources de l'ancien script
//
//  Reçoit les références partagées depuis index.ts (orchestrateur).
//  Expose activateScript() pour le sequencer React.
// ═══════════════════════════════════════════════════════════════

export interface ScriptController {
  activateScript:     (scriptId: string) => void;
  getActiveTraces:    () => AnimatedTrace[];
  getActiveArcPools:  () => ElectricArcPool[];
  getAnimationConfig: () => TraceAnimationConfig;
}

export function createScriptController(
  animatedTraceMap: Map<string, AnimatedTrace>,
  scene:            THREE.Scene,
): ScriptController {

  let activeAnimatedTraces:   AnimatedTrace[]      = [];
  let activeArcPools:         ElectricArcPool[]    = [];
  let currentAnimationConfig: TraceAnimationConfig;

  function activateScript(scriptId: string) {
    const script = TRACE_SCRIPTS[scriptId];
    if (!script) {
      console.warn(`[ScriptController] Script inconnu : "${scriptId}"`);
      return;
    }

    // Libère les arcs et remet le renderOrder des traces de l'ancien script
    activeArcPools.forEach(pool => {
      pool.slots.forEach(arc => scene.remove(arc.line));
    });
    activeAnimatedTraces.forEach(trace => {
      Object.values(trace.glowMeshes).forEach(mesh => { mesh.renderOrder = 0; });
    });

    activeAnimatedTraces   = [];
    activeArcPools         = [];
    currentAnimationConfig = resolveAnimationConfig(script);

    // Remet toutes les traces au plan de base avant d'activer le nouveau script
    animatedTraceMap.forEach(trace => {
      Object.values(trace.glowMeshes).forEach(mesh => { mesh.renderOrder = 0; });
    });

    resolveActiveTraces(script).forEach(traceDef => {
      const trace = animatedTraceMap.get(traceDef.traceId);
      if (!trace) return;

      const traceStartupConfig = script.startupDelays?.[traceDef.traceId];

      // Reset complet de l'état avec le délai et la distance de départ
      // définis dans ce script
      trace.animationState = {
        distanceTravelled: traceStartupConfig?.startDistance ?? 0,
        animationPhase:    'fill',
        phaseElapsedTime:  0,
        startupDelay:      resolveStartupDelay(script, traceDef.traceId),
        hasStarted:        false,
      };

      // Uniforms remis à zéro — trace visuellement inactive au repos
      [
        trace.glowMaterials.frontSurface,
        trace.glowMaterials.innerSurface,
        trace.glowMaterials.filamentCore,
      ].forEach(mat => {
        mat.uniforms.uStartDistance.value = traceStartupConfig?.startDistance ?? 0;
        mat.uniforms.uBrightness.value    = 0;
        mat.uniforms.uFrontDistance.value = traceStartupConfig?.startDistance ?? 0;
      });

      // Trace active au premier plan
      Object.values(trace.glowMeshes).forEach(mesh => { mesh.renderOrder = 1; });

      activeAnimatedTraces.push(trace);
      Object.values(trace.glowMeshes).forEach(mesh => { mesh.renderOrder = 1; });
      activeArcPools.push(
        initElectricArcPool(new THREE.Color(traceDef.glowColor), scene)
      );
    });
  }

  return {
    activateScript,
    getActiveTraces:    () => activeAnimatedTraces,
    getActiveArcPools:  () => activeArcPools,
    getAnimationConfig: () => currentAnimationConfig,
  };
}
