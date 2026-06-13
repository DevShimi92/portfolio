import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';
import {routing} from './app/i18n/routing';


const handleI18nRouting = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  let response = handleI18nRouting(request);

  if (response.ok) {
    // (not for errors or redirects)
    const [, locale, ...rest] = new URL(
      response.headers.get('x-middleware-rewrite') || request.url
    ).pathname.split('/');
    const pathname = '/' + rest.join('/');
  }

  return response;
}
export const config = {
  // Match only internationalized pathnames
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
