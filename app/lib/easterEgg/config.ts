export type WordConfig = {
  animation: string
  sfx?: string
}

export const UNLOCK_WORD = 'fate'

export const UNLOCK_CONFIG = {
  animation: 'trace-on-1',
  sfx: 'archer01',
}

export type MilestoneConfig = {
  animation?: string
  sfx?: string
}

export const MILESTONES = new Map<number, MilestoneConfig>([
  [2, { animation: 'trace-on-2A', sfx: 'archer02' }],
  [3, { sfx: 'archer03' }],
  [4, { animation: 'trace-on-2B', sfx: 'archer04' }],
  [5, { sfx: 'archer05' }],
  [6, { animation: 'trace-on-3A', sfx: 'archer06' }],
  [7, { sfx: 'archer07' }],
  [8, { animation: 'trace-on-3B', sfx: 'archer08' }],
])
export const WORDS: string[] = ['stay', 'night', 'emiya', 'shirou' ,'archer', 'unlimited', 'blade', 'works']

export function getAllSfx(): string[] {
  const ids = [UNLOCK_CONFIG.sfx]
  MILESTONES.forEach(m => { if (m.sfx) ids.push(m.sfx) })
  return ids
}

export function getListenedWords(unlocked: boolean): string[] {
  return unlocked ? [UNLOCK_WORD, ...WORDS] : [UNLOCK_WORD]
}
