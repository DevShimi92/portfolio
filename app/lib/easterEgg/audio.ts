const BASE = '/audio/archer_voice'
const VOLUME = 0.8

const cache = new Map<string, HTMLAudioElement>()
const active = new Set<HTMLAudioElement>()

function load(id: string): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  let base = cache.get(id)
  if (!base) {
    base = new Audio(`${BASE}/${id}.flac`)
    base.preload = 'auto'
    cache.set(id, base)
  }
  return base
}

export function preloadSfx(ids: string[]): void {
  ids.forEach(load)
}

export function playSfx(id: string): void {
  const base = load(id)
  if (!base) return
  const el = base.cloneNode(true) as HTMLAudioElement
  el.volume = VOLUME
  active.add(el)
  el.addEventListener('ended', () => active.delete(el), { once: true })
  el.play().catch(() => active.delete(el))
}

export function stopAll(): void {
  active.forEach(el => el.pause())
  active.clear()
}
