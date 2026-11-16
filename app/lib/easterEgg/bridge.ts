type Handlers = {
  play: (scriptId: string, options?: { loop?: boolean }) => void
  release: () => void
}

let handlers: Handlers | null = null

export function registerBackground(h: Handlers): void {
  handlers = h
}

export function unregisterBackground(): void {
  handlers = null
}

export function playBackground(scriptId: string): void {
  handlers?.play(scriptId, { loop: true })
}

export function releaseBackground(): void {
  handlers?.release()
}
