import * as THREE from 'three';
import { AnimatedTrace }        from '@/app/types/animatedTrace';
import { TraceAnimationConfig } from '@/app/types/traceAnimationConfig';

// ═══════════════════════════════════════════════════════════════
//  ANIMATED TRACE — UPDATE
//
//  La construction de la géométrie et des matériaux est désormais
//  dans buildBoard.ts. Ce fichier ne contient que la logique
//  d'animation : machine d'états + mise à jour des uniforms.
//
//  Cycle d'animation : fill → hold → fade → (reset vers fill)
// ═══════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────
//  updateAnimatedTrace
//
//  Met à jour la machine d'états de la trace et pousse
//  les nouvelles valeurs dans les uniforms des 3 matériaux.
//
//  Paramètres :
//    trace           — la trace à mettre à jour
//    deltaTime       — temps écoulé depuis la frame précédente (s)
//    animationConfig — réglages centralisés (vitesse, durées…)
//
//  Retourne la progression normalisée 0→1 de la trace.
//  Utile pour synchroniser un indicateur UI côté React.
// ─────────────────────────────────────────────────────────
export function updateAnimatedTrace(
  trace:           AnimatedTrace,
  deltaTime:       number,
  animationConfig: TraceAnimationConfig
): number {

  const { animationState, totalLength, glowMaterials } = trace;
  const allMaterials = Object.values(glowMaterials);

  // Sync des réglages visuels à chaque frame — peu coûteux
  // (permet de les modifier en live depuis l'extérieur si besoin)
  allMaterials.forEach(mat => {
    mat.uniforms.uGlowIntensity.value   = animationConfig.glowIntensity;
    mat.uniforms.uFrontHaloLength.value = animationConfig.frontHaloLength;
  });

  // ── Cycle terminé — la trace reste éteinte ───────────────────
  // Une fois son fill→hold→fade fait, la trace ne reboucle PAS
  // d'elle-même : elle tient à 0 jusqu'à la réactivation du script
  // (le sequencer ré-active quand toutes les traces ont fini).
  // Évite qu'une trace finie repulse en attendant ses voisines.
  if (animationState.cycleComplete) {
    pushUniforms(allMaterials, animationState.distanceTravelled, 0);
    return 1;
  }

  // ── Délai de démarrage initial ───────────────────────────────
  if (!animationState.hasStarted) {
    animationState.startupDelay -= deltaTime;
    if (animationState.startupDelay > 0) {
      pushUniforms(allMaterials, 0, 0);
      return 0;
    }
    animationState.hasStarted = true;
  }

  // ── fill — le front avance ───────────────────────────────────
  if (animationState.animationPhase === 'fill') {
    animationState.distanceTravelled = Math.min(
      totalLength,
      animationState.distanceTravelled + animationConfig.travelSpeed * deltaTime
    );

    pushUniforms(allMaterials, animationState.distanceTravelled, 1);

    if (animationState.distanceTravelled >= totalLength) {
      animationState.animationPhase   = 'hold';
      animationState.phaseElapsedTime = 0;
    }

    return animationState.distanceTravelled / totalLength;
  }

  // ── hold — trace allumée à 100% ──────────────────────────────
  if (animationState.animationPhase === 'hold') {
    animationState.phaseElapsedTime += deltaTime;
    pushUniforms(allMaterials, totalLength, 1);

    if (animationState.phaseElapsedTime >= animationConfig.litHoldDuration) {
      animationState.animationPhase   = 'fade';
      animationState.phaseElapsedTime = 0;
    }

    return 1;
  }

  // ── fade — extinction progressive ───────────────────────────
  if (animationState.animationPhase === 'fade') {
    animationState.phaseElapsedTime += deltaTime;

    const brightness = Math.max(
      0,
      1 - animationState.phaseElapsedTime / animationConfig.fadeDuration
    );

    pushUniforms(allMaterials, totalLength, brightness);

    if (animationState.phaseElapsedTime >= animationConfig.fadeDuration) {
      // Cycle complet (fill→hold→fade) terminé. On NE reboucle PAS :
      // on latche cycleComplete et la trace tient à 0 (court-circuit
      // en tête de fonction) jusqu'à la réactivation du script par
      // le sequencer. Le reset (distanceTravelled = startDistance,
      // phase = 'fill', cycleComplete = false) est fait par activateScript.
      animationState.cycleComplete = true;
      pushUniforms(allMaterials, totalLength, 0);
    }

    return 1;
  }

  return 0;
}


// ─────────────────────────────────────────────────────────
//  pushUniforms — pousse frontDistance + brightness
//  dans les 3 matériaux simultanément
// ─────────────────────────────────────────────────────────
function pushUniforms(
  materials:     THREE.ShaderMaterial[],
  frontDistance: number,
  brightness:    number
): void {
  materials.forEach(mat => {
    mat.uniforms.uFrontDistance.value = frontDistance;
    mat.uniforms.uBrightness.value    = brightness;
  });
}
