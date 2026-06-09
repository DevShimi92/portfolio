import * as THREE from 'three';
import { TraceSegment } from '@/app/types/traceSegment';
import { Materials } from '@/app/types/materials';

// ─────────────────────────────────────────────────────────
//  CONSTANTE — nombre maximum de segments par trace
//
//  GLSL exige des boucles à longueur connue à la compilation.
//  Nos traces ont au plus 3 segments (4 waypoints),
//  on prend 4 comme plafond pour avoir une marge.
//  Si une trace future dépasse 4 segments, augmenter cette valeur
//  ET mettre à jour le #define dans GLSL_POLYLINE_PROJECTION.
// ─────────────────────────────────────────────────────────
const MAX_SEGMENTS_PER_TRACE = 6;

// ─────────────────────────────────────────────────────────
//  GLSL PARTAGÉ — projection d'un fragment sur la polyligne
//
//  Ce chunk est injecté via template literal dans les
//  3 fragment shaders glow (front, back, filament).
//  Il déclare les uniforms de segments ET la fonction
//  computeFragmentDistanceOnTrace().
//
//  Stratégie de projection :
//  Pour chaque fragment (vWorldPosition), on parcourt tous
//  les segments de la trace. Pour chaque segment on calcule
//  la projection orthogonale du fragment sur le segment,
//  puis la distance entre le fragment et cette projection.
//  On garde le segment dont la projection est la plus proche
//  et on retourne la distance cumulée correspondante :
//    cumulativeStart + t * segmentLength
//  où t ∈ [0,1] est le paramètre de projection sur le segment.
//
//  ENCODAGE DES UNIFORMS :
//  GLSL ne supporte pas les tableaux de structs avec vec3.
//  On aplati donc chaque vec3 en 3 floats consécutifs :
//    uSegmentStarts = [x0,y0,z0, x1,y1,z1, x2,y2,z2, ...]
//    uSegmentEnds   = [x0,y0,z0, x1,y1,z1, x2,y2,z2, ...]
//  La fonction extractVec3FromFlatArray() reconstruit le vec3
//  à partir de l'index de segment.
// ─────────────────────────────────────────────────────────
const GLSL_POLYLINE_PROJECTION = `
  #define MAX_SEGMENTS_PER_TRACE ${MAX_SEGMENTS_PER_TRACE}

  // Segments encodés en flat arrays (vec3 aplati en 3 floats par entrée)
  uniform float uSegmentStarts[MAX_SEGMENTS_PER_TRACE * 3];
  uniform float uSegmentEnds[MAX_SEGMENTS_PER_TRACE * 3];
  uniform float uSegmentCumulativeStarts[MAX_SEGMENTS_PER_TRACE];
  uniform float uSegmentLengths[MAX_SEGMENTS_PER_TRACE];
  uniform int   uSegmentCount;

  // Reconstruit un vec3 depuis un flat array à l'index segmentIndex
  vec3 extractVec3FromFlatArray(float flatArray[MAX_SEGMENTS_PER_TRACE * 3], int segmentIndex) {
    return vec3(
      flatArray[segmentIndex * 3],
      flatArray[segmentIndex * 3 + 1],
      flatArray[segmentIndex * 3 + 2]
    );
  }

  // Retourne la distance cumulée du fragment worldPosition
  // depuis le début de la trace, en units world-space.
  // Retourne -1.0 si aucun segment trouvé (ne doit pas arriver).
  float computeFragmentDistanceOnTrace(vec3 worldPosition) {
    float closestDistanceSq  = 9999.0;
    float fragmentCumulative = -1.0;

    for (int segIndex = 0; segIndex < MAX_SEGMENTS_PER_TRACE; segIndex++) {
      if (segIndex >= uSegmentCount) break;

      vec3  segStart  = extractVec3FromFlatArray(uSegmentStarts, segIndex);
      vec3  segEnd    = extractVec3FromFlatArray(uSegmentEnds,   segIndex);
      vec3  segDir    = segEnd - segStart;
      float segLen    = uSegmentLengths[segIndex];
      if (segLen < 0.001) continue;

      // Projection orthogonale du fragment sur le segment, clampée à [0,1]
      float projectionT    = clamp(dot(worldPosition - segStart, segDir) / (segLen * segLen), 0.0, 1.0);
      vec3  projectedPoint = segStart + projectionT * segDir;
      float distanceSq     = dot(worldPosition - projectedPoint, worldPosition - projectedPoint);

      if (distanceSq < closestDistanceSq) {
        closestDistanceSq  = distanceSq;
        fragmentCumulative = uSegmentCumulativeStarts[segIndex] + projectionT * segLen;
      }
    }

    return fragmentCumulative;
  }
`;


// ─────────────────────────────────────────────────────────
//  HELPER — uniforms de segments vides
//
//  Utilisé par createStaticGlowMat() — les traces décoratives
//  n'ont pas de segments à encoder, on remplit avec des
//  valeurs neutres garantissant que le shader n'allume rien.
// ─────────────────────────────────────────────────────────
function buildEmptySegmentUniforms() {
  const empty = Array(MAX_SEGMENTS_PER_TRACE).fill(0);
  return {
    uSegmentStarts:           { value: Array(MAX_SEGMENTS_PER_TRACE * 3).fill(0) },
    uSegmentEnds:             { value: Array(MAX_SEGMENTS_PER_TRACE * 3).fill(0) },
    uSegmentCumulativeStarts: { value: empty.map(() => 9999) },
    uSegmentLengths:          { value: empty },
    uSegmentCount:            { value: 0 },
  };
}

// ─────────────────────────────────────────────────────────
//  HELPER — encode les segments TypeScript en uniforms GLSL
//
//  Transforme le tableau TraceSegment[] en objets uniforms
//  Three.js prêts à être spreadés dans le bloc uniforms
//  d'un ShaderMaterial.
//
//  Les slots vides (index >= segments.length) sont remplis
//  avec des valeurs neutres :
//    - cumulativeStart = 9999 → jamais allumé par le shader
//    - segmentLength   = 0    → segment ignoré (< 0.001)
// ─────────────────────────────────────────────────────────
function buildSegmentUniforms(segments: TraceSegment[]) {
  const flatStarts:       number[] = [];
  const flatEnds:         number[] = [];
  const cumulativeStarts: number[] = [];
  const segmentLengths:   number[] = [];

  for (let slotIndex = 0; slotIndex < MAX_SEGMENTS_PER_TRACE; slotIndex++) {
    const segment = segments[slotIndex];

    if (segment) {
      flatStarts.push(segment.segmentStart.x, segment.segmentStart.y, segment.segmentStart.z);
      flatEnds.push(  segment.segmentEnd.x,   segment.segmentEnd.y,   segment.segmentEnd.z);
      cumulativeStarts.push(segment.cumulativeStart);
      segmentLengths.push(  segment.segmentLength);
    } else {
      // Slot vide — valeurs neutres garantissant que le shader ignore ce slot
      flatStarts.push(0, 0, 0);
      flatEnds.push(  0, 0, 0);
      cumulativeStarts.push(9999);  // hors portée → jamais allumé
      segmentLengths.push(0);       // ignoré car < 0.001
    }
  }

  return {
    uSegmentStarts:           { value: flatStarts },
    uSegmentEnds:             { value: flatEnds },
    uSegmentCumulativeStarts: { value: cumulativeStarts },
    uSegmentLengths:          { value: segmentLengths },
    uSegmentCount:            { value: segments.length },
  };
}


// ═══════════════════════════════════════════════════════════════
//  MATÉRIAUX STATIQUES — traces décoratives (board de fond)
//
//  Un seul jeu de 3 matériaux partagés entre toutes les traces
//  non-animables. Pas de segments encodés, uBrightness fixé à 0
//  — le shader se comporte comme l'ancien matGlass/Filament.
//
//  Appelé une seule fois dans buildBoard.ts.
// ═══════════════════════════════════════════════════════════════
export function createStaticMaterials(): Materials {
  return {
    glassFront: createGlowFrontMat(new THREE.Color(0x00eeff), []),
    glassBack:  createGlowBackMat( new THREE.Color(0x00eeff), []),
    filament:   createGlowFilamentMat(new THREE.Color(0x00eeff), []),
  };
}


// ═══════════════════════════════════════════════════════════════
//  MATÉRIAUX GLOW — traces animables
//
//  Une instance par trace animable, créée dans buildBoard.ts
//  au moment de la construction. Les segments sont encodés
//  une fois pour toutes — ils ne changent pas au runtime.
//  Seuls uFrontDistance et uBrightness sont mis à jour chaque frame.
// ═══════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────
//  MATÉRIAU GLOW — FrontSide (surface externe du tube)
//
//  Fresnel identique au matGlassFront de fond +
//  contribution émissive sur la zone parcourue.
//
//  Uniforms animés à chaque frame depuis animatedTrace.ts :
//    uFrontDistance — distance cumulée du front (world-space)
//    uBrightness    — multiplicateur global 0→1 (fade out)
//
//  Uniforms de réglage visuel :
//    uGlowColor       — couleur de la lumière
//    uGlowIntensity   — puissance du glow
//    uFrontHaloLength — longueur du pic lumineux au bord d'attaque
// ─────────────────────────────────────────────────────────
export function createGlowFrontMat(glowColor: THREE.Color, segments: TraceSegment[]): THREE.ShaderMaterial {
  const segmentUniforms = segments.length > 0
    ? buildSegmentUniforms(segments)
    : buildEmptySegmentUniforms();

  return new THREE.ShaderMaterial({
    uniforms: {
      // Fresnel de base
      uGlassColor:      { value: new THREE.Color(0x88ddee) },
      uFresnelPower:    { value: 3.5 },
      uOpacityCenter:   { value: 0.04 },
      uOpacityRim:      { value: 0.92 },
      uRimColor:        { value: new THREE.Color(0xccf0ff) },
      uLightDir:        { value: new THREE.Vector3(0.5, 1.0, 0.3).normalize() },
      // Glow animé
      uGlowColor:       { value: glowColor.clone() },
      uFrontDistance:   { value: 0.0 },
      uFrontHaloLength: { value: 6.0 },
      uGlowIntensity:   { value: 2.5 },
      uBrightness:      { value: 0.0 },
      // Segments de la polyligne
      ...segmentUniforms,
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPos   = modelMatrix * vec4(position, 1.0);
        vec4 mvPos      = viewMatrix * worldPos;
        vWorldPosition  = worldPos.xyz;
        vNormal         = normalize(normalMatrix * normal);
        vViewDir        = normalize(-mvPos.xyz);
        gl_Position     = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      ${GLSL_POLYLINE_PROJECTION}

      uniform vec3  uGlassColor, uRimColor, uLightDir, uGlowColor;
      uniform float uFresnelPower, uOpacityCenter, uOpacityRim;
      uniform float uFrontDistance, uFrontHaloLength, uGlowIntensity, uBrightness;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPosition;

      void main() {
        vec3  normal        = normalize(vNormal);
        vec3  viewDir       = normalize(vViewDir);
        float cosAngle      = clamp(dot(normal, viewDir), 0.0, 1.0);
        float fresnelFactor = pow(1.0 - cosAngle, uFresnelPower);

        // Couleur de base verre + specular directionnel
        vec3 color     = mix(uGlassColor, uRimColor, fresnelFactor * 0.8);
        vec3 lightDir  = normalize(uLightDir);
        vec3 reflected = reflect(-lightDir, normal);
        color += vec3(pow(max(dot(reflected, viewDir), 0.0), 64.0) * 0.6);

        // Distance du fragment depuis le début de la trace
        float fragmentDistance    = computeFragmentDistanceOnTrace(vWorldPosition);
        float distanceBehindFront = uFrontDistance - fragmentDistance;
        float isLit               = step(0.0, distanceBehindFront);

        // Pic blanc chaud uniquement dans la fenêtre proche du front
        float normalizedDistFromFront = clamp(distanceBehindFront / uFrontHaloLength, 0.0, 1.0);
        float frontPeakIntensity      = isLit * exp(-normalizedDistFromFront * 18.0);

        // Couleur glow : blanc chaud au front, couleur pure sur zone parcourue
        vec3 glowContribution = mix(uGlowColor, vec3(1.0, 1.0, 1.0), frontPeakIntensity * 0.5);
        color += glowContribution * isLit * uGlowIntensity * uBrightness;

        float alpha = mix(uOpacityCenter, uOpacityRim, fresnelFactor);
        alpha = min(1.0, alpha + frontPeakIntensity * 0.18 * uBrightness);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side:        THREE.FrontSide,
    depthWrite:  false,
  });
}


// ─────────────────────────────────────────────────────────
//  MATÉRIAU GLOW — BackSide (intérieur du tube)
//
//  Simule la lumière qui traverse le verre depuis l'intérieur.
//  Shader dédié sans Fresnel de fond — uniquement le glow.
//  Plus sombre que le FrontSide, contribue à la profondeur.
// ─────────────────────────────────────────────────────────
export function createGlowBackMat(glowColor: THREE.Color, segments: TraceSegment[]): THREE.ShaderMaterial {
  const segmentUniforms = segments.length > 0
    ? buildSegmentUniforms(segments)
    : buildEmptySegmentUniforms();

  return new THREE.ShaderMaterial({
    uniforms: {
      uGlowColor:       { value: glowColor.clone() },
      uGlassBaseColor:  { value: new THREE.Color(0x55bbdd) },
      uFrontDistance:   { value: 0.0 },
      uFrontHaloLength: { value: 6.0 },
      uGlowIntensity:   { value: 2.5 },
      uBrightness:      { value: 0.0 },
      ...segmentUniforms,
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPos   = modelMatrix * vec4(position, 1.0);
        vec4 mvPos      = viewMatrix * worldPos;
        vWorldPosition  = worldPos.xyz;
        vNormal         = normalize(normalMatrix * normal);
        vViewDir        = normalize(-mvPos.xyz);
        gl_Position     = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      ${GLSL_POLYLINE_PROJECTION}

      uniform vec3  uGlowColor, uGlassBaseColor;
      uniform float uFrontDistance, uFrontHaloLength, uGlowIntensity, uBrightness;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPosition;

      void main() {
        vec3  normal       = normalize(vNormal);
        vec3  viewDir      = normalize(vViewDir);
        float cosAngle     = clamp(dot(normal, viewDir), 0.0, 1.0);
        // Fresnel inverse — côté intérieur du verre
        float fresnelInner = pow(1.0 - cosAngle, 2.5);

        float fragmentDistance    = computeFragmentDistanceOnTrace(vWorldPosition);
        float distanceBehindFront = uFrontDistance - fragmentDistance;
        float isLit               = step(0.0, distanceBehindFront);

        float normalizedDistFromFront = clamp(distanceBehindFront / uFrontHaloLength, 0.0, 1.0);
        float frontPeakIntensity      = isLit * exp(-normalizedDistFromFront * 14.0);

        // Base sombre du verre, s'illumine sur la zone parcourue
        vec3 color     = uGlassBaseColor * 0.12;
        vec3 glowColor = mix(uGlowColor, vec3(1.0, 1.0, 1.0), frontPeakIntensity * 0.6);
        color += glowColor * isLit * uGlowIntensity * 0.7 * uBrightness;
        color  = mix(color, uGlowColor * 0.3, fresnelInner * frontPeakIntensity * 0.4 * uBrightness);

        float alpha = mix(0.55, 0.85, fresnelInner);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side:        THREE.BackSide,
    depthWrite:  false,
  });
}


// ─────────────────────────────────────────────────────────
//  MATÉRIAU GLOW — Filament (cœur du tube)
//
//  Mesh le plus fin (w * 0.26).
//  C'est lui qui donne l'impression du cœur lumineux :
//  blanc chaud au bord d'attaque, couleur pure derrière.
//  Très sombre au repos (quasi invisible sans glow).
// ─────────────────────────────────────────────────────────
export function createGlowFilamentMat(glowColor: THREE.Color, segments: TraceSegment[]): THREE.ShaderMaterial {
  const segmentUniforms = segments.length > 0
    ? buildSegmentUniforms(segments)
    : buildEmptySegmentUniforms();

  return new THREE.ShaderMaterial({
    uniforms: {
      uGlowColor:       { value: glowColor.clone() },
      uFrontDistance:   { value: 0.0 },
      uFrontHaloLength: { value: 6.0 },
      uGlowIntensity:   { value: 2.5 },
      uBrightness:      { value: 0.0 },
      ...segmentUniforms,
    },
    vertexShader: `
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPos  = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position    = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      ${GLSL_POLYLINE_PROJECTION}

      uniform vec3  uGlowColor;
      uniform float uFrontDistance, uFrontHaloLength, uGlowIntensity, uBrightness;

      varying vec3 vWorldPosition;

      void main() {
        float fragmentDistance    = computeFragmentDistanceOnTrace(vWorldPosition);
        float distanceBehindFront = uFrontDistance - fragmentDistance;
        float isLit               = step(0.0, distanceBehindFront);

        float normalizedDistFromFront = clamp(distanceBehindFront / uFrontHaloLength, 0.0, 1.0);
        // Pic ultra-blanc très court — concentré au bord d'attaque
        float frontPeakIntensity      = isLit * exp(-normalizedDistFromFront * 22.0);

        // Cœur : blanc chaud au front, couleur pure sur la zone parcourue
        vec3 filamentColor = mix(uGlowColor, vec3(1.0, 1.0, 1.0), frontPeakIntensity * 0.85);
        filamentColor *= isLit * uGlowIntensity * uBrightness;

        // Couleur de repos très sombre (quasi invisible sans glow)
        vec3 restingColor = vec3(0.004, 0.027, 0.033);
        filamentColor += restingColor;

        float alpha = min(1.0, 0.18 + isLit * 0.5 * uBrightness);
        gl_FragColor = vec4(filamentColor, alpha);
      }
    `,
    transparent: true,
    depthWrite:  false,
  });
}
