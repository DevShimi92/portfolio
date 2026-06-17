'use client'
import { useRef, useEffect, useState } from 'react';
import { initThreeSceneBackground } from '@/app/lib/threejs';
import { useBackground } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'
import { isScrollEnabled } from '@/app/lib/threejs/renderer/cameraProfile'
import { detectPerfTier, type PerfLevel } from '@/app/lib/threejs/perf/detectPerfTier'

const MAX_BLUR = 7 // px

// Fond d'attente / fallback statique (chargement, ou perfLevel 'none')
const HOLDING_BG = {
  position: 'fixed', inset: 0, zIndex: -1,
  background: 'linear-gradient(135deg, #000508 0%, #040c14 100%)',
} as const

export default function ThreeJsBackground() {

  const mountRef = useRef<HTMLDivElement>(null);
  const { blurAmount } = useBackground()
  const setCameraScrollRef = useRef<((p: number) => void) | null>(null)
  const scrollActiveRef = useRef(isScrollEnabled())

  // perfLevel résolu de façon asynchrone (detect-gpu). null = en cours.
  const [perfLevel, setPerfLevel] = useState<PerfLevel | null>(null)

  // ── Détection du palier (une fois, au montage) ────────────────
  useEffect(() => {
    let cancelled = false
    detectPerfTier().then(level => { if (!cancelled) setPerfLevel(level) })
    return () => { cancelled = true }
  }, [])

  // ── Init de la scène une fois le palier connu ─────────────────
  useEffect(() => {
    if (perfLevel === null || perfLevel === 'none') return;
    if (!mountRef.current) return;
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

  // En attente de détection ou WebGL indisponible → fond statique
  if (perfLevel === null || perfLevel === 'none') {
    return <div style={HOLDING_BG} />
  }

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
