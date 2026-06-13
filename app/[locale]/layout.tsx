import { NextIntlClientProvider } from "next-intl";
import './globals.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export default async function RootLayout({ children, params }: LayoutProps<'/[locale]'>) {

  const { locale } = await params;

  return (
    <html>
      <body>
        <NextIntlClientProvider locale={locale}>
          {children}
        </NextIntlClientProvider>
        </body>
    </html>
  );
}
