"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleTaskAtCursor = toggleTaskAtCursor;
exports.toggleTaskOnLine = toggleTaskOnLine;
exports.createOrEditTaskAtCursor = createOrEditTaskAtCursor;
exports.createOrEditTaskOnLine = createOrEditTaskOnLine;
const vscode = __importStar(require("vscode"));
const Task_1 = require("../core/Task/Task");
const TaskLocation_1 = require("../core/Task/TaskLocation");
const Status_1 = require("../core/Statuses/Status");
const StatusRegistry_1 = require("../core/Statuses/StatusRegistry");
const Priority_1 = require("../core/Task/Priority");
const Recurrence_1 = require("../core/Task/Recurrence");
const Occurrence_1 = require("../core/Task/Occurrence");
const OnCompletion_1 = require("../core/Task/OnCompletion");
const TaskRegularExpressions_1 = require("../core/Task/TaskRegularExpressions");
const DateParsing_1 = require("../core/Query/DateParsing");
const PRIORITY_OPTIONS = [
    { label: '🔺 Highest', priority: Priority_1.Priority.Highest },
    { label: '⏫ High', priority: Priority_1.Priority.High },
    { label: '🔼 Medium', priority: Priority_1.Priority.Medium },
    { label: 'Normal', priority: Priority_1.Priority.None },
    { label: '🔽 Low', priority: Priority_1.Priority.Low },
    { label: '⏬ Lowest', priority: Priority_1.Priority.Lowest },
];
function relativePath(document) {
    return vscode.workspace.asRelativePath(document.uri, false);
}
function getActiveMarkdownTabUri() {
    const input = vscode.window.tabGroups.activeTabGroup?.activeTab?.input;
    if (input instanceof vscode.TabInputText || input instanceof vscode.TabInputCustom) {
        if (input.uri.path.toLowerCase().endsWith('.md')) {
            return input.uri;
        }
    }
    return undefined;
}
/**
 * Find the markdown document the user is currently looking at, whether it's open in VS Code's
 * native text editor (in which case a cursor position is also available) or in a custom editor
 * like Vault Tool's (in which case only the underlying document is reachable — `activeTextEditor`
 * is `undefined` for those, since a custom editor's webview is not a `TextEditor`).
 */
async function resolveActiveMarkdownTarget() {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.languageId === 'markdown') {
        return { document: activeEditor.document, editor: activeEditor };
    }
    const uri = getActiveMarkdownTabUri();
    if (!uri) {
        return undefined;
    }
    const document = await vscode.workspace.openTextDocument(uri);
    return { document };
}
/**
 * Toggle the status of the task on the cursor's current line (Obsidian Tasks' 'Toggle task
 * done' command). Recurring tasks get their next occurrence inserted alongside the completed
 * one, exactly as `Task.toggleWithRecurrenceInUsersOrder()` decides.
 *
 * Requires a known cursor line, so this only works when the file is open in VS Code's native
 * text editor — if it's open in a custom editor (Vault Tool), there is no cursor position to
 * read, and the user should toggle the task from that editor's own UI instead.
 */
async function toggleTaskAtCursor() {
    const target = await resolveActiveMarkdownTarget();
    if (!target?.editor) {
        void vscode.window.showInformationMessage('Tasks: no hay una posición de cursor conocida (el archivo está abierto con un editor personalizado). Usa el checkbox de ese editor, o ábrelo con "Open With → Text Editor".');
        return;
    }
    await toggleTaskOnLine(target.editor, target.editor.selection.active.line);
}
/** Same as {@link toggleTaskAtCursor}, but for an explicit line — used by CodeLens actions. */
async function toggleTaskOnLine(editor, line) {
    const lineText = editor.document.lineAt(line).text;
    const taskLocation = new TaskLocation_1.TaskLocation(relativePath(editor.document), line);
    const task = Task_1.Task.fromLine({ line: lineText, taskLocation });
    if (task === null) {
        void vscode.window.showInformationMessage('Tasks: the current line is not a checkbox task.');
        return;
    }
    const resultingTasks = task.toggleWithRecurrenceInUsersOrder();
    const replacement = resultingTasks.map((t) => t.toFileLineString()).join('\n');
    await editor.edit((builder) => {
        builder.replace(editor.document.lineAt(line).range, replacement);
    });
}
/**
 * Create a new task, or edit the task on the cursor's current line, through a sequence of
 * QuickInput steps. This mirrors the fields of Obsidian Tasks' 'Create or edit task' modal
 * (description, priority, dates, recurrence), using VS Code's native input widgets in place
 * of the original's custom Svelte modal.
 *
 * When the active file is open in a custom editor (no known cursor line), this always creates
 * a new task appended at the end of the document rather than editing "the current line", since
 * there is no current line to edit.
 */
async function createOrEditTaskAtCursor() {
    const target = await resolveActiveMarkdownTarget();
    if (!target) {
        void vscode.window.showInformationMessage('Tasks: open a markdown file first.');
        return;
    }
    if (target.editor) {
        await createOrEditTaskOnLine(target.editor, target.editor.selection.active.line);
        return;
    }
    await createTaskAppendedToDocument(target.document);
}
/** Same as {@link createOrEditTaskAtCursor}, but for an explicit line — used by CodeLens actions. */
async function createOrEditTaskOnLine(editor, line) {
    const lineText = editor.document.lineAt(line).text;
    const taskLocation = new TaskLocation_1.TaskLocation(relativePath(editor.document), line);
    const existing = Task_1.Task.fromLine({ line: lineText, taskLocation });
    const nonTaskMatch = lineText.match(TaskRegularExpressions_1.TaskRegularExpressions.nonTaskRegex);
    const task = await promptForTaskFields(existing, taskLocation, {
        seedDescription: existing?.description ?? nonTaskMatch?.[5]?.trim() ?? lineText.trim(),
        seedIndentation: existing?.indentation ?? nonTaskMatch?.[1] ?? '',
        seedListMarker: existing?.listMarker ?? nonTaskMatch?.[2] ?? '-',
    });
    if (!task) {
        return;
    }
    await editor.edit((builder) => {
        builder.replace(editor.document.lineAt(line).range, task.toFileLineString());
    });
}
/** Prompts for a brand-new task and appends it as a new line at the end of `document`. */
async function createTaskAppendedToDocument(document) {
    const taskLocation = new TaskLocation_1.TaskLocation(relativePath(document), document.lineCount);
    const task = await promptForTaskFields(null, taskLocation, {
        seedDescription: '',
        seedIndentation: '',
        seedListMarker: '-',
    });
    if (!task) {
        return;
    }
    const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
    const lastLine = document.lineAt(document.lineCount - 1);
    const prefix = lastLine.text.length > 0 ? eol : '';
    const edit = new vscode.WorkspaceEdit();
    edit.insert(document.uri, lastLine.range.end, prefix + task.toFileLineString());
    await vscode.workspace.applyEdit(edit);
}
/**
 * Runs the description/priority/dates/recurrence QuickInput sequence and returns the resulting
 * {@link Task}, or `undefined` if the user cancelled at any step.
 */
async function promptForTaskFields(existing, taskLocation, seeds) {
    const description = await vscode.window.showInputBox({
        title: existing ? 'Edit task — description' : 'Create task — description',
        value: seeds.seedDescription,
        prompt: 'The task text, including any #tags',
        validateInput: (v) => (v.trim() ? null : 'Description cannot be empty'),
    });
    if (description === undefined) {
        return undefined;
    }
    const priorityPick = await vscode.window.showQuickPick(PRIORITY_OPTIONS.map((option) => ({
        label: option.label,
        picked: option.priority === (existing?.priority ?? Priority_1.Priority.None),
    })), { title: 'Priority', placeHolder: 'Choose a priority (Esc for Normal)' });
    const priority = PRIORITY_OPTIONS.find((option) => option.label === priorityPick?.label)?.priority ?? Priority_1.Priority.None;
    const dueDateText = await vscode.window.showInputBox({
        title: 'Due date',
        value: existing?.dueDate ? existing.dueDate.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat) : '',
        prompt: "e.g. 2024-01-31, today, next monday — leave empty for none",
        validateInput: (v) => (v.trim() === '' || (0, DateParsing_1.parseQueryDate)(v) !== null ? null : 'Could not understand that date'),
    });
    if (dueDateText === undefined) {
        return undefined;
    }
    const scheduledDateText = await vscode.window.showInputBox({
        title: 'Scheduled date',
        value: existing?.scheduledDate ? existing.scheduledDate.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat) : '',
        prompt: 'When you plan to work on it — leave empty for none',
        validateInput: (v) => (v.trim() === '' || (0, DateParsing_1.parseQueryDate)(v) !== null ? null : 'Could not understand that date'),
    });
    if (scheduledDateText === undefined) {
        return undefined;
    }
    const startDateText = await vscode.window.showInputBox({
        title: 'Start date',
        value: existing?.startDate ? existing.startDate.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat) : '',
        prompt: "The earliest this task should be actioned — leave empty for none",
        validateInput: (v) => (v.trim() === '' || (0, DateParsing_1.parseQueryDate)(v) !== null ? null : 'Could not understand that date'),
    });
    if (startDateText === undefined) {
        return undefined;
    }
    const dueDate = dueDateText.trim() === '' ? null : (0, DateParsing_1.parseQueryDate)(dueDateText);
    const scheduledDate = scheduledDateText.trim() === '' ? null : (0, DateParsing_1.parseQueryDate)(scheduledDateText);
    const startDate = startDateText.trim() === '' ? null : (0, DateParsing_1.parseQueryDate)(startDateText);
    const recurrenceText = await vscode.window.showInputBox({
        title: 'Recurrence',
        value: existing?.recurrenceRule ?? '',
        prompt: "e.g. 'every week', 'every month on the 1st' — leave empty for a one-off task",
        validateInput: (v) => {
            if (v.trim() === '')
                return null;
            const recurrence = Recurrence_1.Recurrence.fromText({
                recurrenceRuleText: v,
                occurrence: new Occurrence_1.Occurrence({ startDate, scheduledDate, dueDate }),
            });
            return recurrence !== null ? null : 'Could not understand that recurrence rule';
        },
    });
    if (recurrenceText === undefined) {
        return undefined;
    }
    const recurrence = recurrenceText.trim() === ''
        ? null
        : Recurrence_1.Recurrence.fromText({
            recurrenceRuleText: recurrenceText,
            occurrence: new Occurrence_1.Occurrence({ startDate, scheduledDate, dueDate }),
        });
    const status = existing?.status ?? StatusRegistry_1.StatusRegistry.getInstance().bySymbolOrCreate(Status_1.Status.TODO.symbol);
    return new Task_1.Task({
        status,
        description,
        taskLocation,
        indentation: seeds.seedIndentation,
        listMarker: seeds.seedListMarker,
        priority,
        createdDate: existing?.createdDate ?? null,
        startDate,
        scheduledDate,
        dueDate,
        doneDate: existing?.doneDate ?? null,
        cancelledDate: existing?.cancelledDate ?? null,
        recurrence,
        onCompletion: existing?.onCompletion ?? OnCompletion_1.OnCompletion.Ignore,
        dependsOn: existing?.dependsOn ?? [],
        id: existing?.id ?? '',
        blockLink: existing?.blockLink ?? '',
        tags: Task_1.Task.extractHashtags(description),
        originalMarkdown: '',
        scheduledDateIsInferred: false,
    });
}
//# sourceMappingURL=taskCommands.js.map