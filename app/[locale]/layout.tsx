import { Syne, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from "next-intl";
import { BackgroundProvider } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'
import ThreeSceneLoader from "@/app/[locale]/_components/backgroundThreeJS/threeLoader"
import ScrollHint from './_components/ScrollHint/ScrollHint';
import NavBar from './_components/navBar/navbar';
import ThemeProvider from '@/app/[locale]/_components/themeProvider/ThemeProvider'
import './globals.css';

export const metadata = {
  icons: {
    icon: '/favicon.svg',
  }
}

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
