import {
    extractTeachingBodyText,
    parseTeachingBody,
    toExcerpt,
    type Teaching as TeachingView,
    type TeachingListItem,
} from '@navis/shared';

import { toIsoDay } from '../database/iso-day';
import type { Teaching } from './teaching.entity';

export function toTeachingView(teaching: Teaching): TeachingView {
    return {
        id: teaching.id,
        title: teaching.title,
        body: parseTeachingBody(teaching.bodyJson),
        receivedAt: toIsoDay(teaching.receivedAt),
        createdAt: teaching.createdAt.toISOString(),
    };
}

export function toListItem(teaching: Teaching): TeachingListItem {
    const { text, checklist } = extractTeachingBodyText(parseTeachingBody(teaching.bodyJson));

    return {
        id: teaching.id,
        title: teaching.title,
        excerpt: toExcerpt(text),
        receivedAt: toIsoDay(teaching.receivedAt),
        checklist,
    };
}
