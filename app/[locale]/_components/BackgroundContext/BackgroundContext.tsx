'use client'
import { createContext, useContext, useState } from 'react'

interface BackgroundContextType {
  blurAmount: number
  setBlurAmount: (value: number) => void
  currentSection:     string
  setCurrentSection:  (value: string) => void
}

const BackgroundContext = createContext<BackgroundContextType>({
  blurAmount: 0,
  setBlurAmount: () => { },
  currentSection:     'home',
  setCurrentSection:  () => {},
})

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [blurAmount, setBlurAmount] = useState(0)
  const [currentSection, setCurrentSection] = useState('home')
  return (
    <BackgroundContext.Provider value={{ blurAmount, setBlurAmount, currentSection,
         setCurrentSection, }}>
      {children}
    </BackgroundContext.Provider>
  )
}

export function useBackground() {
  return useContext(BackgroundContext)
}
