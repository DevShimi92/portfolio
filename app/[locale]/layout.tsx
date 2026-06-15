import { Syne, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from "next-intl";
import ThreeSceneLoader from "@/app/components/background/threeLoader"
import { BackgroundProvider } from '@/app/[locale]/_components/BackgroundContext/BackgroundContext'
import './globals.css';


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
    <html className={`${syne.variable} ${mono.variable}`}>
      <body>
        <BackgroundProvider>
          <ThreeSceneLoader />
            <NextIntlClientProvider locale={locale}>
              {children}
            </NextIntlClientProvider>
          </BackgroundProvider>
        </body>
    </html>
  );
}
