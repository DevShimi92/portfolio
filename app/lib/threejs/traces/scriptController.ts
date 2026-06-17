import * as THREE from 'three';
import { AnimatedTrace }        from '@/app/types/animatedTrace';
import { TraceAnimationConfig } from '@/app/types/traceAnimationConfig';
import { initElectricArcPool, ElectricArcPool } from './electricArcs';
import {
  resolveActiveTraces,
  resolveTraceConfig,
  resolveStartupDelay,
} from './registry';
import { TRACE_SCRIPTS } from './scripts';

// ═══════════════════════════════════════════════════════════════
//  SCRIPT CONTROLLER
//
//  Responsabilité unique : gérer le cycle de vie d'UN script actif.
//    — activation d'un script (reset des traces, délais, arcs)
//    — libération des ressources de l'ancien script (sans fuite)
//    — exposition de l'état pour la boucle d'anim et le sequencer
//
//  Reste mono-script : le sequencer (scriptSequencer.ts) orchestre
//  la rotation / les scripts déclenchés par-dessus ce contrôleur.
//
//  Chaque trace active porte SA PROPRE config résolue
//  (ActiveTraceEntry) — c'est ce qui permet des réglages par trace
//  (vitesse, arcs) au sein d'un même script.
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
//  Une trace active + sa config résolue + son pool d'arcs.
//  Les trois voyagent ensemble pour la boucle par frame.
// ─────────────────────────────────────────────────────────
export interface ActiveTraceEntry {
  trace:   AnimatedTrace;
  config:  TraceAnimationConfig;
  arcPool: ElectricArcPool;
}

export interface ScriptController {
  activateScript:   (scriptId: string) => void;
  getActiveEntries: () => ActiveTraceEntry[];
  isCycleComplete:  () => boolean;
  deactivate:       () => void;
}

export function createScriptController(
  animatedTraceMap: Map<string, AnimatedTrace>,
  scene:            THREE.Scene,
): ScriptController {

  let activeEntries: ActiveTraceEntry[] = [];

  // ─────────────────────────────────────────────────────────
  //  teardownPool — libère un pool d'arcs SANS fuite
  //
  //  Dispose la géométrie + le matériau de chaque slot et retire
  //  le Group de la scène. (L'ancien code retirait seulement les
  //  Lines mais laissait le Group → accumulation sous rotation.)
  // ─────────────────────────────────────────────────────────
  function teardownPool(pool: ElectricArcPool) {
    pool.slots.forEach(slot => {
      slot.geometry.dispose();
      slot.material.dispose();
    });
    scene.remove(pool.arcGroup);
  }

  // ─────────────────────────────────────────────────────────
  //  deactivate — démonte le script courant (arcs + renderOrder)
  //  Laisse animatedTraceMap intacte. Éteint explicitement les
  //  traces sortantes (uBrightness = 0) : sans ça, une trace en
  //  pleine course au moment du switch resterait figée allumée.
  // ─────────────────────────────────────────────────────────
  function deactivate() {
    activeEntries.forEach(entry => {
      teardownPool(entry.arcPool);
      Object.values(entry.trace.glowMeshes).forEach(mesh => { mesh.renderOrder = 0; });
      Object.values(entry.trace.glowMaterials).forEach(mat => { mat.uniforms.uBrightness.value = 0; });
    });
    activeEntries = [];
  }

  function activateScript(scriptId: string) {
    const script = TRACE_SCRIPTS[scriptId];
    if (!script) {
      console.warn(`[ScriptController] Script inconnu : "${scriptId}"`);
      return;
    }

    // Libère l'ancien script (pools + renderOrder)
    deactivate();

    // Remet toutes les traces au plan de base avant d'activer le nouveau script
    animatedTraceMap.forEach(trace => {
      Object.values(trace.glowMeshes).forEach(mesh => { mesh.renderOrder = 0; });
    });

    resolveActiveTraces(script).forEach(traceDef => {
      const trace = animatedTraceMap.get(traceDef.traceId);
      if (!trace) return;

      const traceStartupConfig = script.startupDelays?.[traceDef.traceId];
      const config             = resolveTraceConfig(script, traceDef.traceId);
      // Couleur : override du script sinon couleur par défaut de la trace.
      // Réappliquée à chaque activation → un script sans glowColor revient
      // à la couleur baked de la trace.
      const glowColor          = script.glowColor ?? traceDef.glowColor;

      // Reset complet de l'état avec le délai et la distance de départ
      // définis dans ce script. cycleComplete remis à false.
      const startDistance = traceStartupConfig?.startDistance ?? 0;
      trace.animationState = {
        distanceTravelled: startDistance,
        animationPhase:    'fill',
        phaseElapsedTime:  0,
        startupDelay:      resolveStartupDelay(script, traceDef.traceId),
        startDistance,
        hasStarted:        false,
        cycleComplete:     false,
      };

      // Uniforms remis à zéro — trace visuellement inactive au repos
      Object.values(trace.glowMaterials).forEach(mat => {
        mat.uniforms.uStartDistance.value = startDistance;
        mat.uniforms.uBrightness.value    = 0;
        mat.uniforms.uFrontDistance.value = startDistance;
        mat.uniforms.uGlowColor.value.setHex(glowColor);
      });

      // Trace active au premier plan
      Object.values(trace.glowMeshes).forEach(mesh => { mesh.renderOrder = 1; });

      activeEntries.push({
        trace,
        config,
        arcPool: initElectricArcPool(new THREE.Color(glowColor), scene),
      });
    });
  }

  // ─────────────────────────────────────────────────────────
  //  isCycleComplete — true quand TOUTES les traces actives ont
  //  latché cycleComplete (un fill→hold→fade complet chacune).
  //  Gère les startupDelays échelonnés : ne passe true qu'une fois
  //  la dernière trace retardée ayant bouclé. false si aucune trace.
  // ─────────────────────────────────────────────────────────
  function isCycleComplete(): boolean {
    return activeEntries.length > 0
      && activeEntries.every(entry => entry.trace.animationState.cycleComplete);
  }

  return {
    activateScript,
    getActiveEntries: () => activeEntries,
    isCycleComplete,
    deactivate,
  };
}
