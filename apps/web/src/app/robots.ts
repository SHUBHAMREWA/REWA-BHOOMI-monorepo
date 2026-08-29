import { MetadataRoute } from 'next';
import { APP_URL } from '@rewa-bhoomi/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Allow Googlebot full access to public pages ──────────────────────
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/blog/',
          '/about',
          '/contact',
          '/privacy',
          '/terms',
          '/u/',
          '/property/',
          '/properties',
          '/projects',
        ],
        disallow: [
          '/admin/',
          '/auth/',
          '/profile/',
          '/favorites/',
          '/api/',
          '/*?*',        // block query-string variants (duplicate content)
        ],
      },
      // ── Allow all other crawlers (same rules) ────────────────────────────
      {
        userAgent: '*',
        allow: [
          '/',
          '/blog/',
          '/about',
          '/contact',
          '/privacy',
          '/terms',
          '/u/',
          '/property/',
          '/properties',
          '/projects',
        ],
        disallow: [
          '/admin/',
          '/auth/',
          '/profile/',
          '/favorites/',
          '/api/',
        ],
      },
    ],
    // Sitemap URL — Google Search Console me isko submit karo
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
