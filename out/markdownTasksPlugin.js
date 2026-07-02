"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTasksCodeBlock = registerTasksCodeBlock;
const moment_1 = __importDefault(require("moment"));
const Query_1 = require("./core/Query/Query");
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function renderTaskLine(task) {
    const checked = task.isDone ? ' checked' : '';
    const strike = task.isDone ? ' style="text-decoration: line-through; opacity: 0.6;"' : '';
    const badges = [];
    if (task.priorityName !== 'Normal') {
        badges.push(`<span class="tasks-badge tasks-priority">${escapeHtml(task.priorityName)}</span>`);
    }
    if (task.dueDate) {
        const overdue = !task.isDone && task.dueDate.isBefore((0, moment_1.default)(), 'day');
        const style = overdue ? ' style="color: #e06c75; font-weight: bold;"' : '';
        badges.push(`<span class="tasks-badge tasks-due"${style}>📅 ${task.dueDate.format('YYYY-MM-DD')}</span>`);
    }
    if (task.isRecurring) {
        badges.push(`<span class="tasks-badge tasks-recurrence">🔁 ${escapeHtml(task.recurrenceRule)}</span>`);
    }
    const link = `<span class="tasks-source">${escapeHtml(task.path)}</span>`;
    return (`<li class="tasks-list-item">` +
        `<input type="checkbox" disabled${checked}> ` +
        `<span${strike}>${escapeHtml(task.descriptionWithoutTags)}</span> ` +
        badges.join(' ') +
        ` ${link}` +
        `</li>`);
}
function renderTaskGroup(tasks) {
    return `<ul class="tasks-list">${tasks.map(renderTaskLine).join('')}</ul>`;
}
function renderQueryResult(result) {
    const parts = ['<div class="tasks-query-result">'];
    if (result.unrecognizedLines.length > 0) {
        parts.push(`<p class="tasks-query-warning">Tasks: could not understand ${result.unrecognizedLines.length} line(s) of this query: ` +
            `<code>${result.unrecognizedLines.map(escapeHtml).join('</code>, <code>')}</code></p>`);
    }
    if (result.groups) {
        for (const group of result.groups) {
            parts.push(`<h4 class="tasks-group-heading">${escapeHtml(group.name)}</h4>`);
            parts.push(renderTaskGroup(group.tasks));
        }
    }
    else if (result.tasks.length > 0) {
        parts.push(renderTaskGroup(result.tasks));
    }
    else {
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
function registerTasksCodeBlock(md, getTaskIndex) {
    const defaultFenceRenderer = md.renderer.rules.fence ??
        ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const info = (token.info || '').trim().toLowerCase();
        if (info !== 'tasks') {
            return defaultFenceRenderer(tokens, idx, options, env, self);
        }
        const taskIndex = getTaskIndex();
        if (!taskIndex) {
            return '<p class="tasks-query-warning">Tasks: the task index is not ready yet.</p>';
        }
        const query = new Query_1.TasksQuery(token.content);
        const result = query.apply(taskIndex.getAllTasks());
        return renderQueryResult(result);
    };
    return md;
}
//# sourceMappingURL=markdownTasksPlugin.js.map