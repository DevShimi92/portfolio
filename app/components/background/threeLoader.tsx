'use client'
import dynamic from 'next/dynamic'

const ThreeJsBackground = dynamic(
    () => import('@/app/components/background/threeJsBackground'),
    {
        ssr: false,
        loading: () => <div style={{
            position: 'fixed', inset: 0, zIndex: 5,
            background: '#000508'
        }} />
    }
)

export default function ThreeSceneLoader() {
    return <ThreeJsBackground />
}
