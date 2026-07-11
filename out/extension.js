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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const taskCommands_1 = require("./commands/taskCommands");
const TaskCodeLensProvider_1 = require("./TaskCodeLensProvider");
const TaskDecorations_1 = require("./TaskDecorations");
const TaskIndex_1 = require("./TaskIndex");
const markdownTasksPlugin_1 = require("./markdownTasksPlugin");
const TasksApi_1 = require("./api/TasksApi");
// Module-level so `extendMarkdownIt` (called by VS Code's built-in Markdown extension, via the
// object returned from `activate()`) can reach the same task index `activate()` builds.
let taskIndex;
// Created once at module scope, *not* inside activate() at the point `taskIndex` is created.
//
// This matters because of a subtle interaction between object spread and getters: `createTasksApi`
// used to expose `onDidChangeTasks` as `get onDidChangeTasks() { return taskIndex?.onDidChange ?? ... }`,
// and `activate()` builds its returned API object via `{ ...createTasksApi(...) }`. Spreading an
// object evaluates every getter *immediately, once*, and copies the resulting value as a plain
// property — it does not preserve the getter. Since that spread happens before `taskIndex` is
// assigned below, the getter always saw `taskIndex === undefined` and baked in a brand new, never
// -fired, orphaned `EventEmitter`'s `.event` as a permanent dead end: every external subscriber
// (e.g. Obsidian-like) successfully "subscribed", just to an emitter nothing would ever fire.
//
// The fix: `onDidChangeTasks` must be a stable value that exists *before* the spread happens, not
// a getter computed from `taskIndex` at spread-time. This emitter is that stable value — created
// unconditionally at module load, and relayed-into once `taskIndex` itself exists (see below).
const tasksChangedEmitter = new vscode.EventEmitter();
async function activate(context) {
    const extensionApi = {
        extendMarkdownIt: (md) => (0, markdownTasksPlugin_1.registerTasksCodeBlock)(md, () => taskIndex),
        ...(0, TasksApi_1.createTasksApi)(() => taskIndex, tasksChangedEmitter.event),
    };
    // These only need the currently open document — no workspace folder required, so they work
    // even when a single .md file is opened directly (File > Open File) rather than a folder.
    context.subscriptions.push(vscode.commands.registerCommand('tasksManager.toggleTaskLine', () => {
        void (0, taskCommands_1.toggleTaskAtCursor)();
    }), vscode.commands.registerCommand('tasksManager.createOrEditTask', () => {
        void (0, taskCommands_1.createOrEditTaskAtCursor)(() => taskIndex?.getAllTasks() ?? []);
    }), vscode.commands.registerCommand('tasksManager.toggleTaskAtLine', async (uri, line) => {
        const editor = await vscode.window.showTextDocument(uri, { preserveFocus: true });
        await (0, taskCommands_1.toggleTaskOnLine)(editor, line);
    }), vscode.commands.registerCommand('tasksManager.editTaskAtLine', async (uri, line) => {
        const editor = await vscode.window.showTextDocument(uri, { preserveFocus: true });
        await (0, taskCommands_1.createOrEditTaskOnLine)(editor, line, () => taskIndex?.getAllTasks() ?? []);
    }), 
    // Target for informational CodeLenses (e.g. the recurrence rule badge) that aren't meant
    // to do anything when clicked.
    vscode.commands.registerCommand('tasksManager.noop', () => undefined), vscode.languages.registerCodeLensProvider({ language: 'markdown' }, new TaskCodeLensProvider_1.TaskCodeLensProvider()));
    const decorations = new TaskDecorations_1.TaskDecorations();
    decorations.activate();
    context.subscriptions.push(decorations);
    // TaskIndex scans the whole workspace for `tasks` query blocks — with no workspace folder
    // open there is nothing to scan, so it's simply not created (not an error).
    //
    // The initial scan is awaited (not fire-and-forget) so that any consumer of this extension's
    // API — e.g. Obsidian-like's `getExtension(...).activate()` soft dependency — only ever sees a
    // fully-populated index. Otherwise a consumer that calls `renderTasksQuery()` (or subscribes
    // to `onDidChangeTasks`) immediately after activation can race the scan: it gets an empty
    // result before the scan finishes, and if it subscribes to `onDidChangeTasks` even a moment
    // after the scan's one-time "done" event already fired, that signal is lost forever (VS
    // Code's EventEmitter doesn't replay past events) — the empty result then gets cached
    // indefinitely on the consumer's side, looking like a permanently broken query.
    if (vscode.workspace.workspaceFolders?.length) {
        taskIndex = new TaskIndex_1.TaskIndex();
        context.subscriptions.push(taskIndex, taskIndex.onDidChange(() => tasksChangedEmitter.fire()));
        await taskIndex.initialize();
    }
    return extensionApi;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map