"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksDate = void 0;
/**
 * Wraps a nullable date for use inside `filter by function` / `group by function` / `sort by
 * function` scripting expressions, mirroring Obsidian Tasks' `DateTime/TasksDate.ts` — mainly
 * so `task.happens.format("YYYY-MM-DD dddd")`-style expressions (copy-pasted from real vaults)
 * work unchanged, without every expression needing a null check first.
 */
class TasksDate {
    constructor(date) {
        this.date = date;
    }
    get moment() {
        return this.date ? this.date.clone() : null;
    }
    /** See https://momentjs.com/docs/#/displaying/ for the format string syntax. */
    format(format, fallBackText = '') {
        return this.date ? this.date.format(format) : fallBackText;
    }
    formatAsDate(fallBackText = '') {
        return this.format('YYYY-MM-DD', fallBackText);
    }
}
exports.TasksDate = TasksDate;
//# sourceMappingURL=TasksDate.js.map