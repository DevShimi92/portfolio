import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutMe from './page'

const { messages, photoSpy } = vi.hoisted(() => ({
  messages: new Map<string, unknown>(),
  photoSpy: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => messages.get(key) as string
    t.raw = (key: string) => messages.get(key)
    return t
  },
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

vi.mock('../_components/photoFrame/PhotoFrame', () => ({
  default: (props: Record<string, unknown>) => {
    photoSpy(props)
    return <div data-testid="photo" />
  },
}))

vi.mock('./aboutMe.module.css', () => ({
  default: {
    section: 'section',
    highlight: 'highlight',
    photoWrap: 'photoWrap',
    ctaBtn: 'ctaBtn',
    bioLine: 'bioLine',
  },
}))

type Highlight = { word: string; href: string }

function setup(opts: { lines?: string[]; highlights?: Highlight[] } = {}) {
  messages.set('title', 'À propos')
  messages.set('bioLines', opts.lines ?? ['Ligne un', 'Ligne deux'])
  messages.set('highlights', opts.highlights ?? [])
  messages.set('buttonAboutMeContact', 'Me contacter')
  return render(<AboutMe />)
}

describe('AboutMe', () => {
  beforeEach(() => {
    messages.clear()
    photoSpy.mockClear()
    vi.unstubAllEnvs()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('make the title an h2', () => {
    setup()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('À propos')
  })

  it('one <p> per line of bio, in order', () => {
    const { container } = setup({ lines: ['A', 'B', 'C'] })
    const ps = container.querySelectorAll('p.bioLine')
    expect(ps).toHaveLength(3)
    expect(ps[0]).toHaveTextContent('A')
    expect(ps[2]).toHaveTextContent('C')
  })

  it('no highlights: raw text, no link in bio', () => {
    setup({ lines: ['Texte simple'] })
    expect(screen.getByText('Texte simple')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1) // CTA seul
  })

  it('turns a highlighted word into a link', () => {
    setup({
      lines: ['Je fais du React au quotidien'],
      highlights: [{ word: 'React', href: '/projets' }],
    })
    const link = screen.getByRole('link', { name: 'React' })
    expect(link).toHaveAttribute('href', '/projets')
    expect(link).toHaveClass('highlight')
  })

  it('preserves the full text of the line', () => {
    const { container } = setup({
      lines: ['Je fais du React au quotidien'],
      highlights: [{ word: 'React', href: '/projets' }],
    })
    expect(container.querySelector('p.bioLine')).toHaveTextContent(
      'Je fais du React au quotidien',
    )
  })

  it('multiple highlights in a single line', () => {
    setup({
      lines: ['React et Next.js ensemble'],
      highlights: [
        { word: 'React', href: '/a' },
        { word: 'Next.js', href: '/b' },
      ],
    })
    expect(screen.getByRole('link', { name: 'React' })).toHaveAttribute('href', '/a')
    expect(screen.getByRole('link', { name: 'Next.js' })).toHaveAttribute('href', '/b')
  })

  it('same word repeated = an equal number of links', () => {
    setup({
      lines: ['React puis React'],
      highlights: [{ word: 'React', href: '/a' }],
    })
    expect(screen.getAllByRole('link', { name: 'React' })).toHaveLength(2)
  })

  it('escape regex characters (C++, .NET, $)', () => {
    setup({
      lines: ['Du C++ et du .NET à 5$'],
      highlights: [
        { word: 'C++', href: '/cpp' },
        { word: '.NET', href: '/net' },
        { word: '5$', href: '/money' },
      ],
    })
    expect(screen.getByRole('link', { name: 'C++' })).toHaveAttribute('href', '/cpp')
    expect(screen.getByRole('link', { name: '.NET' })).toHaveAttribute('href', '/net')
    expect(screen.getByRole('link', { name: '5$' })).toHaveAttribute('href', '/money')
  })

  it('"." escaping does not work for just any character', () => {
    setup({
      lines: ['Node js et Node.js'],
      highlights: [{ word: 'Node.js', href: '/n' }],
    })
    expect(screen.getAllByRole('link', { name: 'Node.js' })).toHaveLength(1)
  })

  it('Highlight missing from the line: no link added', () => {
    setup({
      lines: ['Rien ici'],
      highlights: [{ word: 'Vue', href: '/v' }],
    })
    expect(screen.queryByRole('link', { name: 'Vue' })).not.toBeInTheDocument()
  })

  it('case-sensitive', () => {
    setup({
      lines: ['react en minuscule'],
      highlights: [{ word: 'React', href: '/r' }],
    })
    expect(screen.queryByRole('link', { name: /react/i })).not.toBeInTheDocument()
  })

  it('CTA points to /contact with the translated label', () => {
    setup()
    const cta = screen.getByRole('link', { name: 'Me contacter' })
    expect(cta).toHaveAttribute('href', '/contact')
    expect(cta).toHaveClass('ctaBtn')
  })

  it('PhotoFrame : imgUrl, cvUrl (env), className', () => {
    vi.stubEnv('PROFILE_CV_LINK', 'https://cv.example/cv.pdf')
    setup()
    expect(screen.getByTestId('photo')).toBeInTheDocument()
    expect(photoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        imgUrl: '/api/profile-img',
        cvUrl: 'https://cv.example/cv.pdf',
        className: 'photoWrap',
      }),
    )
  })

  it('PhotoFrame : cvUrl fallback "#" if env absent', () => {
    vi.stubEnv('PROFILE_CV_LINK', undefined as unknown as string)
    setup()
    expect(photoSpy).toHaveBeenCalledWith(
      expect.objectContaining({ cvUrl: '#' }),
    )
  })
})
