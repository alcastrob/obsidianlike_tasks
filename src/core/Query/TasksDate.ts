import type { Moment } from 'moment';

/**
 * Wraps a nullable date for use inside `filter by function` / `group by function` / `sort by
 * function` scripting expressions, mirroring Obsidian Tasks' `DateTime/TasksDate.ts` — mainly
 * so `task.happens.format("YYYY-MM-DD dddd")`-style expressions (copy-pasted from real vaults)
 * work unchanged, without every expression needing a null check first.
 */
export class TasksDate {
    constructor(private readonly date: Moment | null) {}

    get moment(): Moment | null {
        return this.date ? this.date.clone() : null;
    }

    /** See https://momentjs.com/docs/#/displaying/ for the format string syntax. */
    format(format: string, fallBackText: string = ''): string {
        return this.date ? this.date.format(format) : fallBackText;
    }

    formatAsDate(fallBackText: string = ''): string {
        return this.format('YYYY-MM-DD', fallBackText);
    }
}
