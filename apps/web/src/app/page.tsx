import type { Metadata } from 'next';
import { Suspense } from 'react';
import HeroSection from '@/features/home/HeroSection';
import FeaturedProperties from '@/features/home/FeaturedProperties';
import PopularProperties from '@/features/home/PopularProperties';
import PosterBannerSection from '@/features/home/PosterBannerSection';
import PopularProjects from '@/features/home/PopularProjects';
import ExploreLocations from '@/features/home/ExploreLocations';
import WhyChooseUs from '@/features/home/WhyChooseUs';
import PwaInstallSection from '@/features/home/PwaInstallSection';
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
      {/* 2. HERO + PROPERTY SEARCH + QUICK CATEGORIES */}
      <HeroSection />

      {/* 4. FEATURED PROPERTIES (Positioned ABOVE project banners for instant property discovery) */}
      <Suspense fallback={<FeaturedPropertiesSkeleton />}>
        <FeaturedProperties />
      </Suspense>

      {/* 5. POPULAR PROPERTIES / COLLECTIONS */}
      <Suspense fallback={<FeaturedPropertiesSkeleton />}>
        <PopularProperties />
      </Suspense>

      {/* 6. FEATURED PROJECTS & MARKETING BANNERS (Positioned BELOW property discovery) */}
      <PosterBannerSection />
      
      <Suspense fallback={<PopularProjectsSkeleton />}>
        <PopularProjects />
      </Suspense>

      {/* 7. EXPLORE PROPERTIES BY LOCATION */}
      <ExploreLocations />

      {/* 8. WHY REWA BHOOMI */}
      <WhyChooseUs />

      {/* 9. APP / PWA INSTALL SECTION */}
      <PwaInstallSection />
    </main>
  );
}
