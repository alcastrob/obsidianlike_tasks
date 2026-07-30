import * as vscode from 'vscode';
import type { Moment } from 'moment';
import { Priority, priorityNameUsingNormal } from './core/Task/Priority';
import { parseQueryDate } from './core/Query/DateParsing';
import { Recurrence } from './core/Task/Recurrence';
import { Occurrence } from './core/Task/Occurrence';
import { Task } from './core/Task/Task';
import { TaskLocation } from './core/Task/TaskLocation';
import { TaskRegularExpressions } from './core/Task/TaskRegularExpressions';
import { OnCompletion } from './core/Task/OnCompletion';
import { Status } from './core/Statuses/Status';
import { StatusRegistry } from './core/Statuses/StatusRegistry';
import { dependencyKey, searchDependencyCandidates, type DependencyCandidate } from './DependencySearch';

export interface TaskFormSeed {
    description: string;
    priority: Priority;
    recurrenceRuleText: string;
    dueDateText: string;
    scheduledDateText: string;
    startDateText: string;
    statusSymbol: string;
    createdDateText: string;
    doneDateText: string;
    cancelledDateText: string;
}

export interface TaskFormResult {
    description: string;
    priority: Priority;
    recurrence: Recurrence | null;
    dueDate: Moment | null;
    scheduledDate: Moment | null;
    startDate: Moment | null;
    status: Status;
    createdDate: Moment | null;
    doneDate: Moment | null;
    cancelledDate: Moment | null;
    /** Tasks this one depends on ("Before this"). */
    blockedBy: Task[];
    /** Tasks that depend on this one ("After this"). */
    blocking: Task[];
}

/**
 * Everything the dialog needs beyond the plain form-field seed: the task being edited (or `null`
 * when creating one) and a snapshot of every task in the workspace, used to seed/search the
 * Before this/After this fields and to preview how a Status change would affect the Done/Cancelled
 * dates — all of which need real `Task`/`Status` objects, not just primitive form values.
 */
export interface TaskFormContext {
    existingTask: Task | null;
    allTasks: Task[];
    taskLocation: TaskLocation;
}

/** A note the description field's `[[wikilink]]` suggester can offer — mirrors the
 * `{ name, dir }` shape Obsidian-like's own `noteIndex` uses, for a consistent suggestion list
 * regardless of which editor the task happens to be edited from. */
interface NoteIndexEntry {
    name: string;
    dir: string;
}

/** Same glob/exclude pair `TaskIndex.ts` uses to scan the workspace for markdown files — kept
 * separate (not imported from there) since `TaskIndex` is purpose-built for parsing *tasks* out
 * of files, not listing note names, and re-scanning here is simpler than adding an unrelated
 * "list every note" API to that class for a single caller. */
async function findAllNoteNames(): Promise<NoteIndexEntry[]> {
    const uris = await vscode.workspace.findFiles('**/*.md', '**/{node_modules,.git,out}/**');
    return uris.map((uri) => {
        const relPath = vscode.workspace.asRelativePath(uri, false).replace(/\\/g, '/');
        const slash = relPath.lastIndexOf('/');
        const filename = slash === -1 ? relPath : relPath.slice(slash + 1);
        const dir = slash === -1 ? '' : relPath.slice(0, slash);
        return { name: filename.replace(/\.md$/i, ''), dir };
    });
}

/** ATX headings only (# .. ######), skipping fenced code blocks so a "#" inside a code sample
 * isn't mistaken for a heading — mirrors `obsidianlike`'s own `parseHeadings` (extension.ts),
 * minus the line number (the wikilink suggester below only ever needs the text to match/insert,
 * not a scroll target). */
function parseHeadings(text: string): Array<{ level: number; text: string }> {
    const lines = text.split(/\r\n|\n/);
    const headings: Array<{ level: number; text: string }> = [];
    let inFence = false;
    for (const line of lines) {
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence;
            continue;
        }
        if (inFence) {
            continue;
        }
        const m = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
        if (m) {
            headings.push({ level: m[1].length, text: m[2].trim() });
        }
    }
    return headings;
}

/** Escapes glob metacharacters (`[`, `]`, `{`, `}`) so a literal note name containing them is
 * matched as plain text rather than parsed as a glob character class/brace expansion. */
function escapeGlob(name: string): string {
    return name.replace(/[[\]{}]/g, '\\$&');
}

/** Resolves `notePart` (whatever the user typed before "#" in `[[notePart#...`, which may itself
 * carry a `carpeta/Nota` directory hint) to the headings of the note it names, for the
 * description field's wikilink suggester below. Vault-wide search first — same reasoning as
 * `obsidianlike`'s own `resolveNoteUri` — with the directory hint (if any) only used to break a
 * tie among several same-named notes, never to narrow the search. Empty array (not an error) if
 * nothing matches or the file can't be read, so the suggester just shows no heading matches
 * instead of failing. */
async function findHeadingsForNote(notePart: string): Promise<Array<{ level: number; text: string }>> {
    const normalized = notePart.replace(/\\/g, '/');
    const segments = normalized.split('/').filter(Boolean);
    const noteName = segments.pop() || normalized;
    const dirHint = segments.length > 0 ? segments[segments.length - 1] : null;
    if (!noteName) {
        return [];
    }

    const found = await vscode.workspace.findFiles(`**/${escapeGlob(noteName)}.md`, '**/{node_modules,.git,out}/**');
    if (found.length === 0) {
        return [];
    }
    let uri = found[0];
    if (found.length > 1 && dirHint) {
        const parentDirName = (u: vscode.Uri): string => {
            const parts = vscode.workspace.asRelativePath(u, false).replace(/\\/g, '/').split('/');
            parts.pop(); // filename
            return parts.pop() || ''; // immediate parent directory, '' if the note is at the vault root
        };
        const match = found.find((u) => parentDirName(u).toLowerCase() === dirHint.toLowerCase());
        if (match) {
            uri = match;
        }
    }

    try {
        const document = await vscode.workspace.openTextDocument(uri);
        return parseHeadings(document.getText());
    } catch {
        return [];
    }
}

const PRIORITY_GRID: Array<{ priority: Priority; label: string; icon: string }> = [
    { priority: Priority.Lowest, label: 'Lowest', icon: '⏬' },
    { priority: Priority.Low, label: 'Low', icon: '🔽' },
    { priority: Priority.None, label: 'Normal', icon: '' },
    { priority: Priority.Medium, label: 'Medium', icon: '🔼' },
    { priority: Priority.High, label: 'High', icon: '⏫' },
    { priority: Priority.Highest, label: 'Highest', icon: '🔺' },
];

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Safe to embed inside a `<script>` tag: JSON.stringify already escapes quotes/backslashes, but
 * a literal `</script>` inside user text (e.g. a task description) would still prematurely close
 * the tag, so `<` is additionally escaped as a unicode sequence. */
function toEmbeddableJson(value: unknown): string {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}

function nonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < 32; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
}

/** Parses a date field's free-text value with the same rules as the rest of this port (relative
 * dates via chrono-node, absolute `YYYY-MM-DD`). Empty input means "no date", which is valid. */
function parseOptionalDate(text: string): { ok: true; date: Moment | null } | { ok: false } {
    if (text.trim() === '') {
        return { ok: true, date: null };
    }
    const date = parseQueryDate(text);
    return date === null ? { ok: false } : { ok: true, date };
}

/**
 * Builds a placeholder `Task` to compute Status-change date previews against when creating a
 * brand-new task (no `existingTask` yet) — same baseline Obsidian Tasks' modal uses (a fresh task
 * with the default TODO status and no Done/Cancelled dates).
 */
function defaultBaselineTask(taskLocation: TaskLocation): Task {
    return new Task({
        status: Status.TODO,
        description: '',
        taskLocation,
        indentation: '',
        listMarker: '-',
        priority: Priority.None,
        recurrence: null,
        onCompletion: OnCompletion.Ignore,
        dependsOn: [],
        id: '',
        blockLink: '',
        tags: [],
        originalMarkdown: '',
        scheduledDateIsInferred: false,
    });
}

/**
 * If the user has manually typed something into the Done/Cancelled date field, leave it alone;
 * otherwise set/clear it to follow the newly selected status, mirroring Obsidian Tasks'
 * `StatusEditor.svelte`'s `setStatusRelatedDate`.
 */
function setStatusRelatedDate(currentText: string, isInStatus: boolean, editedDate: Moment | null): string {
    const dateFieldIsEmpty = currentText.trim() === '';

    if (isInStatus && dateFieldIsEmpty) {
        return editedDate ? editedDate.format(TaskRegularExpressions.dateFormat) : '';
    }
    if (!isInStatus && !dateFieldIsEmpty) {
        return '';
    }
    return currentText;
}

/** Keyed by `path#line`, tracks which task locations currently have a dialog open (or in the
 * middle of opening) — see the guard at the top of {@link showTaskEditDialog}. */
const openDialogLocations = new Set<string>();
/** Companion to {@link openDialogLocations}: the actual panel, once created, so a duplicate
 * invocation that arrives after the panel exists can be revealed instead of silently dropped. */
const openDialogPanels = new Map<string, vscode.WebviewPanel>();

/**
 * Shows a single-screen dialog for creating/editing a task, laid out to resemble Obsidian Tasks'
 * own "Create or edit Task" modal: description, priority grid, recurrence with live preview,
 * due/scheduled/start dates, Before this/After this dependency search, Status, and
 * Created/Done/Cancelled dates. VS Code has no API for a true floating modal dialog with custom
 * HTML; this opens as a `WebviewPanel` (an editor tab) whose content is styled as a centred card
 * over a dimmed backdrop to approximate one.
 *
 * Resolves with the already-validated/parsed field values once the user clicks Apply, or
 * `undefined` if they cancel or close the tab. Validation (dates, recurrence) happens here, in
 * the extension host — the webview has no access to `chrono-node`/`rrule` — and is re-run live as
 * the user types the recurrence field, and again on Apply for every field before resolving. The
 * Before this/After this search and the Status-change date preview also run here, against
 * `context.allTasks`, for the same reason (the webview has no access to the task index).
 */
export async function showTaskEditDialog(
    seed: TaskFormSeed,
    isEditing: boolean,
    context: TaskFormContext,
): Promise<TaskFormResult | undefined> {
    // Guards against the "Edit" action firing twice in a row for the same task — a double click
    // on the CodeLens, or a keyboard shortcut pressed again before the first dialog has finished
    // opening — which used to spawn two independent WebviewPanels for the same line. Checked and
    // reserved synchronously, before the first `await` below, so two calls landing in the same
    // tick can't both see the location as free: JS runs each call's synchronous prefix to
    // completion before yielding to the event loop, so the second call always observes the first
    // call's reservation.
    const locationKey = `${context.taskLocation.path}#${context.taskLocation.lineNumber}`;
    if (openDialogLocations.has(locationKey)) {
        openDialogPanels.get(locationKey)?.reveal(undefined, false);
        return undefined;
    }
    openDialogLocations.add(locationKey);

    try {
        return await showTaskEditDialogUnguarded(seed, isEditing, context, locationKey);
    } finally {
        openDialogLocations.delete(locationKey);
        openDialogPanels.delete(locationKey);
    }
}

async function showTaskEditDialogUnguarded(
    seed: TaskFormSeed,
    isEditing: boolean,
    context: TaskFormContext,
    locationKey: string,
): Promise<TaskFormResult | undefined> {
    // Awaited before the panel/HTML is built so the `[[wikilink]]` suggester in the description
    // field has its candidate list from the very first paint, matching how `context.allTasks` is
    // already available upfront rather than fetched lazily — one findFiles() scan per dialog-open
    // is cheap enough (VS Code serves it from its own file-watcher index, not a fresh disk walk)
    // to not need caching across calls the way TaskIndex caches parsed tasks.
    const noteIndex = await findAllNoteNames();

    return new Promise((resolve) => {
        // `ViewColumn.Active` used to be here, but that replaces the active tab in place — the
        // document being edited disappears behind the dialog instead of staying visible, since a
        // column only ever shows one of its tabs at a time. `ViewColumn.Beside` opens a split
        // column next to it instead, so the source document stays visible while the dialog is open
        // (as close as `WebviewPanel` gets to Obsidian's floating modal — VS Code has no API for an
        // actual overlay, see the "TaskEditWebview.ts" section in CLAUDE.md).
        const panel = vscode.window.createWebviewPanel(
            'obsidianLikeTasksEditTask',
            isEditing ? 'Edit Task' : 'Create Task',
            { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false },
            // `retainContextWhenHidden: true` — without it, switching to another tab (the dialog
            // opens Beside the document being edited, so this is a one-click away) tears down the
            // webview's DOM/JS entirely; VS Code doesn't re-render `panel.webview.html` when the tab
            // is shown again (it's still the same string, set once at creation), so nothing restores
            // whatever the user had typed since — reported as the whole dialog's content getting
            // silently lost. `false` costs a bit of memory for exactly as long as the dialog stays
            // open (a single short-lived panel, not something left running for a whole session).
            { enableScripts: true, retainContextWhenHidden: true },
        );
        openDialogPanels.set(locationKey, panel);

        const baselineTask = context.existingTask ?? defaultBaselineTask(context.taskLocation);
        const byKey = new Map(context.allTasks.map((task) => [dependencyKey(task), task]));

        let settled = false;
        const settle = (result: TaskFormResult | undefined) => {
            if (settled) {
                return;
            }
            settled = true;
            resolve(result);
            panel.dispose();
        };

        panel.webview.html = renderHtml(panel.webview, seed, isEditing, context, noteIndex);

        panel.webview.onDidReceiveMessage((message: any) => {
            switch (message?.type) {
                case 'cancel':
                    settle(undefined);
                    return;

                case 'previewRecurrence': {
                    const { recurrenceRuleText, dueDateText, scheduledDateText, startDateText } = message;
                    const due = parseOptionalDate(dueDateText);
                    const scheduled = parseOptionalDate(scheduledDateText);
                    const start = parseOptionalDate(startDateText);
                    let preview = 'not recurring';
                    if (recurrenceRuleText.trim() !== '') {
                        if (!due.ok || !scheduled.ok || !start.ok) {
                            preview = 'fix the date fields to preview recurrence';
                        } else {
                            const recurrence = Recurrence.fromText({
                                recurrenceRuleText,
                                occurrence: new Occurrence({
                                    dueDate: due.date,
                                    scheduledDate: scheduled.date,
                                    startDate: start.date,
                                }),
                            });
                            preview = recurrence ? recurrence.toText() : 'could not understand this rule';
                        }
                    }
                    void panel.webview.postMessage({ type: 'recurrencePreview', preview });
                    return;
                }

                case 'statusChanged': {
                    const { statusSymbol, doneDateText, cancelledDateText } = message;
                    const newStatus = StatusRegistry.getInstance().bySymbolOrCreate(statusSymbol);
                    const transitioned = baselineTask.handleNewStatus(newStatus).pop()!;
                    void panel.webview.postMessage({
                        type: 'statusDatesUpdated',
                        doneDateText: setStatusRelatedDate(doneDateText, newStatus.isCompleted(), transitioned.doneDate),
                        cancelledDateText: setStatusRelatedDate(
                            cancelledDateText,
                            newStatus.isCancelled(),
                            transitioned.cancelledDate,
                        ),
                    });
                    return;
                }

                case 'resolveDate': {
                    // Mirrors the native `<input type="date">` picker to whatever the free-text
                    // date field currently parses to (e.g. "today" -> the actual YYYY-MM-DD),
                    // since only this extension host can run chrono-node. An unparseable value
                    // clears the picker rather than erroring — the red error banner only appears
                    // on Apply, this is just a live preview.
                    const { field, text } = message;
                    const parsed = parseOptionalDate(text);
                    const dateText = parsed.ok && parsed.date ? parsed.date.format(TaskRegularExpressions.dateFormat) : '';
                    void panel.webview.postMessage({ type: 'dateResolved', field, dateText });
                    return;
                }

                case 'searchDependency': {
                    const { field, query, excludeKeys } = message;
                    const results = searchDependencyCandidates(
                        query ?? '',
                        context.allTasks,
                        { path: context.taskLocation.path, line: context.taskLocation.lineNumber },
                        new Set<string>(excludeKeys ?? []),
                    );
                    void panel.webview.postMessage({ type: 'dependencyResults', field, results });
                    return;
                }

                // Powers the description field's `[[Note#Heading` suggester (below): once the user
                // types a "#" after a note name, the popup switches from listing notes to listing
                // that note's own headings, which requires reading its file — the webview has no
                // filesystem access of its own.
                case 'get-headings': {
                    const { id, note } = message;
                    void findHeadingsForNote(note ?? '').then((headings) => {
                        void panel.webview.postMessage({ type: 'headings-result', id, headings });
                    });
                    return;
                }

                case 'apply': {
                    const {
                        description,
                        priority,
                        recurrenceRuleText,
                        dueDateText,
                        scheduledDateText,
                        startDateText,
                        statusSymbol,
                        createdDateText,
                        doneDateText,
                        cancelledDateText,
                        blockedByKeys,
                        blockingKeys,
                    } = message;

                    if (typeof description !== 'string' || description.trim() === '') {
                        void panel.webview.postMessage({ type: 'error', error: 'Description cannot be empty.' });
                        return;
                    }

                    const due = parseOptionalDate(dueDateText);
                    if (!due.ok) {
                        void panel.webview.postMessage({ type: 'error', error: 'Could not understand the due date.' });
                        return;
                    }
                    const scheduled = parseOptionalDate(scheduledDateText);
                    if (!scheduled.ok) {
                        void panel.webview.postMessage({ type: 'error', error: 'Could not understand the scheduled date.' });
                        return;
                    }
                    const start = parseOptionalDate(startDateText);
                    if (!start.ok) {
                        void panel.webview.postMessage({ type: 'error', error: 'Could not understand the start date.' });
                        return;
                    }
                    const created = parseOptionalDate(createdDateText);
                    if (!created.ok) {
                        void panel.webview.postMessage({ type: 'error', error: 'Could not understand the created date.' });
                        return;
                    }
                    const done = parseOptionalDate(doneDateText);
                    if (!done.ok) {
                        void panel.webview.postMessage({ type: 'error', error: 'Could not understand the done date.' });
                        return;
                    }
                    const cancelled = parseOptionalDate(cancelledDateText);
                    if (!cancelled.ok) {
                        void panel.webview.postMessage({ type: 'error', error: 'Could not understand the cancelled date.' });
                        return;
                    }

                    let recurrence: Recurrence | null = null;
                    if (typeof recurrenceRuleText === 'string' && recurrenceRuleText.trim() !== '') {
                        recurrence = Recurrence.fromText({
                            recurrenceRuleText,
                            occurrence: new Occurrence({
                                dueDate: due.date,
                                scheduledDate: scheduled.date,
                                startDate: start.date,
                            }),
                        });
                        if (recurrence === null) {
                            void panel.webview.postMessage({ type: 'error', error: 'Could not understand that recurrence rule.' });
                            return;
                        }
                    }

                    const priorityValue = Object.values(Priority).includes(priority) ? (priority as Priority) : Priority.None;
                    const status = StatusRegistry.getInstance().bySymbolOrCreate(statusSymbol);

                    const resolveKeys = (keys: unknown): Task[] =>
                        Array.isArray(keys)
                            ? (keys.map((key) => byKey.get(key)).filter((task): task is Task => task !== undefined))
                            : [];

                    settle({
                        description,
                        priority: priorityValue,
                        recurrence,
                        dueDate: due.date,
                        scheduledDate: scheduled.date,
                        startDate: start.date,
                        status,
                        createdDate: created.date,
                        doneDate: done.date,
                        cancelledDate: cancelled.date,
                        blockedBy: resolveKeys(blockedByKeys),
                        blocking: resolveKeys(blockingKeys),
                    });
                    return;
                }
            }
        });

        panel.onDidDispose(() => settle(undefined));
    });
}

function renderHtml(
    webview: vscode.Webview,
    seed: TaskFormSeed,
    isEditing: boolean,
    context: TaskFormContext,
    noteIndex: NoteIndexEntry[],
): string {
    const cspNonce = nonce();

    const statusOptions = StatusRegistry.getInstance().registeredStatuses;

    const initialBlockedBy: DependencyCandidate[] = context.existingTask
        ? context.existingTask.dependsOn
              .map((id) => context.allTasks.find((task) => task.id === id))
              .filter((task): task is Task => task !== undefined)
              .map((task) => ({
                  key: dependencyKey(task),
                  description: task.description,
                  path: task.path,
                  statusSymbol: task.status.symbol,
              }))
        : [];
    const initialBlocking: DependencyCandidate[] =
        context.existingTask && context.existingTask.id !== ''
            ? context.allTasks
                  .filter((task) => task.dependsOn.includes(context.existingTask!.id))
                  .map((task) => ({
                      key: dependencyKey(task),
                      description: task.description,
                      path: task.path,
                      statusSymbol: task.status.symbol,
                  }))
            : [];
    const hasVaultTasks = context.allTasks.length > 0;

    const initialData = toEmbeddableJson({
        seed,
        initialBlockedBy,
        initialBlocking,
        hasVaultTasks,
        noteIndex,
    });

    const priorityRadios = PRIORITY_GRID.map(
        ({ priority, label, icon }) => `
        <label class="priority-option">
            <input type="radio" name="priority" value="${priority}" ${priority === seed.priority ? 'checked' : ''} />
            <span class="priority-label">${icon ? `${icon} ` : ''}${label}</span>
        </label>`,
    ).join('');

    const statusOptionsHtml = statusOptions
        .map(
            (status) =>
                `<option value="${escapeHtml(status.symbol)}" ${status.symbol === seed.statusSymbol ? 'selected' : ''}>${escapeHtml(status.name)} [${escapeHtml(status.symbol)}]</option>`,
        )
        .join('');

    const dependencyFieldsHtml = hasVaultTasks
        ? `
    <div class="dependency-field">
        <label class="field-label" for="before_this">Before this</label>
        <div class="dependency-pills" id="before_this-pills"></div>
        <input type="text" id="before_this" placeholder="Search for tasks that this task depends on..." autocomplete="off" />
        <ul class="dependency-dropdown" id="before_this-dropdown" hidden></ul>
    </div>
    <div class="dependency-field">
        <label class="field-label" for="after_this">After this</label>
        <div class="dependency-pills" id="after_this-pills"></div>
        <input type="text" id="after_this" placeholder="Search for tasks that depend on this task being done..." autocomplete="off" />
        <ul class="dependency-dropdown" id="after_this-dropdown" hidden></ul>
    </div>`
        : `<div class="dependency-disabled-note"><i>Blocking and blocked by fields are disabled when the vault has no other tasks</i></div>`;

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${cspNonce}';" />
<title>${isEditing ? 'Edit Task' : 'Create Task'}</title>
<style>
    :root { color-scheme: light dark; }
    body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
        padding: 24px;
        display: flex;
        justify-content: center;
    }
    .card {
        width: 100%;
        max-width: 640px;
        background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
        border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
        border-radius: 10px;
        padding: 28px 32px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    }
    .field { margin-bottom: 18px; }
    .field > label.field-label { display: block; font-size: 0.95em; margin-bottom: 6px; opacity: 0.85; }
    textarea, input[type='text'], select {
        width: 100%;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 1em;
        padding: 6px 8px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border, var(--vscode-widget-border));
        border-radius: 4px;
    }
    textarea { min-height: 60px; resize: vertical; }
    .priority-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        row-gap: 8px;
        column-gap: 12px;
    }
    .priority-option { display: flex; align-items: center; gap: 6px; cursor: pointer; }
    .priority-option input { accent-color: var(--vscode-button-background); }
    hr { border: none; border-top: 1px solid var(--vscode-widget-border, var(--vscode-panel-border)); margin: 20px 0; }
    .date-row, .recurrence-row {
        display: grid;
        grid-template-columns: 120px 1fr 28px 150px;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
    }
    .date-row label.field-label, .recurrence-row label.field-label { margin: 0; }
    .row-icon { text-align: center; font-size: 1.1em; }
    .recurrence-preview {
        grid-column: 1 / -1;
        font-style: italic;
        opacity: 0.75;
        margin-top: -6px;
        margin-bottom: 8px;
    }
    .status-row {
        display: grid;
        grid-template-columns: 120px 1fr;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
    }
    .status-row label.field-label { margin: 0; }
    .dependency-field { position: relative; margin-bottom: 16px; }
    .dependency-disabled-note { margin-bottom: 16px; opacity: 0.75; }
    .dependency-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
    .dependency-pills:empty { margin-bottom: 0; }
    .dependency-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        border-radius: 12px;
        padding: 2px 6px 2px 10px;
        font-size: 0.9em;
        max-width: 100%;
    }
    .dependency-pill-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dependency-pill-remove {
        border: none;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 1em;
        line-height: 1;
        padding: 2px 4px;
        opacity: 0.8;
    }
    .dependency-pill-remove:hover { opacity: 1; }
    .dependency-dropdown {
        list-style: none;
        margin: 4px 0 0;
        padding: 4px;
        max-height: 200px;
        overflow-y: auto;
        background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
        border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
        border-radius: 4px;
        position: absolute;
        left: 0;
        right: 0;
        z-index: 10;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .dependency-dropdown li {
        padding: 6px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 0.92em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .dependency-dropdown li.selected, .dependency-dropdown li:hover {
        background: var(--vscode-list-hoverBackground);
    }
    .dependency-dropdown li .dep-path { opacity: 0.65; margin-left: 6px; font-size: 0.9em; }
    .description-field { position: relative; }
    .wikilink-dropdown {
        list-style: none;
        margin: 0;
        padding: 4px;
        max-height: 200px;
        overflow-y: auto;
        background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
        border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
        border-radius: 4px;
        position: absolute;
        min-width: 220px;
        max-width: 380px;
        z-index: 20;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .wikilink-dropdown li {
        padding: 6px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 0.92em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .wikilink-dropdown li.selected, .wikilink-dropdown li:hover {
        background: var(--vscode-list-hoverBackground);
    }
    .wikilink-dropdown li .wikilink-dir { opacity: 0.65; margin-left: 6px; font-size: 0.9em; }
    .actions { display: flex; gap: 10px; margin-top: 24px; }
    button {
        flex: 1;
        padding: 10px 16px;
        border-radius: 4px;
        border: none;
        font-size: 1em;
        cursor: pointer;
    }
    #apply { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    #apply:hover { background: var(--vscode-button-hoverBackground); }
    #cancel { background: var(--vscode-button-secondaryBackground, transparent); color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border)); }
    #cancel:hover { background: var(--vscode-button-secondaryHoverBackground, var(--vscode-toolbar-hoverBackground)); }
    .error-banner {
        display: none;
        background: var(--vscode-inputValidation-errorBackground);
        border: 1px solid var(--vscode-inputValidation-errorBorder);
        color: var(--vscode-inputValidation-errorForeground, var(--vscode-foreground));
        padding: 8px 12px;
        border-radius: 4px;
        margin-bottom: 16px;
    }
</style>
</head>
<body>
<div class="card">
    <div id="error" class="error-banner"></div>

    <div class="field">
        <label class="field-label" for="description">Description</label>
        <div class="description-field">
            <textarea id="description">${escapeHtml(seed.description)}</textarea>
            <ul class="wikilink-dropdown" id="description-wikilink-dropdown" hidden></ul>
        </div>
    </div>

    <div class="field">
        <label class="field-label">Priority</label>
        <div class="priority-grid">${priorityRadios}</div>
    </div>

    <hr />

    <div class="recurrence-row">
        <label class="field-label" for="recurrence">Recurs</label>
        <input type="text" id="recurrence" placeholder="Try 'every day when done'" value="${escapeHtml(seed.recurrenceRuleText)}" />
        <span class="row-icon">🔁</span>
        <span id="recurrence-preview" class="recurrence-preview">not recurring</span>
    </div>

    <div class="date-row">
        <label class="field-label" for="due">Due</label>
        <input type="text" id="due" placeholder="e.g. 2024-01-31, today, next monday" value="${escapeHtml(seed.dueDateText)}" />
        <span class="row-icon">📅</span>
        <input type="date" id="due-picker" />
    </div>

    <div class="date-row">
        <label class="field-label" for="scheduled">Scheduled</label>
        <input type="text" id="scheduled" placeholder="e.g. 2024-01-31, today, next monday" value="${escapeHtml(seed.scheduledDateText)}" />
        <span class="row-icon">⏳</span>
        <input type="date" id="scheduled-picker" />
    </div>

    <div class="date-row">
        <label class="field-label" for="start">Start</label>
        <input type="text" id="start" placeholder="e.g. 2024-01-31, today, next monday" value="${escapeHtml(seed.startDateText)}" />
        <span class="row-icon">🛫</span>
        <input type="date" id="start-picker" />
    </div>

    <hr />

    ${dependencyFieldsHtml}

    <hr />

    <div class="status-row">
        <label class="field-label" for="status">Status</label>
        <select id="status">${statusOptionsHtml}</select>
    </div>

    <div class="date-row">
        <label class="field-label" for="created">Created</label>
        <input type="text" id="created" placeholder="e.g. 2024-01-31, today, next monday" value="${escapeHtml(seed.createdDateText)}" />
        <span class="row-icon">➕</span>
        <input type="date" id="created-picker" />
    </div>

    <div class="date-row">
        <label class="field-label" for="done">Done</label>
        <input type="text" id="done" placeholder="e.g. 2024-01-31, today, next monday" value="${escapeHtml(seed.doneDateText)}" />
        <span class="row-icon">✅</span>
        <input type="date" id="done-picker" />
    </div>

    <div class="date-row">
        <label class="field-label" for="cancelled">Cancelled</label>
        <input type="text" id="cancelled" placeholder="e.g. 2024-01-31, today, next monday" value="${escapeHtml(seed.cancelledDateText)}" />
        <span class="row-icon">❌</span>
        <input type="date" id="cancelled-picker" />
    </div>

    <div class="actions">
        <button id="apply">Apply</button>
        <button id="cancel">Cancel</button>
    </div>
</div>

<script nonce="${cspNonce}">
(function () {
    const vscode = acquireVsCodeApi();
    const initial = ${initialData};

    const descriptionEl = document.getElementById('description');
    const recurrenceEl = document.getElementById('recurrence');
    const recurrencePreviewEl = document.getElementById('recurrence-preview');
    const dueEl = document.getElementById('due');
    const scheduledEl = document.getElementById('scheduled');
    const startEl = document.getElementById('start');
    const statusEl = document.getElementById('status');
    const createdEl = document.getElementById('created');
    const doneEl = document.getElementById('done');
    const cancelledEl = document.getElementById('cancelled');
    const errorEl = document.getElementById('error');

    // ---- [[wikilink]] suggester for the description field ----
    // Ported from Obsidian-like's own WikiSuggestView (webview-src/editor.js, CM6-based — see its
    // CLAUDE.md) — same trigger regex, same candidate-matching/ranking, same keyboard/click
    // wiring, but this is a plain \`<textarea>\`, not CodeMirror, so there's no \`coordsAtPos()\` to
    // ask "where is character N on screen" — that's the one genuinely new piece here, done via
    // the standard "mirror div" technique (clone the textarea's text/font metrics into a hidden
    // div, insert a marker span at the caret offset, read its offsetLeft/offsetTop).
    (function () {
        const noteIndex = initial.noteIndex || [];
        const dropdown = document.getElementById('description-wikilink-dropdown');
        const WIKI_TRIGGER_RE = /\\[\\[([^\\]\\n]*)$/;
        const MAX_SUGGESTIONS = 5;

        let openBracketFrom = -1;
        let items = [];
        let selected = -1;
        let dismissedKey = null;
        let mode = 'notes'; // 'notes' | 'headings'
        let currentNotePart = ''; // note name before "#", headings mode only
        let loading = false;
        let headingsToken = 0;

        function matchNotes(query) {
            const q = query.trim().toLowerCase();
            const toItem = (note) => ({ type: 'note', name: note.name, dir: note.dir });
            if (!q) {
                return noteIndex.slice(0, MAX_SUGGESTIONS).map(toItem);
            }
            const scored = [];
            for (const note of noteIndex) {
                const name = note.name.toLowerCase();
                const idx = name.indexOf(q);
                if (idx === -1) continue;
                scored.push({ note: note, idx: idx, startsWith: idx === 0 });
            }
            scored.sort((a, b) => {
                if (a.startsWith !== b.startsWith) return a.startsWith ? -1 : 1;
                if (a.idx !== b.idx) return a.idx - b.idx;
                return a.note.name.localeCompare(b.note.name);
            });
            return scored.slice(0, MAX_SUGGESTIONS).map((s) => toItem(s.note));
        }

        // Once the typed text after "[[" contains a "#" (e.g. "[[documento#"), the popup switches
        // from listing notes to listing *that note's own headings* — mirrors Obsidian-like's own
        // WikiSuggestView (webview-src/editor.js in that repo), including the same host round-trip
        // (there's no way to read another file's headings from inside this webview), just adapted
        // to this file's plain-textarea/procedural style instead of a CM6 ViewPlugin class.
        const pendingHeadingRequests = {};
        let headingsReqSeq = 0;
        function requestHeadings(note) {
            return new Promise((resolve) => {
                const id = 'h' + (++headingsReqSeq);
                pendingHeadingRequests[id] = resolve;
                vscode.postMessage({ type: 'get-headings', id: id, note: note });
            });
        }

        const MIRROR_PROPS = [
            'boxSizing', 'width', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
            'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight',
            'textTransform', 'wordSpacing',
        ];
        function caretCoordinates(textarea, position) {
            const mirror = document.createElement('div');
            const style = getComputedStyle(textarea);
            MIRROR_PROPS.forEach((prop) => { mirror.style[prop] = style[prop]; });
            mirror.style.position = 'absolute';
            mirror.style.visibility = 'hidden';
            mirror.style.whiteSpace = 'pre-wrap';
            mirror.style.wordWrap = 'break-word';
            mirror.style.top = '0';
            mirror.style.left = '-9999px';
            mirror.style.height = 'auto';
            document.body.appendChild(mirror);
            mirror.textContent = textarea.value.substring(0, position);
            const marker = document.createElement('span');
            marker.textContent = textarea.value.substring(position) || '.';
            mirror.appendChild(marker);
            const left = marker.offsetLeft;
            const top = marker.offsetTop;
            const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
            document.body.removeChild(mirror);
            return { left: left, top: top, lineHeight: lineHeight };
        }

        function currentContext() {
            const pos = descriptionEl.selectionStart;
            if (pos !== descriptionEl.selectionEnd) return null;
            const before = descriptionEl.value.slice(0, pos);
            const match = WIKI_TRIGGER_RE.exec(before);
            if (!match) return null;
            return { openBracketFrom: pos - match[0].length, query: match[1], pos: pos };
        }

        function positionDropdown() {
            const coords = caretCoordinates(descriptionEl, openBracketFrom);
            dropdown.style.left = coords.left + 'px';
            dropdown.style.top = (coords.top + coords.lineHeight) + 'px';
            dropdown.hidden = false;
        }

        function render() {
            if (loading) {
                dropdown.innerHTML = '';
                const li = document.createElement('li');
                li.textContent = 'Cargando encabezados…';
                li.style.opacity = '0.6';
                li.style.cursor = 'default';
                dropdown.appendChild(li);
                positionDropdown();
                return;
            }
            if (items.length === 0) {
                dropdown.hidden = true;
                return;
            }
            dropdown.innerHTML = '';
            items.forEach((item, i) => {
                const li = document.createElement('li');
                li.className = i === selected ? 'selected' : '';
                const title = document.createElement('span');
                title.textContent = item.type === 'heading' ? '#'.repeat(item.level) + ' ' + item.text : item.name;
                li.appendChild(title);
                if (item.type === 'note' && item.dir) {
                    const dir = document.createElement('span');
                    dir.className = 'wikilink-dir';
                    dir.textContent = item.dir;
                    li.appendChild(dir);
                }
                li.dataset.index = String(i);
                dropdown.appendChild(li);
            });
            positionDropdown();
        }

        function close() {
            openBracketFrom = -1;
            items = [];
            selected = -1;
            mode = 'notes';
            currentNotePart = '';
            loading = false;
            headingsToken++; // invalidate any in-flight requestHeadings() for the mode we're leaving
            dropdown.hidden = true;
        }

        function dismiss() {
            const ctx = currentContext();
            if (ctx) dismissedKey = ctx.openBracketFrom + ':' + ctx.query;
            close();
        }

        function recompute() {
            const ctx = currentContext();
            if (!ctx) { close(); return; }
            const key = ctx.openBracketFrom + ':' + ctx.query;
            if (dismissedKey === key) return;
            dismissedKey = null;
            openBracketFrom = ctx.openBracketFrom;

            const hashIdx = ctx.query.indexOf('#');
            if (hashIdx === -1) {
                mode = 'notes';
                loading = false;
                items = matchNotes(ctx.query);
                selected = items.length > 0 ? 0 : -1;
                render();
                return;
            }

            const notePart = ctx.query.slice(0, hashIdx);
            if (!notePart) { close(); return; }
            mode = 'headings';
            currentNotePart = notePart;
            loading = true;
            items = [];
            selected = -1;
            render();

            const headingQuery = ctx.query.slice(hashIdx + 1).trim().toLowerCase();
            const token = ++headingsToken;
            requestHeadings(notePart).then((headings) => {
                if (token !== headingsToken) return; // superseded by a later keystroke or close()
                items = (headings || [])
                    .filter((h) => h.text.toLowerCase().includes(headingQuery))
                    .map((h) => ({ type: 'heading', level: h.level, text: h.text }));
                loading = false;
                selected = items.length > 0 ? 0 : -1;
                render();
            });
        }

        function accept(index) {
            const i = index === undefined ? selected : index;
            if (i < 0 || i >= items.length) return;
            const item = items[i];
            const pos = descriptionEl.selectionStart;
            let to = pos;
            // If the cursor sits inside an already-closed [[...]] (e.g. clicked back in to type
            // "#cabecera" after the note name), swallow the trailing "]]" into the replaced range
            // so insertText's own "]]" replaces it instead of leaving both.
            if (descriptionEl.value.slice(pos, pos + 2) === ']]') to += 2;
            const insertText = item.type === 'heading'
                ? '[[' + currentNotePart + '#' + item.text + ']]'
                : '[[' + item.name + ']]';
            descriptionEl.value = descriptionEl.value.slice(0, openBracketFrom) + insertText + descriptionEl.value.slice(to);
            const newPos = openBracketFrom + insertText.length;
            descriptionEl.setSelectionRange(newPos, newPos);
            descriptionEl.focus();
            close();
        }

        descriptionEl.addEventListener('input', recompute);
        descriptionEl.addEventListener('click', recompute);
        descriptionEl.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') recompute();
        });
        descriptionEl.addEventListener('blur', () => {
            // Delayed so a dropdown mousedown (which calls preventDefault, but blur can still
            // fire first in some browsers) has a chance to run its click handler before the
            // dropdown gets torn down.
            setTimeout(close, 150);
        });
        descriptionEl.addEventListener('keydown', (e) => {
            if (dropdown.hidden) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                dismiss();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                selected = items.length ? (selected + 1) % items.length : -1;
                render();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selected = items.length ? (selected - 1 + items.length) % items.length : -1;
                render();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                accept();
            }
        });
        dropdown.addEventListener('mousedown', (e) => e.preventDefault());
        dropdown.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            // The "Cargando encabezados…" placeholder row (see render()) carries no data-index —
            // it isn't a real suggestion, just a status message, so a click on it must not fall
            // through to accept(NaN) (items[NaN] is undefined, which would throw on item.type).
            if (li && li.dataset.index !== undefined) accept(Number(li.dataset.index));
        });

        // \`pendingHeadingRequests\` lives inside this IIFE's own closure (unlike
        // \`dependencyResultHandlers\`, which is declared at the outer script scope specifically so
        // the single shared 'message' listener further down can reach it) — so this needs its own
        // listener rather than adding a case to that one. Multiple 'message' listeners on the same
        // window are fine; both just fire.
        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.type === 'headings-result') {
                const resolve = pendingHeadingRequests[message.id];
                if (resolve) {
                    delete pendingHeadingRequests[message.id];
                    resolve(message.headings);
                }
            }
        });
    })();

    // Resolving free text like "today"/"next monday" to an absolute date needs chrono-node,
    // which isn't bundled for the webview, so the picker is kept in sync via a debounced
    // round-trip to the extension host (see the 'resolveDate'/'dateResolved' messages) instead
    // of being computed here.
    const dateResolveDebounce = {};
    function requestDateResolve(fieldId) {
        const textInput = document.getElementById(fieldId);
        clearTimeout(dateResolveDebounce[fieldId]);
        dateResolveDebounce[fieldId] = setTimeout(() => {
            vscode.postMessage({ type: 'resolveDate', field: fieldId, text: textInput.value });
        }, 300);
    }

    function wireDatePicker(textId, pickerId) {
        const textInput = document.getElementById(textId);
        const picker = document.getElementById(pickerId);
        if (/^\\d{4}-\\d{2}-\\d{2}$/.test(textInput.value)) {
            picker.value = textInput.value;
        }
        picker.addEventListener('change', () => {
            if (picker.value) {
                textInput.value = picker.value;
                requestRecurrencePreview();
            }
        });
        textInput.addEventListener('input', () => requestDateResolve(textId));
    }
    wireDatePicker('due', 'due-picker');
    wireDatePicker('scheduled', 'scheduled-picker');
    wireDatePicker('start', 'start-picker');
    wireDatePicker('created', 'created-picker');
    wireDatePicker('done', 'done-picker');
    wireDatePicker('cancelled', 'cancelled-picker');

    function getPriority() {
        const checked = document.querySelector('input[name="priority"]:checked');
        return checked ? checked.value : '3';
    }

    let debounceHandle;
    function requestRecurrencePreview() {
        clearTimeout(debounceHandle);
        debounceHandle = setTimeout(() => {
            vscode.postMessage({
                type: 'previewRecurrence',
                recurrenceRuleText: recurrenceEl.value,
                dueDateText: dueEl.value,
                scheduledDateText: scheduledEl.value,
                startDateText: startEl.value,
            });
        }, 250);
    }
    [recurrenceEl, dueEl, scheduledEl, startEl].forEach((el) => el.addEventListener('input', requestRecurrencePreview));
    requestRecurrencePreview();

    statusEl.addEventListener('change', () => {
        vscode.postMessage({
            type: 'statusChanged',
            statusSymbol: statusEl.value,
            doneDateText: doneEl.value,
            cancelledDateText: cancelledEl.value,
        });
    });

    // ---- Before this / After this dependency fields ----
    const dependencyFields = ['before_this', 'after_this'];
    const fieldToKey = { before_this: 'blockedBy', after_this: 'blocking' };
    const selected = { blockedBy: new Map(), blocking: new Map() };
    (initial.initialBlockedBy || []).forEach((c) => selected.blockedBy.set(c.key, c));
    (initial.initialBlocking || []).forEach((c) => selected.blocking.set(c.key, c));

    // One entry per field, populated by the loop below, so the generic 'dependencyResults'
    // message handler can hand results back to the right field's own render closure.
    const dependencyResultHandlers = {};

    dependencyFields.forEach((fieldId) => {
        const input = document.getElementById(fieldId);
        if (!input) return;
        const dropdown = document.getElementById(fieldId + '-dropdown');
        const pillsEl = document.getElementById(fieldId + '-pills');
        const key = fieldToKey[fieldId];
        let results = [];
        let highlighted = -1;

        function renderPills() {
            pillsEl.innerHTML = '';
            selected[key].forEach((candidate) => {
                const pill = document.createElement('div');
                pill.className = 'dependency-pill';
                const text = document.createElement('span');
                text.className = 'dependency-pill-text';
                text.textContent = '[' + candidate.statusSymbol + '] ' + candidate.description;
                pill.appendChild(text);
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'dependency-pill-remove';
                remove.textContent = '\\u00d7';
                remove.addEventListener('click', () => {
                    selected[key].delete(candidate.key);
                    renderPills();
                });
                pill.appendChild(remove);
                pillsEl.appendChild(pill);
            });
        }
        renderPills();

        function excludeKeys() {
            return [...selected.blockedBy.keys(), ...selected.blocking.keys()];
        }

        function renderDropdown() {
            dropdown.innerHTML = '';
            if (results.length === 0) {
                dropdown.hidden = true;
                return;
            }
            dropdown.hidden = false;
            results.forEach((candidate, index) => {
                const li = document.createElement('li');
                li.className = index === highlighted ? 'selected' : '';
                const label = document.createElement('span');
                label.textContent = '[' + candidate.statusSymbol + '] ' + candidate.description;
                li.appendChild(label);
                const path = document.createElement('span');
                path.className = 'dep-path';
                path.textContent = candidate.path;
                li.appendChild(path);
                li.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    addCandidate(candidate);
                });
                dropdown.appendChild(li);
            });
        }

        function addCandidate(candidate) {
            selected[key].set(candidate.key, candidate);
            input.value = '';
            results = [];
            highlighted = -1;
            renderDropdown();
            renderPills();
        }

        let searchDebounce;
        function requestSearch() {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => {
                vscode.postMessage({
                    type: 'searchDependency',
                    field: fieldId,
                    query: input.value,
                    excludeKeys: excludeKeys(),
                });
            }, 150);
        }

        input.addEventListener('focus', requestSearch);
        input.addEventListener('input', requestSearch);
        input.addEventListener('blur', () => {
            setTimeout(() => {
                results = [];
                renderDropdown();
            }, 150);
        });
        input.addEventListener('keydown', (e) => {
            if (results.length === 0) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                highlighted = (highlighted + 1) % results.length;
                renderDropdown();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                highlighted = highlighted <= 0 ? results.length - 1 : highlighted - 1;
                renderDropdown();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const index = highlighted >= 0 ? highlighted : 0;
                addCandidate(results[index]);
            } else if (e.key === 'Escape') {
                results = [];
                renderDropdown();
            }
        });

        dependencyResultHandlers[fieldId] = (newResults) => {
            results = newResults;
            highlighted = -1;
            renderDropdown();
        };
    });

    window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'recurrencePreview') {
            recurrencePreviewEl.textContent = message.preview;
        } else if (message.type === 'error') {
            errorEl.textContent = message.error;
            errorEl.style.display = 'block';
        } else if (message.type === 'statusDatesUpdated') {
            doneEl.value = message.doneDateText;
            cancelledEl.value = message.cancelledDateText;
        } else if (message.type === 'dateResolved') {
            const picker = document.getElementById(message.field + '-picker');
            if (picker) {
                picker.value = message.dateText;
            }
        } else if (message.type === 'dependencyResults') {
            const handler = dependencyResultHandlers[message.field];
            if (handler) handler(message.results);
        }
    });

    document.getElementById('apply').addEventListener('click', () => {
        errorEl.style.display = 'none';
        vscode.postMessage({
            type: 'apply',
            description: descriptionEl.value,
            priority: getPriority(),
            recurrenceRuleText: recurrenceEl.value,
            dueDateText: dueEl.value,
            scheduledDateText: scheduledEl.value,
            startDateText: startEl.value,
            statusSymbol: statusEl.value,
            createdDateText: createdEl.value,
            doneDateText: doneEl.value,
            cancelledDateText: cancelledEl.value,
            blockedByKeys: [...selected.blockedBy.keys()],
            blockingKeys: [...selected.blocking.keys()],
        });
    });
    document.getElementById('cancel').addEventListener('click', () => {
        vscode.postMessage({ type: 'cancel' });
    });

    // Esc closes the dialog outright, without requiring a trip down to the Cancel button, but
    // only while the description is still empty — the one field every task needs, so an empty
    // description means nothing worth keeping has been entered yet. A non-empty description
    // leaves Esc alone (no accidental data loss), same as every other field's own Esc handler
    // above (wikilink dropdown, dependency search) — none of those call stopPropagation, but they
    // only ever fire while the description already has text (e.g. mid "[[wikilink"), so this can
    // never race with them in practice.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && descriptionEl.value.trim() === '') {
            vscode.postMessage({ type: 'cancel' });
        }
    });

    descriptionEl.focus();
    descriptionEl.setSelectionRange(descriptionEl.value.length, descriptionEl.value.length);
})();
</script>
</body>
</html>`;
}
