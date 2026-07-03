import * as vscode from 'vscode';
import { Task } from '../core/Task/Task';
import { TaskLocation } from '../core/Task/TaskLocation';
import { Status } from '../core/Statuses/Status';
import { StatusRegistry } from '../core/Statuses/StatusRegistry';
import { Priority } from '../core/Task/Priority';
import { OnCompletion } from '../core/Task/OnCompletion';
import { TaskRegularExpressions } from '../core/Task/TaskRegularExpressions';
import { showTaskEditDialog } from '../TaskEditWebview';

function relativePath(document: vscode.TextDocument): string {
    return vscode.workspace.asRelativePath(document.uri, false);
}

interface MarkdownTarget {
    document: vscode.TextDocument;
    /** Present only when the document is open in VS Code's native text editor — absent when
     * the active tab is showing it through a custom editor (e.g. Obsidian-like's CM6 webview),
     * which VS Code does not expose as a `TextEditor`, so no cursor position is known. */
    editor?: vscode.TextEditor;
}

function getActiveMarkdownTabUri(): vscode.Uri | undefined {
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
async function resolveActiveMarkdownTarget(): Promise<MarkdownTarget | undefined> {
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
export async function toggleTaskAtCursor(): Promise<void> {
    const target = await resolveActiveMarkdownTarget();
    if (!target?.editor) {
        void vscode.window.showInformationMessage(
            'Tasks: no hay una posición de cursor conocida (el archivo está abierto con un editor personalizado). Usa el checkbox de ese editor, o ábrelo con "Open With → Text Editor".',
        );
        return;
    }
    await toggleTaskOnLine(target.editor, target.editor.selection.active.line);
}

/** Same as {@link toggleTaskAtCursor}, but for an explicit line — used by CodeLens actions. */
export async function toggleTaskOnLine(editor: vscode.TextEditor, line: number): Promise<void> {
    const lineText = editor.document.lineAt(line).text;
    const taskLocation = new TaskLocation(relativePath(editor.document), line);
    const task = Task.fromLine({ line: lineText, taskLocation });

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
 */
export async function createOrEditTaskAtCursor(): Promise<void> {
    const target = await resolveActiveMarkdownTarget();
    if (!target) {
        void vscode.window.showInformationMessage('Tasks: open a markdown file first.');
        return;
    }

    if (target.editor) {
        await createOrEditTaskOnLine(target.editor, target.editor.selection.active.line);
        return;
    }

    void vscode.window.showInformationMessage(
        'Tasks: no hay una posición de cursor conocida (el archivo está abierto con un editor personalizado). Se creará una tarea nueva al final del documento — para editar una tarea existente, ábrela con "Open With → Text Editor" o usa el botón "Edit" de esa tarea si el editor personalizado lo ofrece.',
    );
    await createTaskAppendedToDocument(target.document);
}

/**
 * Parses `lineText` as a task (if it is one) and shows the "Create or edit Task" dialog seeded
 * from it, returning the resulting {@link Task} or `undefined` if the user cancelled. Shared by
 * every entry point that already has raw line text in hand — the cursor-based command, the
 * CodeLens' explicit-line command, and {@link TasksApi.ts}'s `editTaskAtLocation` (which gets
 * `(path, line)` from Obsidian-like instead of a `vscode.TextEditor`, so it doesn't have a
 * `TaskLocation` computed via `relativePath()` the way the other two do — callers pass one in).
 */
export async function editTaskFromLineText(lineText: string, taskLocation: TaskLocation): Promise<Task | undefined> {
    const existing = Task.fromLine({ line: lineText, taskLocation });
    const nonTaskMatch = lineText.match(TaskRegularExpressions.nonTaskRegex);
    return promptForTaskFields(existing, taskLocation, {
        seedDescription: existing?.description ?? nonTaskMatch?.[5]?.trim() ?? lineText.trim(),
        seedIndentation: existing?.indentation ?? nonTaskMatch?.[1] ?? '',
        seedListMarker: existing?.listMarker ?? nonTaskMatch?.[2] ?? '-',
    });
}

/** Same as {@link createOrEditTaskAtCursor}, but for an explicit line — used by CodeLens actions. */
export async function createOrEditTaskOnLine(editor: vscode.TextEditor, line: number): Promise<void> {
    const lineText = editor.document.lineAt(line).text;
    const taskLocation = new TaskLocation(relativePath(editor.document), line);
    const task = await editTaskFromLineText(lineText, taskLocation);
    if (!task) {
        return;
    }

    await editor.edit((builder) => {
        builder.replace(editor.document.lineAt(line).range, task.toFileLineString());
    });
}

/** Prompts for a brand-new task and appends it as a new line at the end of `document`. */
async function createTaskAppendedToDocument(document: vscode.TextDocument): Promise<void> {
    const taskLocation = new TaskLocation(relativePath(document), document.lineCount);
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
 * Shows the "Create or edit Task" webview dialog and returns the resulting {@link Task}, or
 * `undefined` if the user cancelled. All field validation (dates, recurrence) happens inside
 * {@link showTaskEditDialog} itself, so the values here are already fully parsed.
 */
async function promptForTaskFields(
    existing: Task | null,
    taskLocation: TaskLocation,
    seeds: { seedDescription: string; seedIndentation: string; seedListMarker: string },
): Promise<Task | undefined> {
    const result = await showTaskEditDialog(
        {
            description: seeds.seedDescription,
            priority: existing?.priority ?? Priority.None,
            recurrenceRuleText: existing?.recurrenceRule ?? '',
            dueDateText: existing?.dueDate ? existing.dueDate.format(TaskRegularExpressions.dateFormat) : '',
            scheduledDateText: existing?.scheduledDate
                ? existing.scheduledDate.format(TaskRegularExpressions.dateFormat)
                : '',
            startDateText: existing?.startDate ? existing.startDate.format(TaskRegularExpressions.dateFormat) : '',
        },
        existing !== null,
    );
    if (!result) {
        return undefined;
    }

    const status = existing?.status ?? StatusRegistry.getInstance().bySymbolOrCreate(Status.TODO.symbol);

    return new Task({
        status,
        description: result.description,
        taskLocation,
        indentation: seeds.seedIndentation,
        listMarker: seeds.seedListMarker,
        priority: result.priority,
        createdDate: existing?.createdDate ?? null,
        startDate: result.startDate,
        scheduledDate: result.scheduledDate,
        dueDate: result.dueDate,
        doneDate: existing?.doneDate ?? null,
        cancelledDate: existing?.cancelledDate ?? null,
        recurrence: result.recurrence,
        onCompletion: existing?.onCompletion ?? OnCompletion.Ignore,
        dependsOn: existing?.dependsOn ?? [],
        id: existing?.id ?? '',
        blockLink: existing?.blockLink ?? '',
        tags: Task.extractHashtags(result.description),
        originalMarkdown: '',
        scheduledDateIsInferred: false,
    });
}
