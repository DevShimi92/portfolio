import { UNLOCK_WORD, UNLOCK_CONFIG, MILESTONES, getAllSfx } from './config'
import { playBackground, releaseBackground } from './bridge'
import { playSfx, preloadSfx, stopAll } from './audio'

export function emitEasterEgg(word: string, foundCount = 0): void {
  if (word === UNLOCK_WORD) {
    preloadSfx(getAllSfx())
    playBackground(UNLOCK_CONFIG.animation)
    playSfx(UNLOCK_CONFIG.sfx)
    return
  }

  const milestone = MILESTONES.get(foundCount)
  if (milestone) {
    if (milestone.animation) playBackground(milestone.animation)
    if (milestone.sfx) playSfx(milestone.sfx)
  }
}

export function stopEasterEgg(): void {
  releaseBackground()
  stopAll()
}
