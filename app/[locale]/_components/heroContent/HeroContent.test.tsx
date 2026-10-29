import { render, screen, act } from '@testing-library/react'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import HeroContent from './HeroContent'

describe('HeroContent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Renders name always', () => {
    render(
      <HeroContent
        name="Jean Dupont"
        role="Developer"
        disciplines={['Frontend']}
        locale="en"
      />
    )
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
  })

  test('Renders role only when locale is fr', () => {
    render(
      <HeroContent
        name="Jean Dupont"
        role="Développeur"
        disciplines={['Frontend']}
        locale="fr"
      />
    )
    expect(screen.getByText('Développeur')).toBeInTheDocument()
  })

  test('Does not render role separately when locale is not fr', () => {
    render(
      <HeroContent
        name="Jean Dupont"
        role="Developer"
        disciplines={['Frontend']}
        locale="en"
      />
    )
    expect(screen.queryByText('Developer')).not.toBeInTheDocument()
  })

  test('Types out discipline text progressively', async () => {
    const { container } = render(
      <HeroContent
        name="Jean Dupont"
        role="Developer"
        disciplines={['Frontend']}
        locale="fr"
      />
    )

    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(80)
      })
    }

    const disciplineEl = container.querySelector(`p[class*="discipline"]`)
    expect(disciplineEl?.textContent).toContain('Front')
  })

  test('Full cycle until the next discipline', async () => {
    const { container } = render(
      <HeroContent
        name="Jean Dupont"
        role="Developer"
        disciplines={['Frontend', 'Backend']}
        locale="fr"
      />
    )

    const disciplineEl = container.querySelector(`p[class*="discipline"]`)

    for (let i = 0; i < 8; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(80)
      })
    }
    expect(disciplineEl?.textContent).toContain('Frontend')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600)
    })

    for (let i = 0; i < 4; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(45)
      })
    }

    expect(disciplineEl?.textContent?.length).toBeLessThan('Frontend_'.length)

    for (let i = 0; i < 4; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(45)
      })
    }

    expect(disciplineEl?.textContent).not.toContain('Frontend')

    await act(async () => {
        await vi.advanceTimersByTimeAsync(80)
      })

    expect(disciplineEl?.textContent).toContain('B')
  })
})
