import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const withNextIntl = createNextIntlPlugin('./app/i18n/request.ts');

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  }
};

export default withNextIntl(nextConfig);
