import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PropertyDetailPage from '@/features/properties/PropertyDetailPage';
import { APP_NAME } from '@rewa-bhoomi/config';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

import { cookies } from 'next/headers';

async function getProperty(slug: string) {
  if (
    !slug ||
    slug.startsWith('_') ||
    slug.endsWith('.js') ||
    slug.endsWith('.map') ||
    slug.endsWith('.json') ||
    slug.endsWith('.png') ||
    slug.endsWith('.jpg') ||
    slug.endsWith('.ico')
  ) {
    return null;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  
  try {
    const cookieStore = cookies();
    const cookieStr = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');

    const res = await fetch(`${apiUrl}/api/v1/properties/${slug}`, {
      headers: {
        Cookie: cookieStr
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (params.slug?.endsWith('.js') || params.slug?.startsWith('_')) {
    return { title: 'Not Found' };
  }

  const property = await getProperty(params.slug);

  if (!property) {
    return { title: 'Property Not Found' };
  }


  const title = `${property.title} | ${APP_NAME}`;
  const description = property.description.substring(0, 160);
  const imageUrl = property.images?.[0]?.url || '/og-image.jpg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PropertyRoute({ params }: Props) {
  const property = await getProperty(params.slug);

  let heroPreloadUrl = property?.images?.[0]?.url;
  if (property?.video_url && property.video_url.trim() !== '') {
    if (property.video_url.includes('youtu.be/')) {
      const id = property.video_url.split('youtu.be/')[1].split('?')[0];
      if (id) heroPreloadUrl = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    } else if (property.video_url.includes('youtube.com')) {
      let id = '';
      if (property.video_url.includes('v=')) id = property.video_url.split('v=')[1].split('&')[0];
      else if (property.video_url.includes('/shorts/')) id = property.video_url.split('/shorts/')[1].split('?')[0];
      if (id) heroPreloadUrl = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }
  }

  return (
    <>
      {heroPreloadUrl && (
        <link
          rel="preload"
          as="image"
          href={heroPreloadUrl}
          // @ts-ignore
          fetchPriority="high"
        />
      )}
      {property && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'RealEstateListing',
              name: property.title,
              description: property.description,
              image: property.images?.map((img: any) => img.url) || [],
              offers: {
                '@type': 'Offer',
                price: property.price,
                priceCurrency: 'INR',
              },
              address: {
                '@type': 'PostalAddress',
                addressLocality: property.city,
                addressRegion: property.state,
                addressCountry: 'IN',
              },
            }),
          }}
        />
      )}
      <PropertyDetailPage initialProperty={property} slug={params.slug} />
    </>
  );
}
