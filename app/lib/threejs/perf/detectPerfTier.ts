import { getGPUTier } from 'detect-gpu';

// ═══════════════════════════════════════════════════════════════
//  DÉTECTION DU NIVEAU DE PERF
//
//  Décide du palier de rendu de la scène 3D :
//    full    — scène complète
//    reduced — version allégée (cf. Front 2)
//    none    — pas de WebGL, fond statique
//
//  Stratégie :
//    — Desktop (≥ 768px) → full (court-circuit, pas de detect-gpu)
//    — Mobile → tiering GPU via detect-gpu (lookup base de
//      benchmarks self-hostée, PAS de mesure FPS live)
//    — Garde-fous UX (prefers-reduced-motion / saveData) plafonnent
//      à 'reduced' quel que soit le tier.
//
//  Async : detect-gpu charge un fichier de benchmark à la demande.
//  Appelé une seule fois côté client (le composant est ssr:false).
// ═══════════════════════════════════════════════════════════════

export type PerfLevel = 'full' | 'reduced' | 'none';

// Ordre de sévérité, pour plafonner un palier (cap) sans le remonter.
const SEVERITY: Record<PerfLevel, number> = { none: 0, reduced: 1, full: 2 };

function capLevel(level: PerfLevel, max: PerfLevel): PerfLevel {
  return SEVERITY[level] <= SEVERITY[max] ? level : max;
}

export async function detectPerfTier(): Promise<PerfLevel> {
  // ── Desktop : toujours full, sans charger detect-gpu ──────────
  if (window.innerWidth >= 768) return 'full';

  // ── Garde-fous UX : plafonnent à 'reduced' ────────────────────
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const saveData      = navigator.connection?.saveData ?? false;
  const uxCap: PerfLevel = (reducedMotion || saveData) ? 'reduced' : 'full';

  // ── Tiering GPU (base de benchmarks self-hostée) ──────────────
  let base: PerfLevel;
  try {
    const { tier, type } = await getGPUTier({ benchmarksURL: '/detect-gpu/benchmarks' });

    if (type === 'WEBGL_UNSUPPORTED' || tier <= 0) {
      base = 'none';                    // pas de WebGL exploitable
    } else if (tier === 1) {
      base = 'reduced';                 // bas de gamme
    } else {
      base = 'full';                    // tier ≥ 2 (mid + high)
    }
  } catch {
    // En cas d'échec de détection, on reste prudent mais visible.
    base = 'reduced';
  }

  return capLevel(base, uxCap);
}
