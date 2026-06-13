import { Syne, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from "next-intl";
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

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export default async function RootLayout({ children, params }: LayoutProps<'/[locale]'>) {

  const { locale } = await params;

  return (
    <html className={`${syne.variable} ${mono.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale}>
          {children}
        </NextIntlClientProvider>
        </body>
    </html>
  );
}
