import type { Metadata } from 'next';
import { Suspense } from 'react';
import HeroSection from '@/features/home/HeroSection';
import PosterBannerSection from '@/features/home/PosterBannerSection';
import FeaturedProperties from '@/features/home/FeaturedProperties';
import PopularProjects from '@/features/home/PopularProjects';
import WhyChooseUs from '@/features/home/WhyChooseUs';
import StatsBar from '@/features/home/StatsBar';
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
};

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <PosterBannerSection />
      <StatsBar />
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

