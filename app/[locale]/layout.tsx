import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Syne, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from "next-intl";
import { BackgroundProvider } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'
import ThreeSceneLoader from "@/app/[locale]/_components/backgroundThreeJS/threeLoader"
import ScrollHint from './_components/ScrollHint/ScrollHint';
import NavBar from './_components/navBar/navbar';
import ThemeProvider from '@/app/[locale]/_components/themeProvider/ThemeProvider'
import './globals.css';

type Props = {
  params: Promise<{ locale: string }>;
};

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400','600','700','800'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300','400','500','700'],
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seoMetadata' });
  const title = process.env.WEBSITE_NAME ?? 'WEBSITE NAME';
  const shortName = process.env.SHORT_NAME ?? 'SHORT NAME';
  const url = process.env.WEBSITE_URL ?? 'WEBSITE URL';

  return {
    title: {
       template: `${title} | %s `,
       default: `${title} | ${t('home')}`,
    },
    description: t('description'),
    icons: {
      icon: '/favicon.svg',
    },
    alternates: {
        canonical: '/',
        languages: {
          'en-US': '/en',
          'fr-FR': '/fr',
        },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: shortName + t('openGraph.title'),
      description: t('openGraph.description'),
      url: url,
      siteName: t('openGraph.siteName') + shortName,
      type: 'profile',
      locale: locale === 'en' ? 'en_US' : 'fr_FR',
    },
  }
}

export default async function RootLayout({ children, params }: LayoutProps<'/[locale]'>) {

  const { locale } = await params;

  return (
    <html className={`${syne.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
        <BackgroundProvider>
          <ThreeSceneLoader />
          <NavBar />
            <ScrollHint />
              <NextIntlClientProvider locale={locale}>
                {children}
              </NextIntlClientProvider>
          </BackgroundProvider>
        </ThemeProvider>
        </body>
    </html>
  )
}
