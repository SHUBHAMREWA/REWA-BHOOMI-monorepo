import type { Metadata } from 'next';
import { Suspense } from 'react';
import HeroSection from '@/features/home/HeroSection';
import PosterBannerSection from '@/features/home/PosterBannerSection';
import FeaturedProperties from '@/features/home/FeaturedProperties';
import PopularProjects from '@/features/home/PopularProjects';
import WhyChooseUs from '@/features/home/WhyChooseUs';
import {
  FeaturedPropertiesSkeleton,
  PopularProjectsSkeleton,
} from '@/features/home/HomeSkeletons';
import { APP_NAME, APP_DESCRIPTION, APP_URL } from '@rewa-bhoomi/config';

export const revalidate = 60;

export const metadata: Metadata = {
  title: `${APP_NAME} — Buy, Sell & Rent Properties in Rewa, MP`,
  description: APP_DESCRIPTION,
  alternates: { canonical: APP_URL },
  openGraph: {
    title: `${APP_NAME} — Buy, Sell & Rent Properties in Rewa`,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    type: 'website',
    images: [
      {
        url: `${APP_URL}/og-image.jpg`,
        secureUrl: `${APP_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: `${APP_NAME} — Buy, Sell & Rent Properties in Rewa`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Buy, Sell & Rent Properties in Rewa`,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/og-image.jpg`],
  },
};

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <PosterBannerSection />
      <Suspense fallback={<FeaturedPropertiesSkeleton />}>
        <FeaturedProperties />
      </Suspense>
      <WhyChooseUs />
      <Suspense fallback={<PopularProjectsSkeleton />}>
        <PopularProjects />
      </Suspense>
    </main>
  );
}

