'use client'
import { useEffect } from 'react'
import { useBackground } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'
import { stopEasterEgg } from '@/app/lib/easterEgg'
import EasterEggLabel from '@/app/[locale]/_components/easterEgg/EasterEggLabel'

export default function EasterEggHost() {
  const { easterEgg, resetEasterEgg } = useBackground()
  const { unlocked, found, lastRepeat } = easterEgg

  useEffect(() => {
    if (!unlocked) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      stopEasterEgg()
      resetEasterEgg()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [unlocked, resetEasterEgg])

  return <EasterEggLabel words={found} repeat={lastRepeat} />
}
