'use client'
import { useRef, useEffect } from 'react';
import { initThreeSceneBackground } from '@/app/lib/threejs';

// Selon le terminal, on réduit voir on déactive le background
function getMobilePerf(): 'full' | 'reduced' | 'none' {
  if (typeof window === 'undefined') return 'full';

  const isMobile = window.innerWidth < 768;
  if (!isMobile) return 'full';

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = navigator.deviceMemory ?? 4;
 // GB, pas dispo sur Safari

  if (cores <= 4 && memory <= 2) return 'none';
  if (cores <= 6 || memory <= 4) return 'reduced';
  return 'full';
}

export default function ThreeJsBackground() {

  const mountRef = useRef<HTMLDivElement>(null);

  const perfLevel = getMobilePerf();
  console.log(perfLevel)

  useEffect(() => {
    if (!mountRef.current) return;
    if (perfLevel == 'none')return;
    const { cleanup } = initThreeSceneBackground(mountRef.current, perfLevel);
    return cleanup;
  }, [perfLevel]);

  if (perfLevel === 'none') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        background: 'linear-gradient(135deg, #000508 0%, #040c14 100%)',
        }} />
    )
  }
  else {
    return (
      <div
        ref={mountRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />
    )
  }
}
