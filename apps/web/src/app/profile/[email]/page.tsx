import AdminUserProfilePage from '@/features/profile/AdminUserProfilePage';

interface Props {
  params: {
    email: string;
  };
}

export default function Page({ params }: Props) {
  // Decode URL encoded email (e.g. user%40gmail.com -> user@gmail.com)
  const decodedEmail = decodeURIComponent(params.email);
  return <AdminUserProfilePage email={decodedEmail} />;
}
