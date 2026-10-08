import { UsersDirectory } from '@/components/users/users-directory';
import { useListContext } from '@/hooks/use-lists';

export default function UsersScreen() {
    const { context } = useListContext();
    // Con `key`, cambiar de iglesia o de cuenta vacía filtros y páginas en vez de arrastrarlos.
    return <UsersDirectory key={`${context.churchId}:${context.userId}`} />;
}
