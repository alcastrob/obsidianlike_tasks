import * as vscode from 'vscode';
import moment from 'moment';
import type { Moment } from 'moment';
import { Task } from '../core/Task/Task';
import { TaskLocation } from '../core/Task/TaskLocation';
import { Status } from '../core/Statuses/Status';
import { StatusRegistry } from '../core/Statuses/StatusRegistry';
import { StatusType } from '../core/Statuses/StatusConfiguration';
import { Priority } from '../core/Task/Priority';
import { OnCompletion } from '../core/Task/OnCompletion';
import { TaskRegularExpressions } from '../core/Task/TaskRegularExpressions';
import { ensureTaskHasId, generateUniqueId, addDependencyToParent, removeDependency } from '../core/Task/TaskDependency';
import { showTaskEditDialog } from '../TaskEditWebview';
import { dependencyKey } from '../DependencySearch';
import { replaceTaskWithTasks } from '../TaskFileEditor';

function relativePath(document: vscode.TextDocument): string {
    return vscode.workspace.asRelativePath(document.uri, false);
}

/** Used by CodeLens actions (explicit `(editor, line)`, no cursor involved). */
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
 * Parses `lineText` as a task (if it is one) and shows the "Create or edit Task" dialog seeded
 * from it, returning the resulting {@link Task}(s) — more than one only when completing a
 * recurring task through the Status field spawns its next occurrence, same as the toggle command —
 * or `undefined` if the user cancelled. Shared by every entry point that already has raw line text
 * in hand — the CodeLens' explicit-line command and {@link TasksApi.ts}'s `editTaskAtLocation`
 * (which gets `(path, line)` from Obsidian-like instead of a `vscode.TextEditor`, so it doesn't
 * have a `TaskLocation` computed via `relativePath()` the way the other one does — callers pass
 * one in).
 */
export async function editTaskFromLineText(
    lineText: string,
    taskLocation: TaskLocation,
    getAllTasks: () => Task[],
): Promise<Task[] | undefined> {
    const existing = Task.fromLine({ line: lineText, taskLocation });
    const nonTaskMatch = lineText.match(TaskRegularExpressions.nonTaskRegex);
    return promptForTaskFields(
        existing,
        taskLocation,
        {
            seedDescription: existing?.description ?? nonTaskMatch?.[5]?.trim() ?? lineText.trim(),
            seedIndentation: existing?.indentation ?? nonTaskMatch?.[1] ?? '',
            seedListMarker: existing?.listMarker ?? nonTaskMatch?.[2] ?? '-',
        },
        getAllTasks,
    );
}

/** Used by CodeLens actions (explicit `(editor, line)`, no cursor involved). */
export async function createOrEditTaskOnLine(
    editor: vscode.TextEditor,
    line: number,
    getAllTasks: () => Task[],
): Promise<void> {
    const lineText = editor.document.lineAt(line).text;
    const taskLocation = new TaskLocation(relativePath(editor.document), line);
    // The "Create or edit Task" dialog opens as its own tab beside this one and steals focus for
    // as long as it's open — restoring the viewport explicitly afterwards (Apply or Cancel) avoids
    // relying on VS Code to leave a background editor's scroll position untouched on its own.
    const visibleRange = editor.visibleRanges[0];
    const tasks = await editTaskFromLineText(lineText, taskLocation, getAllTasks);
    if (!tasks) {
        if (visibleRange) {
            editor.revealRange(visibleRange, vscode.TextEditorRevealType.AtTop);
        }
        return;
    }

    const replacement = tasks.map((t) => t.toFileLineString()).join('\n');
    await editor.edit((builder) => {
        builder.replace(editor.document.lineAt(line).range, replacement);
    });
    if (visibleRange) {
        editor.revealRange(visibleRange, vscode.TextEditorRevealType.AtTop);
    }
}

/**
 * If the user has manually edited the Done date or Cancelled date in the dialog, that value must
 * be used as "today" for the status-transition machinery in {@link Task.handleNewStatus}, instead
 * of the real current date — mirrors Obsidian Tasks' `EditableTask.inferTodaysDate`. Needed for a
 * task that already had a Done/Cancelled date before being edited, or whose date the user just
 * typed in alongside changing the Status dropdown.
 */
function inferTodaysDate(newStatusType: StatusType, doneDate: Moment | null, cancelledDate: Moment | null): Moment {
    if (newStatusType === StatusType.DONE && doneDate !== null) {
        return doneDate;
    }
    if (newStatusType === StatusType.CANCELLED && cancelledDate !== null) {
        return cancelledDate;
    }
    return moment();
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
async function promptForTaskFields(
    existing: Task | null,
    taskLocation: TaskLocation,
    seeds: { seedDescription: string; seedIndentation: string; seedListMarker: string },
    getAllTasks: () => Task[],
): Promise<Task[] | undefined> {
    const allTasks = getAllTasks();
    const currentId = existing?.id ?? '';
    const originalBlocking = currentId !== '' ? allTasks.filter((t) => t.dependsOn.includes(currentId)) : [];

    const result = await showTaskEditDialog(
        {
            description: seeds.seedDescription,
            priority: existing?.priority ?? Priority.None,
            recurrenceRuleText: existing?.recurrenceRule ?? '',
            dueDateText: existing?.dueDate ? existing.dueDate.format(TaskRegularExpressions.dateFormat) : '',
            scheduledDateText: existing?.scheduledDate
                ? existing.scheduledDate.format(TaskRegularExpressions.dateFormat)
                : '',
            // Only defaults to today for a brand-new task (`existing === null`) — editing an
            // existing task that genuinely has no start date leaves the field empty, same as
            // every other date field here.
            startDateText: existing
                ? existing.startDate
                    ? existing.startDate.format(TaskRegularExpressions.dateFormat)
                    : ''
                : moment().format(TaskRegularExpressions.dateFormat),
            statusSymbol: existing?.status.symbol ?? Status.TODO.symbol,
            createdDateText: existing?.createdDate ? existing.createdDate.format(TaskRegularExpressions.dateFormat) : '',
            doneDateText: existing?.doneDate ? existing.doneDate.format(TaskRegularExpressions.dateFormat) : '',
            cancelledDateText: existing?.cancelledDate
                ? existing.cancelledDate.format(TaskRegularExpressions.dateFormat)
                : '',
        },
        existing !== null,
        { existingTask: existing, allTasks, taskLocation },
    );
    if (!result) {
        return undefined;
    }

    // "Before this": this task depends on each selected task, which must have an id to be
    // referenced — generate one and write it back to that task's file if it doesn't have one yet.
    const blockedByWithIds: Task[] = [];
    for (const depTask of result.blockedBy) {
        if (depTask.id !== '') {
            blockedByWithIds.push(depTask);
            continue;
        }
        const idsInUse = allTasks.filter((t) => t.id !== '').map((t) => t.id);
        const withId = ensureTaskHasId(depTask, idsInUse);
        await replaceTaskWithTasks(depTask, [withId]);
        blockedByWithIds.push(withId);
    }

    // "After this": each selected task must depend on *this* task, which needs its own id for
    // that — generate one (if this task doesn't already have it) only when the set of "blocking"
    // tasks actually changed.
    const keyOf = dependencyKey;
    const originalBlockingKeys = new Set(originalBlocking.map(keyOf));
    const newBlockingKeys = new Set(result.blocking.map(keyOf));
    const removedBlocking = originalBlocking.filter((t) => !newBlockingKeys.has(keyOf(t)));
    const addedBlocking = result.blocking.filter((t) => !originalBlockingKeys.has(keyOf(t)));

    let id = currentId;
    if (id === '' && (removedBlocking.length > 0 || addedBlocking.length > 0)) {
        const idsInUse = allTasks.filter((t) => t.id !== '').map((t) => t.id);
        id = generateUniqueId(idsInUse);
    }

    for (const blockingTask of removedBlocking) {
        await replaceTaskWithTasks(blockingTask, [removeDependency(blockingTask, { id })]);
    }
    for (const blockingTask of addedBlocking) {
        await replaceTaskWithTasks(blockingTask, [addDependencyToParent(blockingTask, { id })]);
    }

    // Build the task with every edit except the Status transition itself, then hand it to
    // `handleNewStatusWithRecurrenceInUsersOrder` so a completed recurring task also gets its next
    // occurrence — exactly the order Obsidian Tasks' `EditableTask.applyEdits` uses.
    const updatedTask = new Task({
        status: existing?.status ?? Status.TODO,
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
        onCompletion: existing?.onCompletion ?? OnCompletion.Ignore,
        dependsOn: blockedByWithIds.map((t) => t.id),
        id,
        blockLink: existing?.blockLink ?? '',
        tags: Task.extractHashtags(result.description),
        originalMarkdown: '',
        scheduledDateIsInferred: false,
    });

    const today = inferTodaysDate(result.status.type, result.doneDate, result.cancelledDate);
    return updatedTask.handleNewStatusWithRecurrenceInUsersOrder(result.status, today);
}
