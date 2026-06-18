'use client'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// Fond d'attente / fallback statique (chargement, ou avant le chunk 3D)
const HOLDING_BG = {
  position: 'fixed', inset: 0, zIndex: -1,
  background: 'linear-gradient(135deg, #000508 0%, #040c14 100%)',
} as const

const ThreeJsBackground = dynamic(
    () => import('@/app/[locale]/_components/backgroundThreeJS/threeJsBackground'),
    {
        ssr: false,
        loading: () => <div style={HOLDING_BG} />
    }
)

export default function ThreeSceneLoader() {
    const [load3D, setLoad3D] = useState(false)

    useEffect(() => {
        // Page déjà chargée : on flip au prochain frame (pas de setState
        // synchrone dans l'effet → évite les cascading renders).
        if (document.readyState === 'complete') {
            const id = requestAnimationFrame(() => setLoad3D(true))
            return () => cancelAnimationFrame(id)
        }
        // Sinon : on attend l'événement load (callback async, OK).
        const onLoad = () => setLoad3D(true)
        window.addEventListener('load', onLoad, { once: true })
        return () => window.removeEventListener('load', onLoad)
    }, [])

    return load3D ? <ThreeJsBackground /> : <div style={HOLDING_BG} />
}
