import { Metadata } from 'next';
import PublicProfilePage from '@/features/profile/PublicProfilePage';
import { APP_NAME, APP_URL } from '@rewa-bhoomi/config';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    username: string;
  };
}

// Fetch user data for SEO / Open Graph tags (WhatsApp, Facebook, Twitter, Google)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = params.username;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const profileUrl = `${APP_URL}/u/${username}`;

  try {
    const res = await fetch(`${apiUrl}/api/v1/users/profile/${username}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return {
        title: `User Not Found | ${APP_NAME}`,
      };
    }

    const json = await res.json();
    const user = json?.data;

    if (!user) {
      return {
        title: `User Not Found | ${APP_NAME}`,
      };
    }

    const displayName = user.name || user.username || 'User';
    const title = `${displayName} (@${user.username}) — Profile | ${APP_NAME}`;
    const description =
      user.bio && user.bio.trim().length > 0
        ? user.bio
        : `Check out ${displayName}'s profile and verified property listings in Rewa on ${APP_NAME}.`;

    const imageUrl = user.avatar_url || `${APP_URL}/og-image.jpg`;

    return {
      title,
      description,
      alternates: {
        canonical: profileUrl,
      },
      openGraph: {
        title: `${displayName} (@${user.username}) | ${APP_NAME}`,
        description,
        url: profileUrl,
        siteName: APP_NAME,
        type: 'profile',
        images: [
          {
            url: imageUrl,
            width: user.avatar_url ? 500 : 1200,
            height: user.avatar_url ? 500 : 630,
            alt: `${displayName}`,
          },
        ],
      },
      twitter: {
        card: 'summary',
        title: `${displayName} (@${user.username}) | ${APP_NAME}`,
        description,
        images: [imageUrl],
      },
    };
  } catch (e) {
    return {
      title: `Profile | ${APP_NAME}`,
      description: `User profile on ${APP_NAME}`,
    };
  }
}

export default function UserProfileRoute({ params }: Props) {
  return <PublicProfilePage username={params.username} />;
}

