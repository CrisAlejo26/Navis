import { UsersScreen } from '@/components/users/users-screen';
import { useListContext } from '@/hooks/use-lists';

export default function UsersRoute() {
    const { context } = useListContext();
    // Con `key`, cambiar de iglesia o de cuenta vacía filtros y páginas en vez de arrastrarlos.
    return <UsersScreen key={`${context.churchId}:${context.userId}`} />;
}
