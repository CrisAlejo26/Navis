import type { ListViewer } from '@navis/shared';
import { useState } from 'react';
import { useLists, useListMutation } from './use-lists';
import { setViewerLists, revokeListViewer } from '@/data/repos/list-viewers-writes';
import { updateListViewer, regenerateViewerPassword } from '@/data/repos/list-viewers-settings';
import { newViewerPassword } from '@/lib/lists/viewer-password';

export function useViewerDetail(viewer: ListViewer, onClose: () => void) {
    const lists = useLists();
    const [confirm, setConfirm] = useState(false);
    const [password, setPassword] = useState<string | null>(null);
    const [label, setLabel] = useState(viewer.label);
    const [expires, setExpires] = useState(viewer.expiresAt?.slice(0, 10) ?? '');
    const save = useListMutation((context) =>
        updateListViewer(context, viewer.id, {
            label,
            expiresAt: expires ? `${expires}T23:59:59.999Z` : null,
        }),
    );
    const active = useListMutation((context, isActive: boolean) =>
        updateListViewer(context, viewer.id, { isActive }),
    );
    const grants = useListMutation((context, ids: string[]) =>
        setViewerLists(context, viewer.id, ids),
    );
    const remove = useListMutation((context) => revokeListViewer(context, viewer.id));
    const reset = useListMutation((context, value: string) =>
        regenerateViewerPassword(context, viewer.id, value),
    );
    const busy = [save, active, grants, remove, reset].some((one) => one.isPending);
    const failed = [save, active, grants, remove, reset].some((one) => one.isError);
    return {
        lists,
        confirm,
        setConfirm,
        password,
        clearPassword: () => setPassword(null),
        label,
        setLabel,
        expires,
        setExpires,
        busy,
        failed,
        saving: save.isPending,
        removing: remove.isPending,
        save: () => save.mutateAsync(undefined),
        activate: (value: boolean) => active.mutate(value),
        grant: (ids: string[]) => grants.mutate(ids),
        revoke: () =>
            void remove
                .mutateAsync(undefined)
                .then(onClose)
                .catch(() => undefined),
        regenerate: () => {
            const value = newViewerPassword();
            void reset
                .mutateAsync(value)
                .then(() => setPassword(value))
                .catch(() => undefined);
        },
    };
}
