import { Metadata } from 'next';
import PublicProfilePage from '@/features/profile/PublicProfilePage';

interface Props {
  params: {
    username: string;
  };
}

// Fetch user data for SEO tags
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = params.username;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile/${username}`, { next: { revalidate: 60 } });
    if (!res.ok) {
      return {
        title: 'User Not Found | REWA Bhoomi',
      };
    }
    const { data: user } = await res.json();
    
    return {
      title: `${user.name} (@${user.username}) | REWA Bhoomi`,
      description: user.bio || `View ${user.name}'s property listings on REWA Bhoomi.`,
      openGraph: {
        title: `${user.name} (@${user.username}) | REWA Bhoomi`,
        description: user.bio || `View ${user.name}'s property listings on REWA Bhoomi.`,
        images: user.avatar_url ? [{ url: user.avatar_url }] : [],
        type: 'profile',
      },
    };
  } catch (e) {
    return {
      title: 'Profile | REWA Bhoomi',
    };
  }
}

export default function UserProfileRoute({ params }: Props) {
  return <PublicProfilePage username={params.username} />;
}
