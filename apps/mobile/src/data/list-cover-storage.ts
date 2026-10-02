/** Covers share the photo backup adapter, under a namespace separate from believer UUIDs. */
export function listCoverFileId(listId: string): string {
    return `list-cover-${listId}`;
}
