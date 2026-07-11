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
export function showTaskEditDialog(
    seed: TaskFormSeed,
    isEditing: boolean,
    context: TaskFormContext,
): Promise<TaskFormResult | undefined> {
    return new Promise((resolve) => {
        const panel = vscode.window.createWebviewPanel(
            'obsidianLikeTasksEditTask',
            isEditing ? 'Edit Task' : 'Create Task',
            { viewColumn: vscode.ViewColumn.Active, preserveFocus: false },
            { enableScripts: true, retainContextWhenHidden: false },
        );

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

        panel.webview.html = renderHtml(panel.webview, seed, isEditing, context);

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

function renderHtml(webview: vscode.Webview, seed: TaskFormSeed, isEditing: boolean, context: TaskFormContext): string {
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
    h1 { font-size: 1.4em; margin: 0 0 20px; }
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
    <h1>${isEditing ? 'Edit Task' : 'Create Task'}</h1>
    <div id="error" class="error-banner"></div>

    <div class="field">
        <label class="field-label" for="description">Description</label>
        <textarea id="description">${escapeHtml(seed.description)}</textarea>
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
})();
</script>
</body>
</html>`;
}
