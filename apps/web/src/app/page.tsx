import type { Metadata } from 'next';
import { Suspense } from 'react';
import HeroSection from '@/features/home/HeroSection';
import FeaturedProperties from '@/features/home/FeaturedProperties';
import PopularProjects from '@/features/home/PopularProjects';
import WhyChooseUs from '@/features/home/WhyChooseUs';
import StatsBar from '@/features/home/StatsBar';
import { APP_NAME, APP_DESCRIPTION, APP_URL } from '@rewa-bhoomi/config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${APP_NAME} — Buy, Sell & Rent Properties in Rewa, MP`,
  description: APP_DESCRIPTION,
  alternates: { canonical: APP_URL },
};

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <StatsBar />
      <Suspense fallback={<div className="h-96 skeleton" />}>
        <FeaturedProperties />
      </Suspense>
      <WhyChooseUs />
      <Suspense fallback={<div className="h-64 skeleton" />}>
        <PopularProjects />
      </Suspense>
    </main>
  );
}
