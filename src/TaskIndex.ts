import * as vscode from 'vscode';
import { Task } from './core/Task/Task';
import { TaskLocation } from './core/Task/TaskLocation';

const MARKDOWN_GLOB = '**/*.md';
const EXCLUDE_GLOB = '**/{node_modules,.git,out}/**';
const DEBOUNCE_MS = 300;

/**
 * Scans the workspace's markdown files for task lines (checkbox list items) and keeps an
 * in-memory cache of the parsed {@link Task} objects, refreshed as files change on disk or
 * are edited in an open editor.
 *
 * This is the VS Code equivalent of Obsidian's metadata cache, which the original plugin
 * relies on to know where every task lives without re-reading every file on every query.
 */
export class TaskIndex implements vscode.Disposable {
    private readonly tasksByPath = new Map<string, Task[]>();
    private readonly _onDidChange = new vscode.EventEmitter<void>();
    public readonly onDidChange = this._onDidChange.event;

    private readonly disposables: vscode.Disposable[] = [];
    private readonly pendingDocumentUpdates = new Map<string, ReturnType<typeof setTimeout>>();

    public async initialize(): Promise<void> {
        const uris = await vscode.workspace.findFiles(MARKDOWN_GLOB, EXCLUDE_GLOB);
        await Promise.all(uris.map((uri) => this.indexFile(uri)));
        this._onDidChange.fire();

        const watcher = vscode.workspace.createFileSystemWatcher(MARKDOWN_GLOB);
        this.disposables.push(
            watcher,
            watcher.onDidCreate((uri) => this.reindexAndNotify(uri)),
            watcher.onDidChange((uri) => this.reindexAndNotify(uri)),
            watcher.onDidDelete((uri) => {
                this.tasksByPath.delete(this.relativePath(uri));
                this._onDidChange.fire();
            }),
            vscode.workspace.onDidChangeTextDocument((event) => {
                if (event.document.languageId !== 'markdown') {
                    return;
                }
                this.scheduleDocumentReindex(event.document);
            }),
        );
    }

    public dispose(): void {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        for (const timeout of this.pendingDocumentUpdates.values()) {
            clearTimeout(timeout);
        }
    }

    /** All tasks currently known across the workspace, in no particular order. */
    public getAllTasks(): Task[] {
        return Array.from(this.tasksByPath.values()).flat();
    }

    /** Tasks parsed from a single file, keyed by its workspace-relative path. */
    public getTasksInFile(relativePath: string): Task[] {
        return this.tasksByPath.get(relativePath) ?? [];
    }

    private async reindexAndNotify(uri: vscode.Uri): Promise<void> {
        await this.indexFile(uri);
        this._onDidChange.fire();
    }

    private scheduleDocumentReindex(document: vscode.TextDocument): void {
        const key = document.uri.toString();
        const existing = this.pendingDocumentUpdates.get(key);
        if (existing) {
            clearTimeout(existing);
        }
        this.pendingDocumentUpdates.set(
            key,
            setTimeout(() => {
                this.pendingDocumentUpdates.delete(key);
                this.indexText(document.uri, document.getText());
                this._onDidChange.fire();
            }, DEBOUNCE_MS),
        );
    }

    private async indexFile(uri: vscode.Uri): Promise<void> {
        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            this.indexText(uri, Buffer.from(bytes).toString('utf8'));
        } catch {
            // File may have been deleted between the watcher event and reading it.
            this.tasksByPath.delete(this.relativePath(uri));
        }
    }

    private indexText(uri: vscode.Uri, text: string): void {
        const path = this.relativePath(uri);
        const lines = text.split(/\r?\n/);
        const tasks: Task[] = [];
        let precedingHeader: string | null = null;
        let sectionStart = 0;
        let sectionIndex = 0;

        lines.forEach((line, lineNumber) => {
            const headingMatch = line.match(/^#{1,6} +(.*)$/);
            if (headingMatch) {
                precedingHeader = headingMatch[1].trim();
                sectionStart = lineNumber;
                sectionIndex = 0;
                return;
            }

            const location = new TaskLocation(path, lineNumber, sectionStart, sectionIndex, precedingHeader);
            const task = Task.fromLine({ line, taskLocation: location });
            if (task !== null) {
                tasks.push(task);
                sectionIndex++;
            }
        });

        this.tasksByPath.set(path, tasks);
    }

    private relativePath(uri: vscode.Uri): string {
        return vscode.workspace.asRelativePath(uri, false);
    }
}
