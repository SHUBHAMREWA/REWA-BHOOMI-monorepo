import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PropertyDetailPage from '@/features/properties/PropertyDetailPage';
import { APP_NAME, APP_URL } from '@rewa-bhoomi/config';
import { cookies } from 'next/headers';

export const revalidate = 300; // 5-minute ISR cache

interface Props {
  params: { slug: string };
}

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
    let cookieStr = '';
    try {
      const cookieStore = cookies();
      const allCookies = cookieStore.getAll();
      if (allCookies.length > 0) {
        cookieStr = allCookies.map(c => `${c.name}=${c.value}`).join('; ');
      }
    } catch {
      // At static build time, cookies() is not available
    }

    const fetchOptions: RequestInit = cookieStr
      ? {
          headers: { Cookie: cookieStr },
          cache: 'no-store',
        }
      : {
          next: { revalidate: 300 },
        };

    const res = await fetch(`${apiUrl}/api/v1/properties/${slug}`, fetchOptions);

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${apiUrl}/api/v1/properties?status=PUBLISHED&limit=30&page=1`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const properties = Array.isArray(json?.data) ? json.data : (Array.isArray(json?.data?.data) ? json.data.data : []);
    return properties.map((p: { slug: string }) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (params.slug?.endsWith('.js') || params.slug?.startsWith('_')) {
    return { title: 'Not Found' };
  }

  const property = await getProperty(params.slug);

  if (!property) {
    return {
      title: `Property Not Found | ${APP_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  const title = `${property.title} in ${property.city || 'Rewa'} | ${APP_NAME}`;
  const description = property.description
    ? property.description.replace(/\s+/g, ' ').trim().slice(0, 160)
    : `Find properties in ${property.city || 'Rewa'} on ${APP_NAME}`;
  const imageUrl = property.images?.[0]?.url || `${APP_URL}/og-image.jpg`;
  const canonicalUrl = `${APP_URL}/property/${params.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: property.title }],
      type: 'article',
      siteName: APP_NAME,
      locale: 'en_IN',
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
        <>
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
                  price: property.price_amount || property.price,
                  priceCurrency: 'INR',
                  availability: property.status === 'SOLD' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
                },
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: property.address || undefined,
                  addressLocality: property.city || 'Rewa',
                  addressRegion: property.state || 'Madhya Pradesh',
                  addressCountry: 'IN',
                },
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: APP_URL,
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Properties',
                    item: `${APP_URL}/properties`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: property.title,
                    item: `${APP_URL}/property/${property.slug}`,
                  },
                ],
              }),
            }}
          />
        </>
      )}
      <PropertyDetailPage initialProperty={property} slug={params.slug} />
    </>
  );
}
