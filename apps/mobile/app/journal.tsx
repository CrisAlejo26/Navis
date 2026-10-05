import { JournalDirectory } from '@/components/journal/journal-directory';
import { useListContext } from '@/hooks/use-lists';

export default function JournalScreen() {
    const { context } = useListContext();
    return <JournalDirectory key={`${context.churchId}:${context.userId}`} />;
}
