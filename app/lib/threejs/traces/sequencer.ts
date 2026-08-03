import { ScriptController } from './scriptController';

// ═══════════════════════════════════════════════════════════════
//  SCRIPT SEQUENCER
//
//  Couche fine au-dessus du ScriptController (mono-script).
//  Orchestre :
//    — une ROTATION de scripts par défaut, joués l'un après
//      l'autre en boucle (A→B→C→A), avançant à chaque cycle complet ;
//    — des scripts DÉCLENCHÉS qui mettent la rotation en pause,
//      puis la reprennent à l'endroit où elle était.
//
//  Le déclencheur réel (scroll / événement / interaction) est
//  HORS scope : il appellera playTriggeredScript / releaseTriggered.
//
//  tick() doit être appelé une fois par frame, APRÈS la mise à jour
//  des traces (pour que isCycleComplete reflète la frame courante).
// ═══════════════════════════════════════════════════════════════

export interface ScriptSequencer {
  start:               (rotation: string[]) => void;
  tick:                () => void;
  playTriggeredScript: (scriptId: string, options?: { loop?: boolean }) => void;
  releaseTriggered:    () => void;
}

export function createScriptSequencer(controller: ScriptController): ScriptSequencer {

  let rotation: string[]            = [];
  let rotationIndex                 = 0;
  let mode: 'rotation' | 'triggered' = 'rotation';
  // En mode triggered : si true, le script boucle jusqu'à releaseTriggered();
  // si false, il s'auto-termine après un cycle complet et reprend la rotation.
  let triggeredLoops                = false;

  function resumeRotation() {
    mode = 'rotation';
    if (rotation.length > 0) {
      controller.activateScript(rotation[rotationIndex]);
    }
  }

  function start(nextRotation: string[]) {
    rotation      = nextRotation;
    rotationIndex = 0;
    resumeRotation();
  }

  function tick() {
    if (mode === 'rotation') {
      if (rotation.length > 0 && controller.isCycleComplete()) {
        rotationIndex = (rotationIndex + 1) % rotation.length;
        controller.activateScript(rotation[rotationIndex]);
      }
      return;
    }

    // mode === 'triggered'
    if (!triggeredLoops && controller.isCycleComplete()) {
      resumeRotation();   // auto-fin après un cycle complet
    }
  }

  // ─────────────────────────────────────────────────────────
  //  playTriggeredScript — met la rotation en pause et joue un
  //  script déclenché. rotationIndex est conservé pour la reprise.
  //    options.loop = true  → boucle jusqu'à releaseTriggered()
  //    options.loop = false → s'auto-termine après un cycle (défaut)
  // ─────────────────────────────────────────────────────────
  function playTriggeredScript(scriptId: string, options?: { loop?: boolean }) {
    mode           = 'triggered';
    triggeredLoops = options?.loop ?? false;
    controller.activateScript(scriptId);
  }

  // ─────────────────────────────────────────────────────────
  //  releaseTriggered — reprend la rotation là où elle était.
  //  Sans effet si on n'est pas en mode triggered.
  // ─────────────────────────────────────────────────────────
  function releaseTriggered() {
    if (mode === 'triggered') resumeRotation();
  }

  return { start, tick, playTriggeredScript, releaseTriggered };
}
