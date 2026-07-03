"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksQuery = void 0;
const Priority_1 = require("../Task/Priority");
const DateTools_1 = require("../DateTime/DateTools");
const DateParsing_1 = require("./DateParsing");
const ScriptingTaskView_1 = require("./ScriptingTaskView");
const DATE_FIELD_NAMES = ['due', 'scheduled', 'start', 'done', 'created', 'cancelled'];
// Obsidian Tasks uses "starts" (not "start") as the verb form for start-date comparisons
// ("starts on today", "starts before 2024-01-01"), unlike every other date field, which keeps
// its noun form ("due before", "scheduled on", ...). Both forms are accepted here for every
// field, which is more lenient than upstream but never incorrect.
const DATE_FIELD_ALIASES = {
    due: 'due',
    scheduled: 'scheduled',
    start: 'start',
    starts: 'start',
    done: 'done',
    created: 'created',
    cancelled: 'cancelled',
};
// Layout/display instructions (`hide <x>` / `show <x>`) that Obsidian Tasks recognises. This
// port's renderer (markdownTasksPlugin.ts) doesn't yet have per-field toggles, so these are
// accepted-but-no-op — the point is only to stop them from being reported as unrecognised lines,
// matching upstream's list of valid option names (Layout/TaskLayoutOptions.ts,
// Layout/QueryLayoutOptions.ts) so a typo like `hide diu date` is still flagged.
const HIDE_SHOW_OPTION_KEYWORDS = [
    'cancelled date',
    'created date',
    'depends on',
    'done date',
    'due date',
    'id',
    'on completion',
    'priority',
    'recurrence rule',
    'scheduled date',
    'start date',
    'tags',
    'backlink',
    'edit button',
    'postpone button',
    'task count',
    'toolbar',
    'tree',
    'urgency',
];
const PRIORITY_NAME_TO_VALUE = {
    highest: Priority_1.Priority.Highest,
    high: Priority_1.Priority.High,
    medium: Priority_1.Priority.Medium,
    none: Priority_1.Priority.None,
    normal: Priority_1.Priority.None,
    low: Priority_1.Priority.Low,
    lowest: Priority_1.Priority.Lowest,
};
function dateValue(task, field) {
    switch (field) {
        case 'due':
            return task.dueDate;
        case 'scheduled':
            return task.scheduledDate;
        case 'start':
            return task.startDate;
        case 'done':
            return task.doneDate;
        case 'created':
            return task.createdDate;
        case 'cancelled':
            return task.cancelledDate;
    }
}
/**
 * Finds every top-level occurrence of ` OPERATOR ` in `text` — "top-level" meaning outside of
 * any parenthesised group, so `(a OR b) AND c` splits on the `AND` but not the `OR` inside the
 * parens. Used to parse `(filter1) OR (filter2) OR (filter3)`-style boolean combinations without
 * a full expression-parser library.
 */
function splitTopLevel(text, operator) {
    const parts = [];
    const opRegex = new RegExp(`^\\s+${operator}\\s+`, 'i');
    let depth = 0;
    let start = 0;
    let i = 0;
    while (i < text.length) {
        const ch = text[i];
        if (ch === '(') {
            depth++;
        }
        else if (ch === ')') {
            depth--;
        }
        if (depth === 0) {
            const match = opRegex.exec(text.slice(i));
            if (match) {
                parts.push(text.slice(start, i));
                i += match[0].length;
                start = i;
                continue;
            }
        }
        i++;
    }
    parts.push(text.slice(start));
    return parts;
}
/** True if `text` is a single parenthesised group wrapping its entire contents, e.g. `(a)` or
 * `(a OR b)`, but not `(a)(b)` or `(a) OR (b)` (where each side has its own parens). */
function isFullyWrapped(text) {
    if (!text.startsWith('(') || !text.endsWith(')')) {
        return false;
    }
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '(')
            depth++;
        else if (text[i] === ')') {
            depth--;
            if (depth === 0 && i !== text.length - 1) {
                return false;
            }
        }
    }
    return depth === 0;
}
/** Builds a `task => boolean` (or `null` on a syntax error) from a scripting expression, e.g.
 * the text after `filter by function`. Evaluates with `new Function` — see the docstring on
 * {@link createScriptingTaskView} for why that's an intentional, documented choice here. */
function compileFilterFunction(expression) {
    let fn;
    try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        fn = new Function('task', `return (${expression});`);
    }
    catch {
        return null;
    }
    return (task) => {
        try {
            return !!fn((0, ScriptingTaskView_1.createScriptingTaskView)(task));
        }
        catch {
            return false;
        }
    };
}
/**
 * A deliberately practical subset of Obsidian Tasks' query language (`src/Query`), which in
 * the original plugin is implemented as ~50 files of composable `Field` classes. This covers
 * the filter/sort/group/limit instructions that appear in the vast majority of real `tasks`
 * code blocks, parsed line-by-line the same way the original does, so existing query blocks
 * mostly keep working unchanged. Anything unrecognised is reported back rather than throwing,
 * mirroring how Obsidian Tasks surfaces a per-line explanation instead of failing the query.
 *
 * Each non-instruction line is parsed as a boolean expression ({@link parseBooleanExpression}):
 * `(sub-filter) OR (sub-filter) AND NOT (sub-filter)`, with parentheses and `AND`/`OR`/`NOT`
 * combining any of the atomic filters in {@link parseFilterAtom}, including `filter by function`
 * for arbitrary scripting expressions.
 */
class TasksQuery {
    constructor(source) {
        this.filters = [];
        this.sortInstructions = [];
        this.groupByFn = null;
        this.limitCount = null;
        this.unrecognizedLines = [];
        for (const rawLine of source.split('\n')) {
            const line = rawLine.trim();
            if (line === '' || line.startsWith('#')) {
                continue;
            }
            if (!this.parseLine(line)) {
                this.unrecognizedLines.push(line);
            }
        }
    }
    apply(allTasks) {
        let tasks = allTasks.filter((task) => this.filters.every((filter) => filter(task, allTasks)));
        tasks = this.sort(tasks);
        if (this.limitCount !== null) {
            tasks = tasks.slice(0, this.limitCount);
        }
        return {
            tasks,
            groups: this.groupByFn ? this.group(tasks, this.groupByFn) : null,
            unrecognizedLines: this.unrecognizedLines,
        };
    }
    // ---- parsing -----------------------------------------------------------------------
    parseLine(line) {
        if (this.parseSortBy(line) || this.parseGroupBy(line) || this.parseLimit(line) || this.parseHideShow(line)) {
            return true;
        }
        const filterFn = this.parseBooleanExpression(line);
        if (filterFn) {
            this.filters.push(filterFn);
            return true;
        }
        return false;
    }
    /** Handles `(a) OR (b)`, `(a) AND (b)`, `NOT (a)`, and parenthesised nesting of all three,
     * falling back to {@link parseFilterAtom} once no more combinators or wrapping parens are
     * found. `OR` binds more loosely than `AND`, matching how Obsidian Tasks documents it. */
    parseBooleanExpression(text) {
        const trimmed = text.trim();
        if (trimmed === '') {
            return null;
        }
        const orParts = splitTopLevel(trimmed, 'OR');
        if (orParts.length > 1) {
            const fns = orParts.map((part) => this.parseBooleanExpression(part));
            if (fns.some((fn) => fn === null)) {
                return null;
            }
            const compiled = fns;
            return (task, all) => compiled.some((fn) => fn(task, all));
        }
        const andParts = splitTopLevel(trimmed, 'AND');
        if (andParts.length > 1) {
            const fns = andParts.map((part) => this.parseBooleanExpression(part));
            if (fns.some((fn) => fn === null)) {
                return null;
            }
            const compiled = fns;
            return (task, all) => compiled.every((fn) => fn(task, all));
        }
        const notMatch = trimmed.match(/^NOT\s+(.+)$/i);
        if (notMatch) {
            const inner = this.parseBooleanExpression(notMatch[1]);
            if (!inner) {
                return null;
            }
            return (task, all) => !inner(task, all);
        }
        if (isFullyWrapped(trimmed)) {
            return this.parseBooleanExpression(trimmed.slice(1, -1));
        }
        return this.parseFilterAtom(trimmed);
    }
    /** A single, non-combinator filter instruction — one "leaf" of a {@link parseBooleanExpression}
     * tree, or (in the common case) the entirety of a simple query line like `not done`. */
    parseFilterAtom(text) {
        return (this.parseStatusFilter(text) ??
            this.parseStatusTypeFilter(text) ??
            this.parseDateFilter(text) ??
            this.parseHappensFilter(text) ??
            this.parseDependsOnFilter(text) ??
            this.parseIdFilter(text) ??
            this.parsePriorityFilter(text) ??
            this.parsePathFilter(text) ??
            this.parseDescriptionRegexFilter(text) ??
            this.parseDescriptionFilter(text) ??
            this.parseTagFilter(text) ??
            this.parseHeadingFilter(text) ??
            this.parseRecurringFilter(text) ??
            this.parseFilterByFunction(text));
    }
    parseStatusFilter(line) {
        if (/^not done$/i.test(line)) {
            return (task) => !task.isDone;
        }
        if (/^done$/i.test(line)) {
            return (task) => task.isDone;
        }
        return null;
    }
    /** `status.type is <TYPE>` / `status.type is not <TYPE>`, e.g. `status.type is IN_PROGRESS`. */
    parseStatusTypeFilter(line) {
        const match = line.match(/^status\.type is (not )?(\w+)$/i);
        if (!match) {
            return null;
        }
        const negate = match[1] !== undefined;
        const type = match[2].toUpperCase();
        return (task) => (task.status.type === type) !== negate;
    }
    parseDateFilter(line) {
        const fieldPattern = Object.keys(DATE_FIELD_ALIASES).join('|');
        const noDateMatch = line.match(new RegExp(`^no (${fieldPattern}) date$`, 'i'));
        if (noDateMatch) {
            const field = DATE_FIELD_ALIASES[noDateMatch[1].toLowerCase()];
            return (task) => dateValue(task, field) === null;
        }
        const hasDateMatch = line.match(new RegExp(`^has (${fieldPattern}) date$`, 'i'));
        if (hasDateMatch) {
            const field = DATE_FIELD_ALIASES[hasDateMatch[1].toLowerCase()];
            return (task) => dateValue(task, field) !== null;
        }
        const comparisonMatch = line.match(new RegExp(`^(${fieldPattern}) (before|after|on)\\s+(.+)$`, 'i'));
        if (comparisonMatch) {
            const field = DATE_FIELD_ALIASES[comparisonMatch[1].toLowerCase()];
            const comparison = comparisonMatch[2].toLowerCase();
            const target = (0, DateParsing_1.parseQueryDate)(comparisonMatch[3]);
            if (target === null) {
                return null;
            }
            return (task) => {
                const value = dateValue(task, field);
                if (value === null || !value.isValid()) {
                    return false;
                }
                if (comparison === 'before')
                    return value.isBefore(target, 'day');
                if (comparison === 'after')
                    return value.isAfter(target, 'day');
                return value.isSame(target, 'day');
            };
        }
        return null;
    }
    /** `happens before/after/on <date>`, `has happens date`, `no happens date` — a pseudo date
     * field matching if ANY of due/scheduled/start satisfies the condition, mirroring upstream's
     * `HappensDateField` (used for e.g. `(happens before tomorrow) OR (no due date)`-style
     * queries where "happens" stands in for whichever date the task is best known by). */
    parseHappensFilter(line) {
        if (/^has happens date$/i.test(line)) {
            return (task) => task.happensDates.some((date) => date !== null);
        }
        if (/^no happens date$/i.test(line)) {
            return (task) => !task.happensDates.some((date) => date !== null);
        }
        const comparisonMatch = line.match(/^happens (before|after|on)\s+(.+)$/i);
        if (comparisonMatch) {
            const comparison = comparisonMatch[1].toLowerCase();
            const target = (0, DateParsing_1.parseQueryDate)(comparisonMatch[2]);
            if (target === null) {
                return null;
            }
            return (task) => task.happensDates.some((value) => {
                if (value === null || !value.isValid()) {
                    return false;
                }
                if (comparison === 'before')
                    return value.isBefore(target, 'day');
                if (comparison === 'after')
                    return value.isAfter(target, 'day');
                return value.isSame(target, 'day');
            });
        }
        return null;
    }
    /** `has depends on` / `no depends on` — whether the task lists any other task ids it depends on. */
    parseDependsOnFilter(line) {
        if (/^has depends on$/i.test(line)) {
            return (task) => task.dependsOn.length > 0;
        }
        if (/^no depends on$/i.test(line)) {
            return (task) => task.dependsOn.length === 0;
        }
        return null;
    }
    /** `has id` / `no id` — whether the task has been given an `🆔` value. */
    parseIdFilter(line) {
        if (/^has id$/i.test(line)) {
            return (task) => task.id.length > 0;
        }
        if (/^no id$/i.test(line)) {
            return (task) => task.id.length === 0;
        }
        return null;
    }
    parsePriorityFilter(line) {
        const match = line.match(/^priority is (above |below )?(highest|high|medium|none|normal|low|lowest)$/i);
        if (!match) {
            return null;
        }
        const comparison = match[1]?.trim().toLowerCase();
        const target = PRIORITY_NAME_TO_VALUE[match[2].toLowerCase()];
        return (task) => {
            // Priority values are strings '0'..'5', ordered from Highest to Lowest.
            if (comparison === 'above')
                return task.priority < target;
            if (comparison === 'below')
                return task.priority > target;
            return task.priority === target;
        };
    }
    parsePathFilter(line) {
        const includes = line.match(/^path includes (.+)$/i);
        if (includes) {
            const needle = includes[1].toLowerCase();
            return (task) => task.path.toLowerCase().includes(needle);
        }
        const excludes = line.match(/^path does not include (.+)$/i);
        if (excludes) {
            const needle = excludes[1].toLowerCase();
            return (task) => !task.path.toLowerCase().includes(needle);
        }
        return null;
    }
    parseDescriptionFilter(line) {
        const includes = line.match(/^description includes (.+)$/i);
        if (includes) {
            const needle = includes[1].toLowerCase();
            return (task) => task.description.toLowerCase().includes(needle);
        }
        const excludes = line.match(/^description does not include (.+)$/i);
        if (excludes) {
            const needle = excludes[1].toLowerCase();
            return (task) => !task.description.toLowerCase().includes(needle);
        }
        return null;
    }
    /** `description regex matches /pattern/flags`. */
    parseDescriptionRegexFilter(line) {
        const match = line.match(/^description regex matches \/(.+)\/([a-z]*)$/i);
        if (!match) {
            return null;
        }
        let regex;
        try {
            regex = new RegExp(match[1], match[2]);
        }
        catch {
            return null;
        }
        return (task) => {
            regex.lastIndex = 0; // in case the /g flag was used, don't let matches skip around
            return regex.test(task.description);
        };
    }
    parseTagFilter(line) {
        const includes = line.match(/^tags? include (.+)$/i);
        if (includes) {
            const needle = includes[1].toLowerCase();
            return (task) => task.tags.some((tag) => tag.toLowerCase().includes(needle));
        }
        const excludes = line.match(/^tags? do(?:es)? not include (.+)$/i);
        if (excludes) {
            const needle = excludes[1].toLowerCase();
            return (task) => !task.tags.some((tag) => tag.toLowerCase().includes(needle));
        }
        if (/^no tags$/i.test(line)) {
            return (task) => task.tags.length === 0;
        }
        return null;
    }
    parseHeadingFilter(line) {
        const match = line.match(/^heading includes (.+)$/i);
        if (!match) {
            return null;
        }
        const needle = match[1].toLowerCase();
        return (task) => (task.heading ?? '').toLowerCase().includes(needle);
    }
    parseRecurringFilter(line) {
        if (/^is recurring$/i.test(line)) {
            return (task) => task.isRecurring;
        }
        if (/^is not recurring$/i.test(line)) {
            return (task) => !task.isRecurring;
        }
        return null;
    }
    /** `filter by function <scripting expression>`, e.g. `filter by function task.status.name
     * === 'Delegated'`. See {@link createScriptingTaskView} for what `task` exposes. */
    parseFilterByFunction(line) {
        const match = line.match(/^filter by function (.+)$/i);
        if (!match) {
            return null;
        }
        return compileFilterFunction(match[1]);
    }
    parseSortBy(line) {
        const match = line.match(/^sort by (\w+)(?: date)?( reverse)?$/i);
        if (!match) {
            return false;
        }
        const field = this.toSortableField(match[1]);
        if (field === null) {
            return false;
        }
        this.sortInstructions.push({ field, reverse: match[2] !== undefined });
        return true;
    }
    parseGroupBy(line) {
        const functionMatch = line.match(/^group by function (.+)$/i);
        if (functionMatch) {
            let fn;
            try {
                // eslint-disable-next-line @typescript-eslint/no-implied-eval
                fn = new Function('task', `return (${functionMatch[1]});`);
            }
            catch {
                return false;
            }
            this.groupByFn = (task) => {
                try {
                    const result = fn((0, ScriptingTaskView_1.createScriptingTaskView)(task));
                    // A function returning an array (e.g. task.tags.map(...)) puts the task in
                    // every named group at once, matching Obsidian Tasks' multi-group behaviour.
                    const names = Array.isArray(result) ? result : [result];
                    return names.map((n) => String(n));
                }
                catch {
                    return ['(error evaluating group by function)'];
                }
            };
            return true;
        }
        const match = line.match(/^group by (\w+)(?: date)?$/i);
        if (!match) {
            return false;
        }
        const keyword = match[1].toLowerCase();
        const field = keyword === 'heading' || keyword === 'folder' || keyword === 'tags'
            ? keyword
            : this.toSortableField(keyword);
        if (field === null) {
            return false;
        }
        this.groupByFn = (task) => [this.namedGroupKey(task, field)];
        return true;
    }
    parseLimit(line) {
        const match = line.match(/^limit(?: to)? (\d+)(?: tasks)?$/i);
        if (!match) {
            return false;
        }
        this.limitCount = Number.parseInt(match[1], 10);
        return true;
    }
    /** `hide <field>` / `show <field>`, e.g. `hide id`. Recognised-but-no-op: this port's
     * renderer (markdownTasksPlugin.ts) always shows the same fixed set of badges and doesn't
     * yet have per-field layout toggles, so there's nothing to actually hide. Still validated
     * against upstream's known option names ({@link HIDE_SHOW_OPTION_KEYWORDS}) so the line is
     * accepted rather than reported as unrecognised, and a genuine typo is still caught. */
    parseHideShow(line) {
        const match = line.match(/^(?:hide|show) +(.+)$/i);
        if (!match) {
            return false;
        }
        const option = match[1].toLowerCase();
        return HIDE_SHOW_OPTION_KEYWORDS.some((keyword) => option.startsWith(keyword));
    }
    toSortableField(keyword) {
        const lower = keyword.toLowerCase();
        if (DATE_FIELD_NAMES.includes(lower)) {
            return lower;
        }
        if (lower === 'priority' || lower === 'status' || lower === 'description' || lower === 'path') {
            return lower;
        }
        return null;
    }
    // ---- sort / group --------------------------------------------------------------------
    sort(tasks) {
        const instructions = this.sortInstructions.length > 0 ? this.sortInstructions : this.defaultSortInstructions();
        return [...tasks].sort((a, b) => {
            for (const { field, reverse } of instructions) {
                const result = this.compareByField(a, b, field);
                if (result !== 0) {
                    return reverse ? -result : result;
                }
            }
            return 0;
        });
    }
    /**
     * Obsidian Tasks defaults to sorting by 'urgency', a weighted score across due date,
     * priority and scheduled/start dates that this port does not (yet) implement. As a
     * practical stand-in, not-done tasks are shown first, then ordered by due date, then
     * by priority, which matches what most users expect from an unsorted query.
     */
    defaultSortInstructions() {
        return [
            { field: 'status', reverse: false },
            { field: 'due', reverse: false },
            { field: 'priority', reverse: false },
            { field: 'path', reverse: false },
        ];
    }
    compareByField(a, b, field) {
        if (DATE_FIELD_NAMES.includes(field)) {
            return (0, DateTools_1.compareByDate)(dateValue(a, field), dateValue(b, field));
        }
        switch (field) {
            case 'priority':
                return a.priorityNumber - b.priorityNumber;
            case 'status':
                return a.isDone === b.isDone ? 0 : a.isDone ? 1 : -1;
            case 'description':
                return a.description.localeCompare(b.description);
            case 'path':
                return a.path.localeCompare(b.path);
            default:
                return 0;
        }
    }
    group(tasks, groupByFn) {
        const groups = new Map();
        for (const task of tasks) {
            for (const name of groupByFn(task)) {
                const existing = groups.get(name);
                if (existing) {
                    existing.push(task);
                }
                else {
                    groups.set(name, [task]);
                }
            }
        }
        return Array.from(groups.entries()).map(([name, groupTasks]) => ({ name, tasks: groupTasks }));
    }
    namedGroupKey(task, field) {
        if (DATE_FIELD_NAMES.includes(field)) {
            const value = dateValue(task, field);
            return value ? value.format('YYYY-MM-DD dddd') : `No ${field} date`;
        }
        switch (field) {
            case 'priority':
                return task.priorityName + ' priority';
            case 'status':
                return task.status.name;
            case 'description':
                return task.description;
            case 'path':
                return task.path;
            case 'heading':
                return task.heading ?? '(no heading)';
            case 'folder': {
                const lastSlash = task.path.lastIndexOf('/');
                return lastSlash === -1 ? '(root)' : task.path.slice(0, lastSlash);
            }
            case 'tags':
                return task.tags[0] ?? '(no tags)';
            default:
                return '';
        }
    }
}
exports.TasksQuery = TasksQuery;
//# sourceMappingURL=Query.js.map