import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useActiveNavLink } from './useActiveNavLink'

const { pathnameMock } = vi.hoisted(() => ({ pathnameMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock() as string,
}))

vi.mock('@/app/lib/navigation', () => ({
  NAV_LINKS: [
    { id: 'home', type: 'section' },
    { id: 'about', type: 'section' },
    { id: 'contact', type: 'route', path: '/contact' },
    { id: 'articles', type: 'route', path: '/articles' },
  ],
}))

const run = (pathname: string) => {
  pathnameMock.mockReturnValue(pathname)
  return renderHook(() => useActiveNavLink())
}

describe('useActiveNavLink', () => {
  beforeEach(() => {
    pathnameMock.mockReset()
  })

  it('route standalone exacte', () => {
    const { result } = run('/fr/contact')
    expect(result.current).toEqual({
      isStandaloneRoute: true,
      activeRouteId: 'contact',
      locale: 'fr',
    })
  })

  it('sous-route : /fr/articles/mon-post', () => {
    const { result } = run('/fr/articles/mon-post')
    expect(result.current.isStandaloneRoute).toBe(true)
    expect(result.current.activeRouteId).toBe('articles')
  })

  it('slash final ignored', () => {
    const { result } = run('/fr/contact/')
    expect(result.current.activeRouteId).toBe('contact')
  })

  it('local read from the 1st segment', () => {
    const { result } = run('/en/contact')
    expect(result.current.locale).toBe('en')
  })

  it('local root: /fr → no route', () => {
    const { result } = run('/fr')
    expect(result.current).toEqual({
      isStandaloneRoute: false,
      activeRouteId: null,
      locale: 'fr',
    })
  })

  it('absolute root: "/" → empty locale, no route', () => {
    const { result } = run('/')
    expect(result.current).toEqual({
      isStandaloneRoute: false,
      activeRouteId: null,
      locale: '',
    })
  })

  it('Section-type link ignored, even though the path matches', () => {
    const { result } = run('/fr/about')
    expect(result.current.isStandaloneRoute).toBe(false)
    expect(result.current.activeRouteId).toBeNull()
  })

  it('partial prefix without "/" does not match: /fr/contactez', () => {
    const { result } = run('/fr/contactez')
    expect(result.current.isStandaloneRoute).toBe(false)
  })

  it('unknown route : false / null', () => {
    const { result } = run('/fr/inconnue')
    expect(result.current.isStandaloneRoute).toBe(false)
    expect(result.current.activeRouteId).toBeNull()
  })

  it('case-sensitive : /fr/Contact', () => {
    const { result } = run('/fr/Contact')
    expect(result.current.isStandaloneRoute).toBe(false)
  })

  it('reacts to pathname changes (rerender)', () => {
    pathnameMock.mockReturnValue('/fr')
    const { result, rerender } = renderHook(() => useActiveNavLink())
    expect(result.current.isStandaloneRoute).toBe(false)

    pathnameMock.mockReturnValue('/fr/contact')
    rerender()
    expect(result.current.activeRouteId).toBe('contact')

    pathnameMock.mockReturnValue('/fr')
    rerender()
    expect(result.current.activeRouteId).toBeNull()
  })
})
