import { useLocalSearchParams } from 'expo-router';

import { RoleDetailScreen } from '@/components/users/role-detail-screen';

export default function RoleDetailRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <RoleDetailScreen key={id} id={id} />;
}
