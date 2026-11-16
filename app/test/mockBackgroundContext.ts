import { vi } from 'vitest'
import type { BackgroundContextType } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'

export function makeBackgroundContextMock(
  overrides: Partial<BackgroundContextType> = {},
): BackgroundContextType {
  return {
    blurAmount: 0,
    setBlurAmount: vi.fn(),
    currentSection: 'home',
    setCurrentSection: vi.fn(),
    easterEgg: { unlocked: false, found: [], lastRepeat: null },
    unlockEasterEgg: vi.fn(),
    foundWord: vi.fn(),
    resetEasterEgg: vi.fn(),
    ...overrides,
  }
}
