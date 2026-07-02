import * as vscode from 'vscode';
import moment from 'moment';
import { Task } from '../core/Task/Task';
import { TaskLocation } from '../core/Task/TaskLocation';
import { TasksQuery } from '../core/Query/Query';
import type { TaskIndex } from '../TaskIndex';

/** Plain, JSON-serialisable summary of a {@link Task}, for consumers outside this extension. */
export interface TaskDTO {
    path: string;
    line: number;
    description: string;
    tags: string[];
    isDone: boolean;
    isOverdue: boolean;
    priority: string;
    dueDate: string | null;
    scheduledDate: string | null;
    startDate: string | null;
    isRecurring: boolean;
    recurrenceRule: string | null;
    heading: string | null;
}

export interface TasksQueryResultDTO {
    /** Populated when the query has no `group by` instruction. */
    items: TaskDTO[];
    /** Populated instead of `items` when the query has a `group by` instruction. */
    groups: Array<{ name: string; items: TaskDTO[] }> | null;
    /** Lines in the query that weren't understood — show these to the user, don't fail silently. */
    unrecognizedLines: string[];
}

/**
 * Public API this extension exposes to other extensions via `activate()`'s return value
 * (`vscode.extensions.getExtension('angelCastro.obsidian-like-tasks')?.exports`).
 *
 * This is the integration surface for Vault Tool (`angelCastro.vault-tool`): since two
 * extensions' webviews can't reach into each other, Vault Tool's *extension host* (not its
 * webview) calls this API instead of re-implementing the toggle/recurrence state machine or
 * the query language itself. Vault Tool should treat this as an optional soft dependency (check
 * `getExtension(...)` is defined before calling, and degrade gracefully if this extension isn't
 * installed) so it keeps working standalone.
 */
export interface TasksExtensionApi {
    /** Whether `lineText` is a recognised checkbox task line (any status symbol). */
    isTaskLine(lineText: string): boolean;

    /**
     * Toggle the task described by `lineText` to its next status, returning the replacement
     * line(s) to write back to the file — same content, no trailing newline.
     *
     * Returns exactly one line for a non-recurring task, or two lines `[next, toggled]` for a
     * recurring task that has just been completed (the new occurrence is written first, matching
     * this extension's own in-editor toggle behaviour). Returns `[lineText]` unchanged if the
     * line is not a recognised task.
     */
    toggleTaskLine(lineText: string): string[];

    /**
     * Run a ```tasks``` query (Obsidian Tasks syntax, e.g. `not done\nsort by due`) against
     * every task in the workspace, and return the result as plain data — not HTML — so the
     * caller can render it with its own styling. Empty/all-zero result if no workspace folder
     * is open or the task index hasn't finished its initial scan yet.
     */
    renderTasksQuery(queryText: string): TasksQueryResultDTO;

    /**
     * Toggle the task at `line` (0-based) in the file at `path` (workspace-relative), which may
     * be a *different* file than any currently open editor — needed because a rendered query's
     * results can come from anywhere in the vault. Opens the document, applies the toggle, and
     * saves the edit via `WorkspaceEdit`. No-op if the line isn't a recognised task or no
     * workspace folder is open.
     */
    toggleTaskAtLocation(path: string, line: number): Promise<void>;

    /**
     * Fires whenever any task anywhere in the workspace is added, removed, or edited (including
     * by this extension's own commands). Callers rendering a query's results should re-run
     * {@link renderTasksQuery} and redraw when this fires. Never fires if no workspace folder is
     * open (there is nothing to index).
     */
    onDidChangeTasks: vscode.Event<void>;
}

function toDto(task: Task): TaskDTO {
    return {
        path: task.path,
        line: task.lineNumber,
        description: task.descriptionWithoutTags,
        tags: task.tags,
        isDone: task.isDone,
        isOverdue: !task.isDone && task.dueDate !== null && task.dueDate.isBefore(moment(), 'day'),
        priority: task.priorityName,
        dueDate: task.dueDate ? task.dueDate.format('YYYY-MM-DD') : null,
        scheduledDate: task.scheduledDate ? task.scheduledDate.format('YYYY-MM-DD') : null,
        startDate: task.startDate ? task.startDate.format('YYYY-MM-DD') : null,
        isRecurring: task.isRecurring,
        recurrenceRule: task.isRecurring ? task.recurrenceRule : null,
        heading: task.heading,
    };
}

/**
 * @param onDidChangeTasks Must be a stable event (e.g. a module-level `EventEmitter`'s `.event`
 * created once, independent of whether `getTaskIndex()` yet returns a real `TaskIndex`) — the
 * returned object here gets spread into `extension.ts`'s `activate()` return value
 * (`{ ...createTasksApi(...) }`), and spreading an object evaluates getters immediately, once,
 * copying their *current* result as a plain value. A `get onDidChangeTasks()` computed from
 * `getTaskIndex()` at spread-time would permanently bake in whatever that returned at that
 * exact moment — `undefined`, if the index hasn't been created yet — silently breaking every
 * subscriber for the rest of the session. See the longer comment in `extension.ts`.
 */
export function createTasksApi(
    getTaskIndex: () => TaskIndex | undefined,
    onDidChangeTasks: vscode.Event<void>,
): TasksExtensionApi {
    return {
        isTaskLine(lineText: string): boolean {
            return Task.extractTaskComponents(lineText) !== null;
        },

        toggleTaskLine(lineText: string): string[] {
            const task = Task.fromLine({ line: lineText, taskLocation: TaskLocation.fromUnknownPosition('') });
            if (task === null) {
                return [lineText];
            }
            return task.toggleWithRecurrenceInUsersOrder().map((t) => t.toFileLineString());
        },

        renderTasksQuery(queryText: string): TasksQueryResultDTO {
            const taskIndex = getTaskIndex();
            if (!taskIndex) {
                return { items: [], groups: null, unrecognizedLines: [] };
            }

            const query = new TasksQuery(queryText);
            const result = query.apply(taskIndex.getAllTasks());

            return {
                items: result.groups ? [] : result.tasks.map(toDto),
                groups: result.groups ? result.groups.map((g) => ({ name: g.name, items: g.tasks.map(toDto) })) : null,
                unrecognizedLines: result.unrecognizedLines,
            };
        },

        async toggleTaskAtLocation(path: string, line: number): Promise<void> {
            const folder = vscode.workspace.workspaceFolders?.[0];
            if (!folder) {
                return;
            }

            const uri = vscode.Uri.joinPath(folder.uri, path);
            const document = await vscode.workspace.openTextDocument(uri);
            const lineText = document.lineAt(line).text;
            const task = Task.fromLine({ line: lineText, taskLocation: new TaskLocation(path, line) });
            if (task === null) {
                return;
            }

            const replacementLines = task.toggleWithRecurrenceInUsersOrder().map((t) => t.toFileLineString());
            const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

            const edit = new vscode.WorkspaceEdit();
            edit.replace(uri, document.lineAt(line).range, replacementLines.join(eol));
            await vscode.workspace.applyEdit(edit);
        },

        onDidChangeTasks,
    };
}
