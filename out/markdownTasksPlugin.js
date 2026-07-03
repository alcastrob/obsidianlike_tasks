"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTasksCodeBlock = registerTasksCodeBlock;
const moment_1 = __importDefault(require("moment"));
const Query_1 = require("./core/Query/Query");
const TaskRegularExpressions_1 = require("./core/Task/TaskRegularExpressions");
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
 * Preview, with no dependency on Obsidian-like's separate CodeMirror-based webview editor.
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
    registerRawTaskLineStyling(md);
    return md;
}
// ---- rich styling for plain (non-```tasks```) checkbox lines ----------------------------------
//
// Obsidian's Tasks plugin doesn't only render ```tasks``` query blocks specially — in Obsidian's
// reading view it *also* post-processes every ordinary `- [ ] ...` checkbox line anywhere in a
// note, giving each status symbol (not just space/x) a distinct icon and colouring `#tags` as
// pills. VS Code's built-in Markdown Preview has its own native checkbox rendering (a real
// `<input type="checkbox">`, unrelated to this extension), but it only distinguishes "checked" vs
// "unchecked" — a custom symbol like `[/]` (in progress) or `[w]` (a user-defined status) collapses
// to the same binary state as `[ ]`/`[x]`, and the original character is gone by the time the HTML
// exists, so nothing can recover it from the rendered DOM afterwards.
//
// The only reliable point to intercept is the raw markdown source, before VS Code's own checkbox
// handling (whatever inline rule implements it) ever sees the `[x]` bracket. So this rewrites the
// checkbox bracket of any non-`[ ]`/`[x]`/`[X]` task line into an inert placeholder *before*
// markdown-it tokenises anything (a `core` rule inserted right after `normalize`, i.e. before
// `block`/`inline` parsing), then swaps the placeholder for real HTML in a final pass over the
// fully rendered string (`renderer.render`/`renderInline`). `[ ]` and `[x]`/`[X]` are left
// untouched — VS Code's native checkbox already renders those two correctly.
// Private-Use-Area characters: inert to markdown-it (never trigger any markdown syntax), so they
// survive verbatim through inline tokenisation and HTML escaping as plain text, ready to be
// swapped for real markup once the final HTML string exists.
const ICON_MARKER_OPEN = '';
const ICON_MARKER_CLOSE = '';
const CANCELLED_STRIKE_OPEN = '';
const CANCELLED_STRIKE_CLOSE = '';
/** Obsidian-Tasks-community-convention icons for statuses beyond the core `[ ]`/`[x]`. `/` and
 * `-` are the upstream defaults (in-progress / cancelled); `w`/`d` match the "En espera"/
 * "Delegada" convention this port's own `Pruebas.md`-style vaults document under a "Notas
 * adicionales" section. Anything else falls back to a small badge showing the raw symbol, rather
 * than guessing a meaning for a status this extension has no settings UI to register (see
 * CLAUDE.md's "Config/Settings.ts es un stub" gotcha). */
const STATUS_ICON_EMOJI = {
    '/': '🔄',
    '-': '❌',
    w: '⏸️',
    d: '👤',
};
function renderStatusIconHtml(symbol) {
    const emoji = STATUS_ICON_EMOJI[symbol];
    if (emoji) {
        return `<span class="tasks-status-icon" title="${escapeHtml(symbol)}">${emoji}</span>`;
    }
    return `<span class="tasks-status-icon tasks-status-icon-unknown" title="${escapeHtml(symbol)}">${escapeHtml(symbol)}</span>`;
}
/** Rewrites a single line's `[symbol]` checkbox into an inert placeholder, if it has a non-default
 * status. Returns the line unchanged for `[ ]`/`[x]`/`[X]`, or any line that isn't a checkbox line
 * at all (matching {@link TaskRegularExpressions.taskRegex} the same way the rest of this port's
 * parser does, so this stays in sync with what `Task.fromLine` itself treats as a task). */
function rewriteTaskCheckboxLine(line) {
    const match = TaskRegularExpressions_1.TaskRegularExpressions.taskRegex.exec(line);
    if (!match) {
        return line;
    }
    const indentation = match[1];
    const marker = match[2];
    const symbol = match[3];
    if (symbol === ' ' || symbol === 'x' || symbol === 'X') {
        return line;
    }
    const prefixEnd = indentation.length + marker.length;
    const bracketOpen = line.indexOf('[', prefixEnd);
    if (bracketOpen === -1) {
        return line;
    }
    const bracketClose = bracketOpen + 1 + symbol.length + 1;
    const iconPlaceholder = `${ICON_MARKER_OPEN}${encodeURIComponent(symbol)}${ICON_MARKER_CLOSE}`;
    const before = line.slice(0, bracketOpen);
    const after = line.slice(bracketClose);
    // Cancelled tasks are struck through like done tasks, but VS Code's native checkbox no longer
    // sees a recognisable `[x]` on this line (we just replaced it), so nothing will strike the
    // description through automatically — wrap the rest of the line ourselves.
    if (symbol === '-') {
        return `${before}${iconPlaceholder}${CANCELLED_STRIKE_OPEN}${after}${CANCELLED_STRIKE_CLOSE}`;
    }
    return `${before}${iconPlaceholder}${after}`;
}
/** Rewrites checkbox lines document-wide, skipping fenced code blocks (```tasks``` query blocks
 * included) so their raw content is never mistaken for a real task line. Deliberately approximate
 * fence detection (doesn't handle every CommonMark edge case, e.g. fences inside blockquotes) —
 * good enough to avoid corrupting code samples that happen to contain a `- [ ]` line. */
function rewriteRawTaskLines(src) {
    const lines = src.split('\n');
    let inFence = false;
    let fenceChar = '';
    let fenceLen = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const fenceMatch = /^ {0,3}(`{3,}|~{3,}) *$/.exec(line) ?? /^ {0,3}(`{3,}|~{3,})/.exec(line);
        if (!inFence && fenceMatch) {
            inFence = true;
            fenceChar = fenceMatch[1][0];
            fenceLen = fenceMatch[1].length;
            continue;
        }
        if (inFence) {
            if (fenceMatch && fenceMatch[1][0] === fenceChar && fenceMatch[1].length >= fenceLen) {
                inFence = false;
            }
            continue;
        }
        lines[i] = rewriteTaskCheckboxLine(line);
    }
    return lines.join('\n');
}
function decodeIconAndStrikeMarkers(html) {
    return html
        .split(ICON_MARKER_OPEN)
        .map((chunk, i) => {
        if (i === 0)
            return chunk;
        const closeIdx = chunk.indexOf(ICON_MARKER_CLOSE);
        if (closeIdx === -1)
            return ICON_MARKER_OPEN + chunk;
        const symbol = decodeURIComponent(chunk.slice(0, closeIdx));
        return renderStatusIconHtml(symbol) + chunk.slice(closeIdx + ICON_MARKER_CLOSE.length);
    })
        .join('')
        .split(CANCELLED_STRIKE_OPEN)
        .join('<span class="tasks-cancelled-text">')
        .split(CANCELLED_STRIKE_CLOSE)
        .join('</span>');
}
/** Deterministic text -> hue mapping (0-359) so distinct `#tags` get distinct, stable pill
 * colours, mirroring Obsidian's own per-tag colouring without needing to reproduce whatever
 * theme/plugin picked its exact palette. */
function hashHue(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash % 360;
}
const TAG_CONTENT_REGEX = /^#[^ !@#$%^&*(),.?":{}|<>]+/u;
/** Matches the same `#tag` shape as {@link TaskRegularExpressions.hashTags} (must start at the
 * beginning of the line or be preceded by whitespace), but as a markdown-it inline rule instead
 * of a whole-description regex, so it can run inside the normal tokeniser and safely leave `#`
 * characters inside code spans, links, and `[[wikilinks]]` alone — those are already consumed by
 * earlier rules (backticks/link/autolink, or VS Code's own built-in wikilink handling) before our
 * rule ever gets a turn at that position. Registered globally (not just on task lines), matching
 * Obsidian's own core tag-pill styling, which applies to every note, not just ```tasks``` vaults. */
function tagInlineRule(state, silent) {
    const pos = state.pos;
    if (state.src.charCodeAt(pos) !== 0x23 /* # */) {
        return false;
    }
    if (pos > 0 && !/\s/.test(state.src[pos - 1])) {
        return false;
    }
    const match = TAG_CONTENT_REGEX.exec(state.src.slice(pos));
    if (!match) {
        return false;
    }
    if (!silent) {
        const token = state.push('obsidian_tag', '', 0);
        token.content = match[0];
    }
    state.pos += match[0].length;
    return true;
}
/** Registers the raw-checkbox-line and `#tag` styling described above on `md`. Idempotent per
 * `md` instance — VS Code may hand the same instance to `extendMarkdownIt` more than once, and
 * markdown-it's `ruler.before()` throws on a duplicate rule name rather than silently no-op-ing. */
function registerRawTaskLineStyling(md) {
    if (md.__obsidianLikeTasksRawLineStylingRegistered) {
        return;
    }
    md.__obsidianLikeTasksRawLineStylingRegistered = true;
    md.core.ruler.after('normalize', 'obsidian_tasks_checkbox_prepass', (state) => {
        state.src = rewriteRawTaskLines(state.src);
        return false;
    });
    md.inline.ruler.before('text', 'obsidian_tasks_tag', tagInlineRule);
    md.renderer.rules.obsidian_tag = (tokens, idx) => {
        const tag = tokens[idx].content;
        const hue = hashHue(tag);
        return `<span class="tasks-tag" style="--tasks-tag-hue:${hue}">${escapeHtml(tag)}</span>`;
    };
    const originalRender = md.renderer.render.bind(md.renderer);
    md.renderer.render = (tokens, options, env) => decodeIconAndStrikeMarkers(originalRender(tokens, options, env));
    const originalRenderInline = md.renderer.renderInline.bind(md.renderer);
    md.renderer.renderInline = (tokens, options, env) => decodeIconAndStrikeMarkers(originalRenderInline(tokens, options, env));
}
//# sourceMappingURL=markdownTasksPlugin.js.map