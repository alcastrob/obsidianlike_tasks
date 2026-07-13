import * as vscode from 'vscode';
import { toggleTaskOnLine, createOrEditTaskOnLine } from './commands/taskCommands';
import { TaskCodeLensProvider } from './TaskCodeLensProvider';
import { TaskDecorations } from './TaskDecorations';
import { TaskIndex } from './TaskIndex';
import { registerTasksCodeBlock } from './markdownTasksPlugin';
import { createTasksApi } from './api/TasksApi';

// Module-level so `extendMarkdownIt` (called by VS Code's built-in Markdown extension, via the
// object returned from `activate()`) can reach the same task index `activate()` builds.
let taskIndex: TaskIndex | undefined;

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
const tasksChangedEmitter = new vscode.EventEmitter<void>();

export async function activate(context: vscode.ExtensionContext) {
  const extensionApi = {
    extendMarkdownIt: (md: any) => registerTasksCodeBlock(md, () => taskIndex),
    ...createTasksApi(() => taskIndex, tasksChangedEmitter.event),
  };

  // These only need the currently open document — no workspace folder required, so they work
  // even when a single .md file is opened directly (File > Open File) rather than a folder.
  context.subscriptions.push(
    vscode.commands.registerCommand('tasksManager.toggleTaskAtLine', async (uri: vscode.Uri, line: number) => {
      const editor = await vscode.window.showTextDocument(uri, { preserveFocus: true });
      await toggleTaskOnLine(editor, line);
    }),
    vscode.commands.registerCommand('tasksManager.editTaskAtLine', async (uri: vscode.Uri, line: number) => {
      const editor = await vscode.window.showTextDocument(uri, { preserveFocus: true });
      await createOrEditTaskOnLine(editor, line, () => taskIndex?.getAllTasks() ?? []);
    }),
    // Target for informational CodeLenses (e.g. the recurrence rule badge) that aren't meant
    // to do anything when clicked.
    vscode.commands.registerCommand('tasksManager.noop', () => undefined),
    vscode.languages.registerCodeLensProvider({ language: 'markdown' }, new TaskCodeLensProvider()),
  );

  const decorations = new TaskDecorations();
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
    taskIndex = new TaskIndex();
    context.subscriptions.push(taskIndex, taskIndex.onDidChange(() => tasksChangedEmitter.fire()));
    await taskIndex.initialize();
  }

  return extensionApi;
}

export function deactivate(): void {}
