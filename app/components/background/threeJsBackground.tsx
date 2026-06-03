'use client'
import { useRef, useEffect } from 'react';
import { initThreeSceneBackground } from '@/app/lib/threejs';

export default function ThreeJsBackground() {

  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const { cleanup } = initThreeSceneBackground(mountRef.current);
    return cleanup;
  }, []);

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
