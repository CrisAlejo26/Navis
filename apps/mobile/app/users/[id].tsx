import { useLocalSearchParams } from 'expo-router';

import { UserDetailScreen } from '@/components/users/user-detail-screen';

export default function UserDetailRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <UserDetailScreen key={id} id={id} />;
}
