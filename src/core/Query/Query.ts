import type { Moment } from 'moment';
import { Task } from '../Task/Task';
import { Priority } from '../Task/Priority';
import { compareByDate } from '../DateTime/DateTools';
import { parseQueryDate } from './DateParsing';
import { createScriptingTaskView } from './ScriptingTaskView';

type DateField = 'due' | 'scheduled' | 'start' | 'done' | 'created' | 'cancelled';
type SortableField = DateField | 'priority' | 'status' | 'description' | 'path';
type NamedGroupField = SortableField | 'heading' | 'folder' | 'tags';
type FilterFn = (task: Task, allTasks: Task[]) => boolean;
/** Returns the group name(s) a task belongs to — more than one for e.g. `group by function`
 * expressions that return an array, so a task can appear in several groups at once. */
type GroupFn = (task: Task) => string[];

const DATE_FIELD_NAMES: DateField[] = ['due', 'scheduled', 'start', 'done', 'created', 'cancelled'];

// Obsidian Tasks uses "starts" (not "start") as the verb form for start-date comparisons
// ("starts on today", "starts before 2024-01-01"), unlike every other date field, which keeps
// its noun form ("due before", "scheduled on", ...). Both forms are accepted here for every
// field, which is more lenient than upstream but never incorrect.
const DATE_FIELD_ALIASES: Record<string, DateField> = {
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

const PRIORITY_NAME_TO_VALUE: Record<string, Priority> = {
    highest: Priority.Highest,
    high: Priority.High,
    medium: Priority.Medium,
    none: Priority.None,
    normal: Priority.None,
    low: Priority.Low,
    lowest: Priority.Lowest,
};

interface SortInstruction {
    field: SortableField;
    reverse: boolean;
}

export interface QueryResult {
    /** The filtered, sorted, and limited tasks, ready to render. */
    tasks: Task[];
    /** Present only when the query has a `group by` instruction. */
    groups: Array<{ name: string; tasks: Task[] }> | null;
    /** Lines in the query source that were not understood. Shown to the user, never thrown. */
    unrecognizedLines: string[];
    /** `zoom factor <N>%` — a percentage a renderer should scale the whole rendered listing by
     * (text, badges/emoji, everything), for a more compact view of a long query result. `100`
     * (normal size) when the query didn't specify one — not a custom extension of Obsidian Tasks'
     * own query language, this port's own addition, since the renderer here (unlike the original
     * plugin, which relies on Obsidian's own vault-wide font-size setting) has no other way to
     * make one specific listing smaller than the rest of the note. */
    zoomFactor: number;
}

function dateValue(task: Task, field: DateField): Moment | null {
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
function splitTopLevel(text: string, operator: 'AND' | 'OR'): string[] {
    const parts: string[] = [];
    const opRegex = new RegExp(`^\\s+${operator}\\s+`, 'i');
    let depth = 0;
    let start = 0;
    let i = 0;
    while (i < text.length) {
        const ch = text[i];
        if (ch === '(') {
            depth++;
        } else if (ch === ')') {
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
function isFullyWrapped(text: string): boolean {
    if (!text.startsWith('(') || !text.endsWith(')')) {
        return false;
    }
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '(') depth++;
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
function compileFilterFunction(expression: string): FilterFn | null {
    let fn: (view: unknown) => unknown;
    try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        fn = new Function('task', `return (${expression});`) as (view: unknown) => unknown;
    } catch {
        return null;
    }
    return (task) => {
        try {
            return !!fn(createScriptingTaskView(task));
        } catch {
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
export class TasksQuery {
    private readonly filters: FilterFn[] = [];
    private readonly sortInstructions: SortInstruction[] = [];
    private groupByFn: GroupFn | null = null;
    private limitCount: number | null = null;
    private zoomFactor: number | null = null;
    public readonly unrecognizedLines: string[] = [];

    /**
     * @param queryFilePath Workspace-relative path (same format as `Task.path`) of the note
     * *containing* this ` ```tasks ``` ` block, if known — expands `{{query.file.path}}` in the
     * query source to it before parsing, mirroring `Scripting/ExpandPlaceholders.ts` in the
     * original plugin. Typically used as `path does not include {{query.file.path}}` to exclude
     * the query's own note from its results. Left `undefined` by a caller that doesn't know (or
     * can't cheaply know) which file the block lives in — the placeholder then survives as
     * literal text, compared like any other string (never matches a real path, so `does not
     * include` silently keeps every result instead of excluding the query's own note — the
     * pre-existing behaviour before this parameter existed).
     */
    constructor(source: string, queryFilePath?: string) {
        const expandedSource =
            queryFilePath !== undefined ? source.replace(/\{\{\s*query\.file\.path\s*\}\}/g, queryFilePath) : source;
        for (const rawLine of expandedSource.split('\n')) {
            const line = rawLine.trim();
            if (line === '' || line.startsWith('#')) {
                continue;
            }
            if (!this.parseLine(line)) {
                this.unrecognizedLines.push(line);
            }
        }
    }

    public apply(allTasks: readonly Task[]): QueryResult {
        let tasks = allTasks.filter((task) => this.filters.every((filter) => filter(task, allTasks as Task[])));

        tasks = this.sort(tasks);

        if (this.limitCount !== null) {
            tasks = tasks.slice(0, this.limitCount);
        }

        return {
            tasks,
            groups: this.groupByFn ? this.group(tasks, this.groupByFn) : null,
            unrecognizedLines: this.unrecognizedLines,
            zoomFactor: this.zoomFactor ?? 100,
        };
    }

    // ---- parsing -----------------------------------------------------------------------

    private parseLine(line: string): boolean {
        if (
            this.parseSortBy(line) ||
            this.parseGroupBy(line) ||
            this.parseLimit(line) ||
            this.parseHideShow(line) ||
            this.parseZoomFactor(line)
        ) {
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
    private parseBooleanExpression(text: string): FilterFn | null {
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
            const compiled = fns as FilterFn[];
            return (task, all) => compiled.some((fn) => fn(task, all));
        }

        const andParts = splitTopLevel(trimmed, 'AND');
        if (andParts.length > 1) {
            const fns = andParts.map((part) => this.parseBooleanExpression(part));
            if (fns.some((fn) => fn === null)) {
                return null;
            }
            const compiled = fns as FilterFn[];
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
    private parseFilterAtom(text: string): FilterFn | null {
        return (
            this.parseStatusFilter(text) ??
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
            this.parseFilterByFunction(text)
        );
    }

    private parseStatusFilter(line: string): FilterFn | null {
        if (/^not done$/i.test(line)) {
            return (task) => !task.isDone;
        }
        if (/^done$/i.test(line)) {
            return (task) => task.isDone;
        }
        return null;
    }

    /** `status.type is <TYPE>` / `status.type is not <TYPE>`, e.g. `status.type is IN_PROGRESS`. */
    private parseStatusTypeFilter(line: string): FilterFn | null {
        const match = line.match(/^status\.type is (not )?(\w+)$/i);
        if (!match) {
            return null;
        }
        const negate = match[1] !== undefined;
        const type = match[2].toUpperCase();
        return (task) => (task.status.type === type) !== negate;
    }

    private parseDateFilter(line: string): FilterFn | null {
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
            const target = parseQueryDate(comparisonMatch[3]);
            if (target === null) {
                return null;
            }
            return (task) => {
                const value = dateValue(task, field);
                if (value === null || !value.isValid()) {
                    return false;
                }
                if (comparison === 'before') return value.isBefore(target, 'day');
                if (comparison === 'after') return value.isAfter(target, 'day');
                return value.isSame(target, 'day');
            };
        }

        return null;
    }

    /** `happens before/after/on <date>`, `has happens date`, `no happens date` — a pseudo date
     * field matching if ANY of due/scheduled/start satisfies the condition, mirroring upstream's
     * `HappensDateField` (used for e.g. `(happens before tomorrow) OR (no due date)`-style
     * queries where "happens" stands in for whichever date the task is best known by). */
    private parseHappensFilter(line: string): FilterFn | null {
        if (/^has happens date$/i.test(line)) {
            return (task) => task.happensDates.some((date) => date !== null);
        }
        if (/^no happens date$/i.test(line)) {
            return (task) => !task.happensDates.some((date) => date !== null);
        }

        const comparisonMatch = line.match(/^happens (before|after|on)\s+(.+)$/i);
        if (comparisonMatch) {
            const comparison = comparisonMatch[1].toLowerCase();
            const target = parseQueryDate(comparisonMatch[2]);
            if (target === null) {
                return null;
            }
            return (task) =>
                task.happensDates.some((value) => {
                    if (value === null || !value.isValid()) {
                        return false;
                    }
                    if (comparison === 'before') return value.isBefore(target, 'day');
                    if (comparison === 'after') return value.isAfter(target, 'day');
                    return value.isSame(target, 'day');
                });
        }

        return null;
    }

    /** `has depends on` / `no depends on` — whether the task lists any other task ids it depends on. */
    private parseDependsOnFilter(line: string): FilterFn | null {
        if (/^has depends on$/i.test(line)) {
            return (task) => task.dependsOn.length > 0;
        }
        if (/^no depends on$/i.test(line)) {
            return (task) => task.dependsOn.length === 0;
        }
        return null;
    }

    /** `has id` / `no id` — whether the task has been given an `🆔` value. */
    private parseIdFilter(line: string): FilterFn | null {
        if (/^has id$/i.test(line)) {
            return (task) => task.id.length > 0;
        }
        if (/^no id$/i.test(line)) {
            return (task) => task.id.length === 0;
        }
        return null;
    }

    private parsePriorityFilter(line: string): FilterFn | null {
        const match = line.match(/^priority is (above |below )?(highest|high|medium|none|normal|low|lowest)$/i);
        if (!match) {
            return null;
        }
        const comparison = match[1]?.trim().toLowerCase();
        const target = PRIORITY_NAME_TO_VALUE[match[2].toLowerCase()];
        return (task) => {
            // Priority values are strings '0'..'5', ordered from Highest to Lowest.
            if (comparison === 'above') return task.priority < target;
            if (comparison === 'below') return task.priority > target;
            return task.priority === target;
        };
    }

    private parsePathFilter(line: string): FilterFn | null {
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

    private parseDescriptionFilter(line: string): FilterFn | null {
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
    private parseDescriptionRegexFilter(line: string): FilterFn | null {
        const match = line.match(/^description regex matches \/(.+)\/([a-z]*)$/i);
        if (!match) {
            return null;
        }
        let regex: RegExp;
        try {
            regex = new RegExp(match[1], match[2]);
        } catch {
            return null;
        }
        return (task) => {
            regex.lastIndex = 0; // in case the /g flag was used, don't let matches skip around
            return regex.test(task.description);
        };
    }

    private parseTagFilter(line: string): FilterFn | null {
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

    private parseHeadingFilter(line: string): FilterFn | null {
        const match = line.match(/^heading includes (.+)$/i);
        if (!match) {
            return null;
        }
        const needle = match[1].toLowerCase();
        return (task) => (task.heading ?? '').toLowerCase().includes(needle);
    }

    private parseRecurringFilter(line: string): FilterFn | null {
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
    private parseFilterByFunction(line: string): FilterFn | null {
        const match = line.match(/^filter by function (.+)$/i);
        if (!match) {
            return null;
        }
        return compileFilterFunction(match[1]);
    }

    /** Accepts either one field per `sort by` line (multiple lines apply in order, as tie-break
     * criteria — the original multi-line form) or a comma-separated list on a single line
     * (`sort by priority, due`), applied in the same left-to-right tie-break order. Any invalid
     * segment fails the whole line (same as before — falls through to "unrecognized line" rather
     * than silently applying a partial sort). */
    private parseSortBy(line: string): boolean {
        const prefixMatch = line.match(/^sort by (.+)$/i);
        if (!prefixMatch) {
            return false;
        }
        const segments = prefixMatch[1].split(',').map((segment) => segment.trim());
        const instructions: SortInstruction[] = [];
        for (const segment of segments) {
            const match = segment.match(/^(\w+)(?: date)?( reverse)?$/i);
            if (!match) {
                return false;
            }
            const field = this.toSortableField(match[1]);
            if (field === null) {
                return false;
            }
            instructions.push({ field, reverse: match[2] !== undefined });
        }
        this.sortInstructions.push(...instructions);
        return true;
    }

    private parseGroupBy(line: string): boolean {
        const functionMatch = line.match(/^group by function (.+)$/i);
        if (functionMatch) {
            let fn: (view: unknown) => unknown;
            try {
                // eslint-disable-next-line @typescript-eslint/no-implied-eval
                fn = new Function('task', `return (${functionMatch[1]});`) as (view: unknown) => unknown;
            } catch {
                return false;
            }
            this.groupByFn = (task) => {
                try {
                    const result = fn(createScriptingTaskView(task));
                    // A function returning an array (e.g. task.tags.map(...)) puts the task in
                    // every named group at once, matching Obsidian Tasks' multi-group behaviour.
                    const names = Array.isArray(result) ? result : [result];
                    return names.map((n) => String(n));
                } catch {
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
        const field: NamedGroupField | null =
            keyword === 'heading' || keyword === 'folder' || keyword === 'tags'
                ? (keyword as NamedGroupField)
                : this.toSortableField(keyword);
        if (field === null) {
            return false;
        }
        this.groupByFn = (task) => [this.namedGroupKey(task, field)];
        return true;
    }

    private parseLimit(line: string): boolean {
        const match = line.match(/^limit(?: to)? (\d+)(?: tasks)?$/i);
        if (!match) {
            return false;
        }
        this.limitCount = Number.parseInt(match[1], 10);
        return true;
    }

    /** `zoom factor <N>%` — not part of upstream Obsidian Tasks' query language, this port's own
     * addition (see {@link QueryResult.zoomFactor}). `0` or negative would make the listing
     * invisible/inverted, so it's rejected as unrecognised rather than silently accepted — same
     * treatment `parseLimit` gives a nonsensical value indirectly via its `\d+` requirement. */
    private parseZoomFactor(line: string): boolean {
        const match = line.match(/^zoom factor (\d+(?:\.\d+)?)\s*%$/i);
        if (!match) {
            return false;
        }
        const value = Number.parseFloat(match[1]);
        if (!(value > 0)) {
            return false;
        }
        this.zoomFactor = value;
        return true;
    }

    /** `hide <field>` / `show <field>`, e.g. `hide id`. Recognised-but-no-op: this port's
     * renderer (markdownTasksPlugin.ts) always shows the same fixed set of badges and doesn't
     * yet have per-field layout toggles, so there's nothing to actually hide. Still validated
     * against upstream's known option names ({@link HIDE_SHOW_OPTION_KEYWORDS}) so the line is
     * accepted rather than reported as unrecognised, and a genuine typo is still caught. */
    private parseHideShow(line: string): boolean {
        const match = line.match(/^(?:hide|show) +(.+)$/i);
        if (!match) {
            return false;
        }
        const option = match[1].toLowerCase();
        return HIDE_SHOW_OPTION_KEYWORDS.some((keyword) => option.startsWith(keyword));
    }

    private toSortableField(keyword: string): SortableField | null {
        const lower = keyword.toLowerCase();
        if ((DATE_FIELD_NAMES as string[]).includes(lower)) {
            return lower as SortableField;
        }
        if (lower === 'priority' || lower === 'status' || lower === 'description' || lower === 'path') {
            return lower;
        }
        return null;
    }

    // ---- sort / group --------------------------------------------------------------------

    private sort(tasks: Task[]): Task[] {
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
    private defaultSortInstructions(): SortInstruction[] {
        return [
            { field: 'status', reverse: false },
            { field: 'due', reverse: false },
            { field: 'priority', reverse: false },
            { field: 'path', reverse: false },
        ];
    }

    private compareByField(a: Task, b: Task, field: SortableField): number {
        if ((DATE_FIELD_NAMES as string[]).includes(field)) {
            return compareByDate(dateValue(a, field as DateField), dateValue(b, field as DateField));
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

    private group(tasks: Task[], groupByFn: GroupFn): Array<{ name: string; tasks: Task[] }> {
        const groups = new Map<string, Task[]>();

        for (const task of tasks) {
            for (const name of groupByFn(task)) {
                const existing = groups.get(name);
                if (existing) {
                    existing.push(task);
                } else {
                    groups.set(name, [task]);
                }
            }
        }

        return Array.from(groups.entries()).map(([name, groupTasks]) => ({ name, tasks: groupTasks }));
    }

    private namedGroupKey(task: Task, field: NamedGroupField): string {
        if ((DATE_FIELD_NAMES as string[]).includes(field)) {
            const value = dateValue(task, field as DateField);
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
