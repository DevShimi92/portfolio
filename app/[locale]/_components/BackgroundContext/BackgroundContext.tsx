'use client'
import { createContext, useCallback, useContext, useState } from 'react'
import { UNLOCK_WORD } from '@/app/lib/easterEgg/config'

export interface BackgroundContextType {
  blurAmount: number
  setBlurAmount: (value: number) => void
  currentSection:     string
  setCurrentSection: (value: string) => void
  easterEgg: EasterEggState
  unlockEasterEgg: () => void
  foundWord: (word: string) => void
  resetEasterEgg: () => void
}

export interface EasterEggState {
  unlocked: boolean
  found: string[]
  lastRepeat: { word: string; key: number } | null
}

const INITIAL_EGG: EasterEggState = { unlocked: false, found: [], lastRepeat: null }

const BackgroundContext = createContext<BackgroundContextType>({
  blurAmount: 0,
  setBlurAmount: () => { },
  currentSection:     'home',
  setCurrentSection: () => { },
  easterEgg: INITIAL_EGG,
   unlockEasterEgg: () => {},
   foundWord: () => {},
   resetEasterEgg: () => {},
})

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [blurAmount, setBlurAmount] = useState(0)
  const [currentSection, setCurrentSection] = useState('home')
  const [easterEgg, setEasterEgg] = useState<EasterEggState>(INITIAL_EGG)

  const unlockEasterEgg = useCallback(() => {
      setEasterEgg(s => (s.unlocked ? s : { unlocked: true, found: [UNLOCK_WORD], lastRepeat: null }))
    }, [])

    const foundWord = useCallback((word: string) => {
      setEasterEgg(s => {
        if (!s.unlocked) return s
        if (s.found.includes(word)) {
          // Mot déjà trouvé : pas d'ajout, on incrémente key pour relancer le surbrillance
          return { ...s, lastRepeat: { word, key: (s.lastRepeat?.key ?? 0) + 1 } }
        }
        return { ...s, found: [...s.found, word] }
      })
    }, [])

  const resetEasterEgg = useCallback(() => setEasterEgg(INITIAL_EGG), [])

  return (
    <BackgroundContext.Provider value={{ blurAmount, setBlurAmount, currentSection,
         setCurrentSection, easterEgg, unlockEasterEgg, foundWord, resetEasterEgg, }}>
      {children}
    </BackgroundContext.Provider>
  )
}

export function useBackground() {
  return useContext(BackgroundContext)
}
