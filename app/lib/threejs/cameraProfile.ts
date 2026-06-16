export type CameraProfile = 'DESKTOP' | 'TABLET' | 'MOBILE-PORTRAIT'

export function getCameraProfile(): CameraProfile {
  const aspect = window.innerWidth / window.innerHeight
  if (aspect >= 1.2) return 'DESKTOP'
  if (aspect >= 0.8) return 'TABLET'
  return 'MOBILE-PORTRAIT'
}

export function isScrollEnabled(): boolean {
  return getCameraProfile() !== 'MOBILE-PORTRAIT'
}
