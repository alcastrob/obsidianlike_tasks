import * as vscode from 'vscode';
import moment from 'moment';
import { Task } from '../core/Task/Task';
import { TaskLocation } from '../core/Task/TaskLocation';
import { TasksQuery } from '../core/Query/Query';
import { editTaskFromLineText } from '../commands/taskCommands';
import type { TaskIndex } from '../TaskIndex';

/** Resolved info for one entry of `TaskDTO.dependsOn` — enough for a consumer to show a preview
 * of the referenced task (e.g. a hover popup) without a second round-trip. */
export interface DependencyRefDTO {
    id: string;
    description: string;
    path: string;
    line: number;
    isDone: boolean;
    statusSymbol: string;
}

/** Plain, JSON-serialisable summary of a {@link Task}, for consumers outside this extension. */
export interface TaskDTO {
    path: string;
    line: number;
    description: string;
    tags: string[];
    /** Empty string if the task has no `🆔` id. */
    id: string;
    /** Ids of tasks this one depends on (`⛔`) — empty if none. */
    dependsOn: string[];
    /** Resolved entries for `dependsOn`, in no particular order and possibly shorter than
     * `dependsOn` — an id with no matching task anywhere in the workspace (stale after the
     * referenced task's `🆔` was removed or changed) simply has no entry here. Resolved against
     * *every* task in the workspace, not just this query's own results, since a dependency can
     * point at a task this particular query filtered out. */
    dependsOnTasks: DependencyRefDTO[];
    /** Tasks elsewhere in the workspace that depend on *this* one (i.e. every task whose own
     * `dependsOn` includes this task's `id`) — the inverse of `dependsOnTasks`, computed the same
     * way "After this" is computed for `TaskEditWebview.ts`'s dependency fields. Empty if this
     * task has no `id` (nothing else could reference it) or nothing does yet. */
    blocking: DependencyRefDTO[];
    isDone: boolean;
    /** The raw checkbox symbol (`' '`, `'x'`, `'/'`, a custom letter, ...) — `isDone` alone can't
     * distinguish "in progress" from "todo" from "some custom status", which a consumer needs to
     * render a matching status icon instead of a plain checked/unchecked checkbox. */
    statusSymbol: string;
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
    /** `zoom factor <N>%` query line — see {@link QueryResult.zoomFactor} in core/Query/Query.ts.
     * `100` (normal size) when the query didn't specify one. A consumer rendering this listing
     * should scale it by this percentage (e.g. CSS `zoom`), the same way this extension's own
     * Markdown Preview renderer does. */
    zoomFactor: number;
}

/**
 * Public API this extension exposes to other extensions via `activate()`'s return value
 * (`vscode.extensions.getExtension('angelCastro.obsidian-like-tasks')?.exports`).
 *
 * This is the integration surface for Obsidian-like (`angelCastro.obsidian-like`): since two
 * extensions' webviews can't reach into each other, Obsidian-like's *extension host* (not its
 * webview) calls this API instead of re-implementing the toggle/recurrence state machine or
 * the query language itself. Obsidian-like should treat this as an optional soft dependency (check
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
     *
     * @param queryFilePath Workspace-relative path of the note containing this query block, if
     * the caller knows it — expands `{{query.file.path}}` in the query text (see
     * {@link TasksQuery}'s constructor). Optional so this still works for a caller that doesn't
     * track which file a query came from; the placeholder then just isn't expanded.
     */
    renderTasksQuery(queryText: string, queryFilePath?: string): TasksQueryResultDTO;

    /**
     * Toggle the task at `line` (0-based) in the file at `path` (workspace-relative), which may
     * be a *different* file than any currently open editor — needed because a rendered query's
     * results can come from anywhere in the vault. Opens the document, applies the toggle, and
     * saves the edit via `WorkspaceEdit`. No-op if the line isn't a recognised task or no
     * workspace folder is open.
     */
    toggleTaskAtLocation(path: string, line: number): Promise<void>;

    /**
     * Shows the "Create or edit Task" dialog for the task at `line` (0-based) in the file at
     * `path` (workspace-relative), pre-filled from that line, and applies the result via
     * `WorkspaceEdit` once the user clicks Apply (no-op if they cancel).
     *
     * This exists specifically for callers like Obsidian-like: this extension's own
     * cursor-based `tasksManager.createOrEditTask` command has no way to know which line the
     * user meant when the active tab is showing the file through *another* extension's custom
     * editor (VS Code doesn't expose cursor position for those) — it falls back to appending a
     * brand-new task instead, which is not what "edit this task" means. Obsidian-like's webview,
     * on the other hand, always knows exactly which task the user clicked, the same way it
     * already knows enough to call `toggleTaskAtLocation` — so it should call this instead of
     * (or via) the command palette action when the user asks to edit a specific task.
     *
     * If the line isn't a recognised task, the dialog opens in "create" mode seeded with that
     * line's text, mirroring this extension's own `createOrEditTaskOnLine`. No-op if the user
     * cancels, or if no workspace folder is open.
     */
    editTaskAtLocation(path: string, line: number): Promise<void>;

    /**
     * Fires whenever any task anywhere in the workspace is added, removed, or edited (including
     * by this extension's own commands). Callers rendering a query's results should re-run
     * {@link renderTasksQuery} and redraw when this fires. Never fires if no workspace folder is
     * open (there is nothing to index).
     */
    onDidChangeTasks: vscode.Event<void>;
}

function toDependencyRefDTO(t: Task): DependencyRefDTO {
    return {
        id: t.id,
        description: t.description,
        path: t.path,
        line: t.lineNumber,
        isDone: t.isDone,
        statusSymbol: t.status.symbol,
    };
}

function toDto(task: Task, tasksById: Map<string, Task>, blockingById: Map<string, Task[]>): TaskDTO {
    return {
        path: task.path,
        line: task.lineNumber,
        // Keeps `#tags` in place (unlike `descriptionWithoutTags`) — a consumer rendering this
        // should show a tag exactly where it appears in the task's own text, not strip it out and
        // re-append it elsewhere. `tags` (below) is still sent separately for a consumer that
        // wants the parsed list without needing to re-extract it from the description text.
        description: task.description,
        tags: task.tags,
        id: task.id,
        dependsOn: task.dependsOn,
        dependsOnTasks: task.dependsOn
            .map((id) => tasksById.get(id))
            .filter((t): t is Task => t !== undefined)
            .map(toDependencyRefDTO),
        blocking: (task.id ? blockingById.get(task.id) : undefined)?.map(toDependencyRefDTO) ?? [],
        isDone: task.isDone,
        statusSymbol: task.status.symbol,
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

        renderTasksQuery(queryText: string, queryFilePath?: string): TasksQueryResultDTO {
            const taskIndex = getTaskIndex();
            if (!taskIndex) {
                return { items: [], groups: null, unrecognizedLines: [], zoomFactor: 100 };
            }

            const allTasks = taskIndex.getAllTasks();
            const tasksById = new Map<string, Task>();
            // Inverse of `tasksById`/`dependsOn`: for each id, every task elsewhere that declares
            // a dependency *on* it — built once per query (not per task) so resolving `blocking`
            // for every task in the result stays O(vault size) instead of O(vault size squared).
            const blockingById = new Map<string, Task[]>();
            for (const t of allTasks) {
                if (t.id) {
                    tasksById.set(t.id, t);
                }
                for (const dependsOnId of t.dependsOn) {
                    const list = blockingById.get(dependsOnId);
                    if (list) {
                        list.push(t);
                    } else {
                        blockingById.set(dependsOnId, [t]);
                    }
                }
            }

            const query = new TasksQuery(queryText, queryFilePath);
            const result = query.apply(allTasks);
            const dto = (t: Task) => toDto(t, tasksById, blockingById);

            return {
                items: result.groups ? [] : result.tasks.map(dto),
                groups: result.groups ? result.groups.map((g) => ({ name: g.name, items: g.tasks.map(dto) })) : null,
                unrecognizedLines: result.unrecognizedLines,
                zoomFactor: result.zoomFactor,
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

        async editTaskAtLocation(path: string, line: number): Promise<void> {
            const folder = vscode.workspace.workspaceFolders?.[0];
            if (!folder) {
                return;
            }

            const uri = vscode.Uri.joinPath(folder.uri, path);
            const document = await vscode.workspace.openTextDocument(uri);
            const lineText = document.lineAt(line).text;
            const tasks = await editTaskFromLineText(lineText, new TaskLocation(path, line), () =>
                getTaskIndex()?.getAllTasks() ?? [],
            );
            if (!tasks) {
                return;
            }

            const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
            const edit = new vscode.WorkspaceEdit();
            edit.replace(uri, document.lineAt(line).range, tasks.map((t) => t.toFileLineString()).join(eol));
            await vscode.workspace.applyEdit(edit);
        },

        onDidChangeTasks,
    };
}
