import type { LocalColumn, LocalTable } from './local-schema';

const base: LocalColumn[] = [
    { name: 'id', type: 'text', pk: true },
    { name: 'created_at', type: 'text' },
    { name: 'updated_at', type: 'text' },
    { name: 'deleted_at', type: 'text', nullable: true },
];
const text = (name: string, nullable = false): LocalColumn => ({ name, type: 'text', nullable });
const integer = (name: string, value = 0): LocalColumn => ({ name, type: 'int', default: value });
const boolean = (name: string, value = false): LocalColumn => ({
    name,
    type: 'bool',
    default: value,
});

/** Domain columns shared with the six List entities; derived response fields are excluded. */
export const LOCAL_LIST_TABLES: LocalTable[] = [
    {
        name: 'lists',
        mirror: 'List',
        columns: [
            ...base,
            text('church_id'),
            text('name'),
            text('slug'),
            text('description', true),
            { ...text('accent'), default: 'primary' },
            integer('position'),
            boolean('is_active', true),
            { ...text('visibility'), default: 'private' },
            text('share_token', true),
            text('shared_at', true),
            text('share_expires_at', true),
            { ...text('public_fields'), default: '{}' },
            boolean('allow_download'),
            text('cover_key', true),
            text('created_by', true),
        ],
    },
    {
        name: 'list_members',
        mirror: 'ListMember',
        columns: [
            text('list_id'),
            text('believer_id'),
            integer('position'),
            text('note', true),
            text('added_at'),
            text('added_by'),
        ],
    },
    {
        name: 'list_viewers',
        mirror: 'ListViewer',
        columns: [
            ...base,
            text('church_id'),
            text('believer_id', true),
            text('username'),
            text('password_hash'),
            text('label'),
            boolean('is_active', true),
            text('expires_at', true),
            text('sessions_valid_from'),
            text('last_seen_at', true),
            text('created_by'),
        ],
    },
    {
        name: 'list_grants',
        mirror: 'ListGrant',
        columns: [text('viewer_id'), text('list_id'), text('granted_at'), text('granted_by')],
    },
    {
        name: 'list_views',
        mirror: 'ListView',
        columns: [
            text('id'),
            text('list_id'),
            text('viewer_id', true),
            text('viewed_at'),
            text('visitor_hash'),
            { ...text('ip_prefix'), default: '' },
            { ...text('device'), default: 'desktop' },
            text('platform', true),
            text('referrer_host', true),
            integer('views', 1),
        ],
    },
    {
        name: 'list_access_log',
        mirror: 'ListAccessLog',
        columns: [
            text('id'),
            text('list_id'),
            text('viewer_id', true),
            text('username'),
            text('outcome'),
            { ...text('ip_prefix'), default: '' },
            text('at'),
        ],
    },
];
