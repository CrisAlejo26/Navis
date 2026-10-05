import { useLocalSearchParams } from 'expo-router';
import { JournalDetail } from '@/components/journal/journal-detail';
import { useListContext } from '@/hooks/use-lists';
export default function JournalEntryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { context } = useListContext();
    return <JournalDetail id={id} key={`${context.churchId}:${context.userId}:${id}`} />;
}
