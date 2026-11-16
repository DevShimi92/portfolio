'use client'
import { useEffect, useRef } from 'react'

const LETTER = /^[a-z]$/i
const FIELDS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || FIELDS.has(target.tagName)
}

export function useSecretWords(
  words: string[],
  enabled: boolean,
  onMatch: (word: string) => void,
) {
  const onMatchRef = useRef(onMatch)
  useEffect(() => {
    onMatchRef.current = onMatch
  }, [onMatch])

  const wordsKey = words.join('|')

  useEffect(() => {
    if (!enabled || !wordsKey) return

    const list = wordsKey
      .split('|')
      .map(w => w.toLowerCase())
      .sort((a, b) => b.length - a.length)
    const maxLen = list[0].length
    let buffer = ''

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      if (!LETTER.test(e.key) || isEditable(e.target)) return

      buffer = (buffer + e.key.toLowerCase()).slice(-maxLen)

      const match = list.find(w => buffer.endsWith(w))
      if (match) {
        buffer = ''
        onMatchRef.current(match)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, wordsKey])
}
