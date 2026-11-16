'use client'
import { useBackground } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'
import { useSecretWords } from '@/app/[locale]/_hooks/useSecretWords'
import { getListenedWords } from '@/app/lib/easterEgg/config'
import { emitEasterEgg } from '@/app/lib/easterEgg'
import { UNLOCK_WORD } from '@/app/lib/easterEgg/config'

export default function EasterEggDetector() {
  const { currentSection, easterEgg, unlockEasterEgg, foundWord } = useBackground()
  const { unlocked, found } = easterEgg

  useSecretWords(
    getListenedWords(unlocked),
    currentSection === 'home',
    word => {
      if (!unlocked) {
        unlockEasterEgg()
        emitEasterEgg(word)
        return
      }
      const isNew = !found.includes(word)
      foundWord(word)
     if (isNew && word !== UNLOCK_WORD) emitEasterEgg(word, found.length + 1)
    },
  )

  return null
}
