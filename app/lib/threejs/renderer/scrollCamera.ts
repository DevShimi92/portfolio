import * as THREE from 'three';
// Keyframes caméra — start = home, end = dernière section
// Pour ajouter un point intermédiaire :
//   1. Ajouter un objet { progress: 0.X, target: { x, y, z } } dans le tableau keyframes
//   2. progress est une valeur entre 0 et 1 représentant la position dans le scroll
//   3. Les points doivent être triés par progress croissant
//   Exemple : { progress: 0.5, target: { x: -5.5, y: -5.0, z: 9.0 } }
const cameraKeyframes = [
  { progress: 0, target: { x: -11.99, y: 1.37, z:  2.88 } },
  { progress: 1, target: { x: -9.60, y: -5.85, z: 7.44 } },
]

function interpolateScalar(start: number, end: number, factor: number) {
  return start + (end - start) * factor
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// Reçoit target et applyCamera depuis Scene pour rester totalement indépendant
export function setCameraScroll(
  scrollProgress: number,
  cameraTarget: THREE.Vector3,
  applyCamera: () => void
) {
  let fromKeyframe = cameraKeyframes[0]
  let toKeyframe   = cameraKeyframes[cameraKeyframes.length - 1]

  for (let i = 0; i < cameraKeyframes.length - 1; i++) {
    if (
      scrollProgress >= cameraKeyframes[i].progress &&
      scrollProgress <= cameraKeyframes[i + 1].progress
    ) {
      fromKeyframe = cameraKeyframes[i]
      toKeyframe   = cameraKeyframes[i + 1]
      break
    }
  }

  const rangeSize     = toKeyframe.progress - fromKeyframe.progress
  const localProgress = rangeSize === 0 ? 0 : (scrollProgress - fromKeyframe.progress) / rangeSize
  const easedProgress = easeInOut(localProgress)

  cameraTarget.set(
    interpolateScalar(fromKeyframe.target.x, toKeyframe.target.x, easedProgress),
    interpolateScalar(fromKeyframe.target.y, toKeyframe.target.y, easedProgress),
    interpolateScalar(fromKeyframe.target.z, toKeyframe.target.z, easedProgress),
  )

  applyCamera()
}
