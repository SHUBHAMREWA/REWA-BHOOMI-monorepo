import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PropertyDetailPage from '@/features/properties/PropertyDetailPage';
import { APP_NAME } from '@rewa-bhoomi/config';

interface Props {
  params: {
    purpose: string;
    category: string;
    type: string;
    slug: string;
  };
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
    const res = await fetch(`${apiUrl}/api/v1/properties/${slug}`, {
      next: { revalidate: 60 },
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
  if (params.purpose.startsWith('_') || params.slug.endsWith('.js')) {
    return { title: 'Not Found' };
  }

  const property = await getProperty(params.slug);
  if (!property) return { title: 'Property Not Found' };

  const title = `${property.title} | ${params.purpose.toUpperCase()} in ${property.city} | ${APP_NAME}`;
  const description = property.description?.slice(0, 160) || `View details for ${property.title} in ${property.city}, Madhya Pradesh.`;
  const canonicalUrl = `https://rewabhoomi.com/${params.purpose}/${params.category}/${params.type}/${params.slug}`;
  const imageUrl = property.images?.[0]?.url || '/og-image.jpg';

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
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

export default async function PropertySeoRoute({ params }: Props) {
  if (
    params.purpose.startsWith('_') ||
    params.category.startsWith('_') ||
    params.type.startsWith('_') ||
    params.slug.endsWith('.js')
  ) {
    notFound();
  }

  const property = await getProperty(params.slug);
  if (!property) {
    notFound();
  }


  return (
    <>
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
                price: property.price_amount || property.price,
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
