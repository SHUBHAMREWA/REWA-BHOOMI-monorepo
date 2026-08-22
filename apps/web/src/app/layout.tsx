import type { Metadata, Viewport } from 'next';
import { APP_NAME, APP_DESCRIPTION, APP_URL } from '@rewa-bhoomi/config';
import './globals.css';
import Providers from '@/components/providers/Providers';
import LayoutWrapper from '@/components/layout/LayoutWrapper';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Buy, Sell & Rent Properties in Rewa`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'real estate rewa',
    'property for sale rewa',
    'property for rent rewa',
    'plot rewa',
    'house rewa mp',
    'flat rewa madhya pradesh',
    'rewa bhoomi',
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Buy, Sell & Rent Properties in Rewa`,
    description: APP_DESCRIPTION,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Properties in Rewa`,
    description: APP_DESCRIPTION,
    images: ['/og-image.jpg'],
  },
  manifest: '/favicons/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicons/favicon.ico', sizes: 'any' },
    ],
    apple: '/favicons/apple-touch-icon.png',
    other: [
      { rel: 'android-chrome', url: '/favicons/android-chrome-192x192.png', sizes: '192x192' },
      { rel: 'android-chrome', url: '/favicons/android-chrome-512x512.png', sizes: '512x512' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#1a56db',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: APP_NAME,
              url: APP_URL,
              description: APP_DESCRIPTION,
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Rewa',
                addressRegion: 'Madhya Pradesh',
                addressCountry: 'IN',
              },
            }),
          }}
        />
      </head>
      <body>
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
