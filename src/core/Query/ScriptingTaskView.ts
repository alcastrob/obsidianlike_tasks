import type { Task } from '../Task/Task';
import { TasksDate } from './TasksDate';

/**
 * The object exposed as `task` inside `filter by function` / `group by function` scripting
 * expressions (Obsidian Tasks' `Scripting/` feature). This is a deliberate, documented use of
 * `new Function(...)` to evaluate arbitrary JavaScript written by the user in their own vault —
 * the same approach the original plugin uses. It is only ever run against local files already
 * open in the user's own workspace, not against untrusted network input, but it's worth being
 * explicit that a `tasks` query block can execute arbitrary code: a vault synced in from
 * somewhere untrusted could, in principle, run code just by being opened.
 */
export function createScriptingTaskView(task: Task) {
    return {
        description: task.description,
        descriptionWithoutTags: task.descriptionWithoutTags,
        tags: task.tags,
        status: {
            name: task.status.name,
            type: task.status.type,
            symbol: task.status.symbol,
        },
        priority: task.priorityName,
        priorityNumber: task.priorityNumber,
        due: new TasksDate(task.dueDate),
        scheduled: new TasksDate(task.scheduledDate),
        start: new TasksDate(task.startDate),
        done: new TasksDate(task.doneDate),
        created: new TasksDate(task.createdDate),
        cancelled: new TasksDate(task.cancelledDate),
        happens: new TasksDate(task.happens),
        isDone: task.isDone,
        isRecurring: task.isRecurring,
        recurrenceRule: task.recurrenceRule,
        path: task.path,
        heading: task.heading,
        lineNumber: task.lineNumber,
        originalMarkdown: task.originalMarkdown,
    };
}

export type ScriptingTaskView = ReturnType<typeof createScriptingTaskView>;
