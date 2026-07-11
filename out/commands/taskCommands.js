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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleTaskAtCursor = toggleTaskAtCursor;
exports.toggleTaskOnLine = toggleTaskOnLine;
exports.createOrEditTaskAtCursor = createOrEditTaskAtCursor;
exports.editTaskFromLineText = editTaskFromLineText;
exports.createOrEditTaskOnLine = createOrEditTaskOnLine;
const vscode = __importStar(require("vscode"));
const moment_1 = __importDefault(require("moment"));
const Task_1 = require("../core/Task/Task");
const TaskLocation_1 = require("../core/Task/TaskLocation");
const Status_1 = require("../core/Statuses/Status");
const StatusConfiguration_1 = require("../core/Statuses/StatusConfiguration");
const Priority_1 = require("../core/Task/Priority");
const OnCompletion_1 = require("../core/Task/OnCompletion");
const TaskRegularExpressions_1 = require("../core/Task/TaskRegularExpressions");
const TaskDependency_1 = require("../core/Task/TaskDependency");
const TaskEditWebview_1 = require("../TaskEditWebview");
const DependencySearch_1 = require("../DependencySearch");
const TaskFileEditor_1 = require("../TaskFileEditor");
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
 * like Obsidian-like's (in which case only the underlying document is reachable — `activeTextEditor`
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
 * text editor — if it's open in a custom editor (Obsidian-like), there is no cursor position to
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
 * Create a new task, or edit the task on the cursor's current line, through the "Create or edit
 * Task" webview dialog.
 *
 * When the active file is open in a custom editor (no known cursor line — see
 * {@link MarkdownTarget}), there is no "current line" to read a task from, so this always creates
 * a new task appended at the end of the document instead. That fallback used to happen silently,
 * which looked indistinguishable from "the dialog should have loaded my existing task but didn't"
 * — the user has no way to tell the two apart just by looking at an empty dialog. Now it warns
 * first, the same way {@link toggleTaskAtCursor} already does for the same underlying limitation.
 *
 * @param getAllTasks Every task currently known across the workspace (from `TaskIndex`), used to
 * seed and search the dialog's Before this/After this fields. Returns `[]` when no workspace
 * folder is open — the dependency fields are simply disabled in that case, same as an empty vault.
 */
async function createOrEditTaskAtCursor(getAllTasks) {
    const target = await resolveActiveMarkdownTarget();
    if (!target) {
        void vscode.window.showInformationMessage('Tasks: open a markdown file first.');
        return;
    }
    if (target.editor) {
        await createOrEditTaskOnLine(target.editor, target.editor.selection.active.line, getAllTasks);
        return;
    }
    void vscode.window.showInformationMessage('Tasks: no hay una posición de cursor conocida (el archivo está abierto con un editor personalizado). Se creará una tarea nueva al final del documento — para editar una tarea existente, ábrela con "Open With → Text Editor" o usa el botón "Edit" de esa tarea si el editor personalizado lo ofrece.');
    await createTaskAppendedToDocument(target.document, getAllTasks);
}
/**
 * Parses `lineText` as a task (if it is one) and shows the "Create or edit Task" dialog seeded
 * from it, returning the resulting {@link Task}(s) — more than one only when completing a
 * recurring task through the Status field spawns its next occurrence, same as the toggle command —
 * or `undefined` if the user cancelled. Shared by every entry point that already has raw line text
 * in hand — the cursor-based command, the CodeLens' explicit-line command, and
 * {@link TasksApi.ts}'s `editTaskAtLocation` (which gets `(path, line)` from Obsidian-like instead
 * of a `vscode.TextEditor`, so it doesn't have a `TaskLocation` computed via `relativePath()` the
 * way the other two do — callers pass one in).
 */
async function editTaskFromLineText(lineText, taskLocation, getAllTasks) {
    const existing = Task_1.Task.fromLine({ line: lineText, taskLocation });
    const nonTaskMatch = lineText.match(TaskRegularExpressions_1.TaskRegularExpressions.nonTaskRegex);
    return promptForTaskFields(existing, taskLocation, {
        seedDescription: existing?.description ?? nonTaskMatch?.[5]?.trim() ?? lineText.trim(),
        seedIndentation: existing?.indentation ?? nonTaskMatch?.[1] ?? '',
        seedListMarker: existing?.listMarker ?? nonTaskMatch?.[2] ?? '-',
    }, getAllTasks);
}
/** Same as {@link createOrEditTaskAtCursor}, but for an explicit line — used by CodeLens actions. */
async function createOrEditTaskOnLine(editor, line, getAllTasks) {
    const lineText = editor.document.lineAt(line).text;
    const taskLocation = new TaskLocation_1.TaskLocation(relativePath(editor.document), line);
    const tasks = await editTaskFromLineText(lineText, taskLocation, getAllTasks);
    if (!tasks) {
        return;
    }
    const replacement = tasks.map((t) => t.toFileLineString()).join('\n');
    await editor.edit((builder) => {
        builder.replace(editor.document.lineAt(line).range, replacement);
    });
}
/** Prompts for a brand-new task and appends it as a new line (or lines, if it immediately spawns a
 * recurrence — e.g. created with a recurrence rule and the Status field set straight to Done) at
 * the end of `document`. */
async function createTaskAppendedToDocument(document, getAllTasks) {
    const taskLocation = new TaskLocation_1.TaskLocation(relativePath(document), document.lineCount);
    const tasks = await promptForTaskFields(null, taskLocation, {
        seedDescription: '',
        seedIndentation: '',
        seedListMarker: '-',
    }, getAllTasks);
    if (!tasks) {
        return;
    }
    const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
    const lastLine = document.lineAt(document.lineCount - 1);
    const prefix = lastLine.text.length > 0 ? eol : '';
    const edit = new vscode.WorkspaceEdit();
    edit.insert(document.uri, lastLine.range.end, prefix + tasks.map((t) => t.toFileLineString()).join(eol));
    await vscode.workspace.applyEdit(edit);
}
/**
 * If the user has manually edited the Done date or Cancelled date in the dialog, that value must
 * be used as "today" for the status-transition machinery in {@link Task.handleNewStatus}, instead
 * of the real current date — mirrors Obsidian Tasks' `EditableTask.inferTodaysDate`. Needed for a
 * task that already had a Done/Cancelled date before being edited, or whose date the user just
 * typed in alongside changing the Status dropdown.
 */
function inferTodaysDate(newStatusType, doneDate, cancelledDate) {
    if (newStatusType === StatusConfiguration_1.StatusType.DONE && doneDate !== null) {
        return doneDate;
    }
    if (newStatusType === StatusConfiguration_1.StatusType.CANCELLED && cancelledDate !== null) {
        return cancelledDate;
    }
    return (0, moment_1.default)();
}
/**
 * Shows the "Create or edit Task" webview dialog and returns the resulting {@link Task}(s), or
 * `undefined` if the user cancelled. All field validation (dates, recurrence) happens inside
 * {@link showTaskEditDialog} itself, so the values here are already fully parsed; this function's
 * own job is everything {@link showTaskEditDialog} can't do without a snapshot of the whole
 * workspace: assigning ids and propagating dependency edits to *other* tasks' files (mirroring
 * Obsidian Tasks' `EditableTask.applyEdits`), and running the actual status transition (so that
 * completing a recurring task through the Status field spawns its next occurrence, same as the
 * toggle command does).
 */
async function promptForTaskFields(existing, taskLocation, seeds, getAllTasks) {
    const allTasks = getAllTasks();
    const currentId = existing?.id ?? '';
    const originalBlocking = currentId !== '' ? allTasks.filter((t) => t.dependsOn.includes(currentId)) : [];
    const result = await (0, TaskEditWebview_1.showTaskEditDialog)({
        description: seeds.seedDescription,
        priority: existing?.priority ?? Priority_1.Priority.None,
        recurrenceRuleText: existing?.recurrenceRule ?? '',
        dueDateText: existing?.dueDate ? existing.dueDate.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat) : '',
        scheduledDateText: existing?.scheduledDate
            ? existing.scheduledDate.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat)
            : '',
        startDateText: existing?.startDate ? existing.startDate.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat) : '',
        statusSymbol: existing?.status.symbol ?? Status_1.Status.TODO.symbol,
        createdDateText: existing?.createdDate ? existing.createdDate.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat) : '',
        doneDateText: existing?.doneDate ? existing.doneDate.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat) : '',
        cancelledDateText: existing?.cancelledDate
            ? existing.cancelledDate.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat)
            : '',
    }, existing !== null, { existingTask: existing, allTasks, taskLocation });
    if (!result) {
        return undefined;
    }
    // "Before this": this task depends on each selected task, which must have an id to be
    // referenced — generate one and write it back to that task's file if it doesn't have one yet.
    const blockedByWithIds = [];
    for (const depTask of result.blockedBy) {
        if (depTask.id !== '') {
            blockedByWithIds.push(depTask);
            continue;
        }
        const idsInUse = allTasks.filter((t) => t.id !== '').map((t) => t.id);
        const withId = (0, TaskDependency_1.ensureTaskHasId)(depTask, idsInUse);
        await (0, TaskFileEditor_1.replaceTaskWithTasks)(depTask, [withId]);
        blockedByWithIds.push(withId);
    }
    // "After this": each selected task must depend on *this* task, which needs its own id for
    // that — generate one (if this task doesn't already have it) only when the set of "blocking"
    // tasks actually changed.
    const keyOf = DependencySearch_1.dependencyKey;
    const originalBlockingKeys = new Set(originalBlocking.map(keyOf));
    const newBlockingKeys = new Set(result.blocking.map(keyOf));
    const removedBlocking = originalBlocking.filter((t) => !newBlockingKeys.has(keyOf(t)));
    const addedBlocking = result.blocking.filter((t) => !originalBlockingKeys.has(keyOf(t)));
    let id = currentId;
    if (id === '' && (removedBlocking.length > 0 || addedBlocking.length > 0)) {
        const idsInUse = allTasks.filter((t) => t.id !== '').map((t) => t.id);
        id = (0, TaskDependency_1.generateUniqueId)(idsInUse);
    }
    for (const blockingTask of removedBlocking) {
        await (0, TaskFileEditor_1.replaceTaskWithTasks)(blockingTask, [(0, TaskDependency_1.removeDependency)(blockingTask, { id })]);
    }
    for (const blockingTask of addedBlocking) {
        await (0, TaskFileEditor_1.replaceTaskWithTasks)(blockingTask, [(0, TaskDependency_1.addDependencyToParent)(blockingTask, { id })]);
    }
    // Build the task with every edit except the Status transition itself, then hand it to
    // `handleNewStatusWithRecurrenceInUsersOrder` so a completed recurring task also gets its next
    // occurrence — exactly the order Obsidian Tasks' `EditableTask.applyEdits` uses.
    const updatedTask = new Task_1.Task({
        status: existing?.status ?? Status_1.Status.TODO,
        description: result.description,
        taskLocation,
        indentation: seeds.seedIndentation,
        listMarker: seeds.seedListMarker,
        priority: result.priority,
        createdDate: result.createdDate,
        startDate: result.startDate,
        scheduledDate: result.scheduledDate,
        dueDate: result.dueDate,
        doneDate: result.doneDate,
        cancelledDate: result.cancelledDate,
        recurrence: result.recurrence,
        onCompletion: existing?.onCompletion ?? OnCompletion_1.OnCompletion.Ignore,
        dependsOn: blockedByWithIds.map((t) => t.id),
        id,
        blockLink: existing?.blockLink ?? '',
        tags: Task_1.Task.extractHashtags(result.description),
        originalMarkdown: '',
        scheduledDateIsInferred: false,
    });
    const today = inferTodaysDate(result.status.type, result.doneDate, result.cancelledDate);
    return updatedTask.handleNewStatusWithRecurrenceInUsersOrder(result.status, today);
}
//# sourceMappingURL=taskCommands.js.map