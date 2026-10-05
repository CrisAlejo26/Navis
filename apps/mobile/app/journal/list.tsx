import { JournalDirectory } from '@/components/journal/journal-directory';
import { useListContext } from '@/hooks/use-lists';
export default function JournalListScreen() {
    const { context } = useListContext();
    return <JournalDirectory list key={`${context.churchId}:${context.userId}`} />;
}
