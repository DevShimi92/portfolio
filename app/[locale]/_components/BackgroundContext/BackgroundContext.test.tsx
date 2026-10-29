import { render, screen, act } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { BackgroundProvider, useBackground } from './BackgroundContext'

function TestConsumer() {
  const { blurAmount, setBlurAmount, currentSection, setCurrentSection } = useBackground()
  return (
    <div>
      <span data-testid="blur">{blurAmount}</span>
      <span data-testid="section">{currentSection}</span>
      <button onClick={() => setBlurAmount(0.5)}>Set Blur</button>
      <button onClick={() => setCurrentSection('projets')}>Set Section</button>
    </div>
  )
}

describe('BackgroundContext', () => {
  test('Provides default values', () => {
    render(
      <BackgroundProvider>
        <TestConsumer />
      </BackgroundProvider>
    )
    expect(screen.getByTestId('blur')).toHaveTextContent('0')
    expect(screen.getByTestId('section')).toHaveTextContent('home')
  })

  test('Updates blurAmount via setBlurAmount', () => {
    render(
      <BackgroundProvider>
        <TestConsumer />
      </BackgroundProvider>
    )
    act(() => {
      screen.getByText('Set Blur').click()
    })
    expect(screen.getByTestId('blur')).toHaveTextContent('0.5')
  })

  test('Updates currentSection via setCurrentSection', () => {
    render(
      <BackgroundProvider>
        <TestConsumer />
      </BackgroundProvider>
    )
    act(() => {
      screen.getByText('Set Section').click()
    })
    expect(screen.getByTestId('section')).toHaveTextContent('projets')
  })

  test('Returns default no-op functions when used outside provider', () => {
    render(<TestConsumer />) // pas de <BackgroundProvider>

    expect(screen.getByTestId('blur')).toHaveTextContent('0')
    expect(screen.getByTestId('section')).toHaveTextContent('home')

    // Vérifie que les no-op ne crashent pas
    act(() => {
      screen.getByText('Set Blur').click()
      screen.getByText('Set Section').click()
    })

    // Toujours les valeurs par défaut, car les setters sont des no-op
    expect(screen.getByTestId('blur')).toHaveTextContent('0')
    expect(screen.getByTestId('section')).toHaveTextContent('home')
  })
})
