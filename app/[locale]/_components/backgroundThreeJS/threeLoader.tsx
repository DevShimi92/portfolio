'use client'
import dynamic from 'next/dynamic'

const ThreeJsBackground = dynamic(
    () => import('@/app/[locale]/_components/backgroundThreeJS/threeJsBackground'),
    {
        ssr: false,
        loading: () => <div style={{
            position: 'fixed', inset: 0, zIndex: -1,
            background: 'linear-gradient(135deg, #000508 0%, #040c14 100%)'
        }} />
    }
)

export default function ThreeSceneLoader() {
    return <ThreeJsBackground />
}
