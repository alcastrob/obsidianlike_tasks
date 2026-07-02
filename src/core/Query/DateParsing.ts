import * as chrono from 'chrono-node';
import moment from 'moment';
import type { Moment } from 'moment';
import { TaskRegularExpressions } from '../Task/TaskRegularExpressions';

/**
 * Parse a date expression as used in query filter lines and the task-edit flow (e.g.
 * `2024-01-15`, `today`, `next monday`). Returns null if the text cannot be understood.
 */
export function parseQueryDate(text: string): Moment | null {
    const trimmed = text.trim();
    if (trimmed === '') {
        return null;
    }

    const strict = moment(trimmed, TaskRegularExpressions.dateFormat, true);
    if (strict.isValid()) {
        return strict;
    }

    const parsed = chrono.parseDate(trimmed, new Date(), { forwardDate: false });
    if (parsed !== null) {
        return moment(parsed).startOf('day');
    }

    return null;
}
