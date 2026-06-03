import * as THREE from 'three';

// ─────────────────────────────────────────────────────────
//  MATERIAUX
//
//  matGlassBack  — MeshPhysicalMaterial BackSide
//                  donne la profondeur / epaisseur du verre
//
//  matGlassFront — ShaderMaterial FrontSide avec Fresnel
//                  surface externe : transparent au centre,
//                  opaque + brillant sur les bords (effet verre epais)
//
//  matFilament   — barre centrale quasi invisible, reagit aux pulses
// ─────────────────────────────────────────────────────────

export function createMaterials() {

    // Face arriere : interieur tinte, transmission activee
    const matGlassBack = new THREE.MeshPhysicalMaterial({
        color:         new THREE.Color(0x55bbdd),
        roughness:     0.05,
        metalness:     0.0,
        transmission:  0.96,   // r152 : transmission reelle
        thickness:     0.4,    // epaisseur pour la refraction
        ior:           1.5,    // indice verre standard
        transparent:   true,
        opacity:       1.0,
        side:          THREE.BackSide,
        depthWrite:    false,
        envMapIntensity: 0.8,
    });

// Face avant : ShaderMaterial Fresnel
// Le Fresnel fait que :
//   - face a la camera (angle faible) → tres transparent
//   - sur les bords (angle rasant)    → opaque + blanc brillant
// C'est exactement ce qu'on voit sur du verre epais.
    const matGlassFront = new THREE.ShaderMaterial({
    uniforms: {
        uColor:         { value: new THREE.Color(0x88ddee) },
        uFresnelPower:  { value: 3.5 },
        uOpacityCenter: { value: 0.04 },  // transparence face centrale
        uOpacityRim:    { value: 0.92 },  // opacite sur les bords
        uRimColor:      { value: new THREE.Color(0xccf0ff) },
        uLightDir:      { value: new THREE.Vector3(0.5, 1.0, 0.3).normalize() },
    },
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldPos;

        void main() {
        vec4 worldPos   = modelMatrix * vec4(position, 1.0);
        vec4 mvPos      = viewMatrix * worldPos;
        vWorldPos       = worldPos.xyz;
        vNormal         = normalize(normalMatrix * normal);
        vViewDir        = normalize(-mvPos.xyz);
        gl_Position     = projectionMatrix * mvPos;
        }
    `,
    fragmentShader: `
        uniform vec3  uColor;
        uniform float uFresnelPower;
        uniform float uOpacityCenter;
        uniform float uOpacityRim;
        uniform vec3  uRimColor;
        uniform vec3  uLightDir;

        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldPos;

        void main() {
        vec3  N       = normalize(vNormal);
        vec3  V       = normalize(vViewDir);

        // Fresnel : 0 = face camera, 1 = bord rasant
        float cosA    = clamp(dot(N, V), 0.0, 1.0);
        float fresnel = pow(1.0 - cosA, uFresnelPower);

        // Couleur : melange couleur verre / blanc rim
        vec3  col     = mix(uColor, uRimColor, fresnel * 0.8);

        // Specular simple (Phong) pour les reflets ponctuels
        vec3  L       = normalize(uLightDir);
        vec3  R       = reflect(-L, N);
        float spec    = pow(max(dot(R, V), 0.0), 64.0) * 0.6;
        col          += vec3(spec);

        // Opacite : centre transparent, bords opaques
        float alpha   = mix(uOpacityCenter, uOpacityRim, fresnel);

        gl_FragColor  = vec4(col, alpha);
        }
    `,
    transparent:  true,
    side:         THREE.FrontSide,
    depthWrite:   false,
    });

    // Filament interieur — barre tres fine, reagit aux PointLights
    const matFilament = new THREE.MeshStandardMaterial({
        color:              new THREE.Color(0x004455),
        emissive:           new THREE.Color(0x002233),
        emissiveIntensity:  0.2,
        roughness:          0.0,
        metalness:          0.0,
        transparent:        true,
        opacity:            0.18,
        depthWrite:         false,
    });

  return { matGlassBack, matGlassFront, matFilament };

}
