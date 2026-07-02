import moment from 'moment';
import { Task } from './core/Task/Task';
import { TasksQuery, QueryResult } from './core/Query/Query';
import { TaskIndex } from './TaskIndex';

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderTaskLine(task: Task): string {
    const checked = task.isDone ? ' checked' : '';
    const strike = task.isDone ? ' style="text-decoration: line-through; opacity: 0.6;"' : '';

    const badges: string[] = [];
    if (task.priorityName !== 'Normal') {
        badges.push(`<span class="tasks-badge tasks-priority">${escapeHtml(task.priorityName)}</span>`);
    }
    if (task.dueDate) {
        const overdue = !task.isDone && task.dueDate.isBefore(moment(), 'day');
        const style = overdue ? ' style="color: #e06c75; font-weight: bold;"' : '';
        badges.push(`<span class="tasks-badge tasks-due"${style}>📅 ${task.dueDate.format('YYYY-MM-DD')}</span>`);
    }
    if (task.isRecurring) {
        badges.push(`<span class="tasks-badge tasks-recurrence">🔁 ${escapeHtml(task.recurrenceRule)}</span>`);
    }

    const link = `<span class="tasks-source">${escapeHtml(task.path)}</span>`;

    return (
        `<li class="tasks-list-item">` +
        `<input type="checkbox" disabled${checked}> ` +
        `<span${strike}>${escapeHtml(task.descriptionWithoutTags)}</span> ` +
        badges.join(' ') +
        ` ${link}` +
        `</li>`
    );
}

function renderTaskGroup(tasks: Task[]): string {
    return `<ul class="tasks-list">${tasks.map(renderTaskLine).join('')}</ul>`;
}

function renderQueryResult(result: QueryResult): string {
    const parts: string[] = ['<div class="tasks-query-result">'];

    if (result.unrecognizedLines.length > 0) {
        parts.push(
            `<p class="tasks-query-warning">Tasks: could not understand ${result.unrecognizedLines.length} line(s) of this query: ` +
                `<code>${result.unrecognizedLines.map(escapeHtml).join('</code>, <code>')}</code></p>`,
        );
    }

    if (result.groups) {
        for (const group of result.groups) {
            parts.push(`<h4 class="tasks-group-heading">${escapeHtml(group.name)}</h4>`);
            parts.push(renderTaskGroup(group.tasks));
        }
    } else if (result.tasks.length > 0) {
        parts.push(renderTaskGroup(result.tasks));
    } else {
        parts.push('<p class="tasks-query-empty"><em>No tasks match this query.</em></p>');
    }

    parts.push('</div>');
    return parts.join('\n');
}

/**
 * Registers a markdown-it `fence` override that renders ```tasks``` code blocks by running
 * {@link TasksQuery} over the workspace's {@link TaskIndex}, the same way Obsidian Tasks'
 * `QueryRenderer` post-processes `tasks` code blocks in Obsidian's reading view. Wired up via
 * `contributes.markdown.markdownItPlugins` so it runs inside VS Code's built-in Markdown
 * Preview, with no dependency on Vault Tool's separate CodeMirror-based webview editor.
 */
export function registerTasksCodeBlock(md: any, getTaskIndex: () => TaskIndex | undefined): any {
    const defaultFenceRenderer =
        md.renderer.rules.fence ??
        ((tokens: any[], idx: number, options: any, _env: any, self: any) => self.renderToken(tokens, idx, options));

    md.renderer.rules.fence = (tokens: any[], idx: number, options: any, env: any, self: any) => {
        const token = tokens[idx];
        const info = (token.info || '').trim().toLowerCase();

        if (info !== 'tasks') {
            return defaultFenceRenderer(tokens, idx, options, env, self);
        }

        const taskIndex = getTaskIndex();
        if (!taskIndex) {
            return '<p class="tasks-query-warning">Tasks: the task index is not ready yet.</p>';
        }

        const query = new TasksQuery(token.content);
        const result = query.apply(taskIndex.getAllTasks());
        return renderQueryResult(result);
    };

    return md;
}
