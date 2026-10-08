import { useLocalSearchParams } from 'expo-router';

import { AccessDetailScreen } from '@/components/users/access-detail-screen';

export default function AccessDetailRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <AccessDetailScreen key={id} id={id} />;
}
