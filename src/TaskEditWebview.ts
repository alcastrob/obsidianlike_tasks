import * as vscode from 'vscode';
import type { Moment } from 'moment';
import { Priority, priorityNameUsingNormal } from './core/Task/Priority';
import { parseQueryDate } from './core/Query/DateParsing';
import { Recurrence } from './core/Task/Recurrence';
import { Occurrence } from './core/Task/Occurrence';
import { TaskRegularExpressions } from './core/Task/TaskRegularExpressions';

export interface TaskFormSeed {
    description: string;
    priority: Priority;
    recurrenceRuleText: string;
    dueDateText: string;
    scheduledDateText: string;
    startDateText: string;
}

export interface TaskFormResult {
    description: string;
    priority: Priority;
    recurrence: Recurrence | null;
    dueDate: Moment | null;
    scheduledDate: Moment | null;
    startDate: Moment | null;
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
 * Shows a single-screen dialog for creating/editing a task's description, priority, recurrence,
 * and due/scheduled/start dates — the fields this port's "Create or edit task" command already
 * supports — laid out to resemble Obsidian Tasks' own "Create or edit Task" modal (priority grid,
 * one icon-labelled row per date field, live recurrence preview text). VS Code has no API for a
 * true floating modal dialog with custom HTML; this opens as a `WebviewPanel` (an editor tab)
 * whose content is styled as a centred card over a dimmed backdrop to approximate one.
 *
 * Resolves with the already-validated/parsed field values once the user clicks Apply, or
 * `undefined` if they cancel or close the tab. Validation (dates, recurrence) happens here, in
 * the extension host — the webview has no access to `chrono-node`/`rrule` — and is re-run live as
 * the user types the recurrence field, and again on Apply for every field before resolving.
 */
export function showTaskEditDialog(seed: TaskFormSeed, isEditing: boolean): Promise<TaskFormResult | undefined> {
    return new Promise((resolve) => {
        const panel = vscode.window.createWebviewPanel(
            'obsidianLikeTasksEditTask',
            isEditing ? 'Edit Task' : 'Create Task',
            { viewColumn: vscode.ViewColumn.Active, preserveFocus: false },
            { enableScripts: true, retainContextWhenHidden: false },
        );

        let settled = false;
        const settle = (result: TaskFormResult | undefined) => {
            if (settled) {
                return;
            }
            settled = true;
            resolve(result);
            panel.dispose();
        };

        panel.webview.html = renderHtml(panel.webview, seed, isEditing);

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

                case 'apply': {
                    const { description, priority, recurrenceRuleText, dueDateText, scheduledDateText, startDateText } =
                        message;

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

                    settle({
                        description,
                        priority: priorityValue,
                        recurrence,
                        dueDate: due.date,
                        scheduledDate: scheduled.date,
                        startDate: start.date,
                    });
                    return;
                }
            }
        });

        panel.onDidDispose(() => settle(undefined));
    });
}

function renderHtml(webview: vscode.Webview, seed: TaskFormSeed, isEditing: boolean): string {
    const cspNonce = nonce();
    const initialData = toEmbeddableJson(seed);

    const priorityRadios = PRIORITY_GRID.map(
        ({ priority, label, icon }) => `
        <label class="priority-option">
            <input type="radio" name="priority" value="${priority}" ${priority === seed.priority ? 'checked' : ''} />
            <span class="priority-label">${icon ? `${icon} ` : ''}${label}</span>
        </label>`,
    ).join('');

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
    textarea, input[type='text'] {
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
    const errorEl = document.getElementById('error');

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
    }
    wireDatePicker('due', 'due-picker');
    wireDatePicker('scheduled', 'scheduled-picker');
    wireDatePicker('start', 'start-picker');

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
        });
    });
    document.getElementById('cancel').addEventListener('click', () => {
        vscode.postMessage({ type: 'cancel' });
    });

    window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'recurrencePreview') {
            recurrencePreviewEl.textContent = message.preview;
        } else if (message.type === 'error') {
            errorEl.textContent = message.error;
            errorEl.style.display = 'block';
        }
    });
})();
</script>
</body>
</html>`;
}
