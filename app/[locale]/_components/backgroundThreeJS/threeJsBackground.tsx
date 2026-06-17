'use client'
import { useRef, useEffect } from 'react';
import { initThreeSceneBackground } from '@/app/lib/threejs';
import { useBackground } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'
import { isScrollEnabled } from '@/app/lib/threejs/renderer/cameraProfile'

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

const MAX_BLUR = 7 // px

export default function ThreeJsBackground() {

  const mountRef = useRef<HTMLDivElement>(null);
  const { blurAmount } = useBackground()
  const setCameraScrollRef = useRef<((p: number) => void) | null>(null)
  const perfLevel = getMobilePerf()
  const scrollActiveRef = useRef(isScrollEnabled())



  useEffect(() => {
    if (!mountRef.current) return;
    if (perfLevel == 'none')return;
    const { cleanup, setCameraScroll } = initThreeSceneBackground(mountRef.current, perfLevel);
    setCameraScrollRef.current = setCameraScroll

    let rafId: number

    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const maxScroll = document.body.scrollHeight - window.innerHeight
        if (maxScroll <= 0) return
        const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1)
          setCameraScrollRef.current?.(progress)
      })
    }

    if (scrollActiveRef.current) {
      window.addEventListener('scroll', onScroll, { passive: true })
    }

    window.addEventListener('resize', () => {
      const shouldBeActive = isScrollEnabled()
      if (shouldBeActive && !scrollActiveRef.current) {
        window.addEventListener('scroll', onScroll, { passive: true })
      } else if (!shouldBeActive && scrollActiveRef.current) {
        window.removeEventListener('scroll', onScroll)
      }
      scrollActiveRef.current = shouldBeActive
    })

    requestAnimationFrame(() => {
            if (mountRef.current) mountRef.current.style.opacity = '1'
        })

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
          opacity: 0,
          transition: 'opacity 800ms ease-in-out',
          willChange: 'filter',
          filter: `blur(${(blurAmount * MAX_BLUR).toFixed(2)}px)`,
        }}
      />
    )
  }
}
