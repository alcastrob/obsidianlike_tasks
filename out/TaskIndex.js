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
exports.TaskIndex = void 0;
const vscode = __importStar(require("vscode"));
const Task_1 = require("./core/Task/Task");
const TaskLocation_1 = require("./core/Task/TaskLocation");
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
class TaskIndex {
    constructor() {
        this.tasksByPath = new Map();
        this._onDidChange = new vscode.EventEmitter();
        this.onDidChange = this._onDidChange.event;
        this.disposables = [];
        this.pendingDocumentUpdates = new Map();
    }
    async initialize() {
        const uris = await vscode.workspace.findFiles(MARKDOWN_GLOB, EXCLUDE_GLOB);
        await Promise.all(uris.map((uri) => this.indexFile(uri)));
        this._onDidChange.fire();
        const watcher = vscode.workspace.createFileSystemWatcher(MARKDOWN_GLOB);
        this.disposables.push(watcher, watcher.onDidCreate((uri) => this.reindexAndNotify(uri)), watcher.onDidChange((uri) => this.reindexAndNotify(uri)), watcher.onDidDelete((uri) => {
            this.tasksByPath.delete(this.relativePath(uri));
            this._onDidChange.fire();
        }), vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.languageId !== 'markdown') {
                return;
            }
            this.scheduleDocumentReindex(event.document);
        }));
    }
    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        for (const timeout of this.pendingDocumentUpdates.values()) {
            clearTimeout(timeout);
        }
    }
    /** All tasks currently known across the workspace, in no particular order. */
    getAllTasks() {
        return Array.from(this.tasksByPath.values()).flat();
    }
    /** Tasks parsed from a single file, keyed by its workspace-relative path. */
    getTasksInFile(relativePath) {
        return this.tasksByPath.get(relativePath) ?? [];
    }
    async reindexAndNotify(uri) {
        await this.indexFile(uri);
        this._onDidChange.fire();
    }
    scheduleDocumentReindex(document) {
        const key = document.uri.toString();
        const existing = this.pendingDocumentUpdates.get(key);
        if (existing) {
            clearTimeout(existing);
        }
        this.pendingDocumentUpdates.set(key, setTimeout(() => {
            this.pendingDocumentUpdates.delete(key);
            this.indexText(document.uri, document.getText());
            this._onDidChange.fire();
        }, DEBOUNCE_MS));
    }
    async indexFile(uri) {
        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            this.indexText(uri, Buffer.from(bytes).toString('utf8'));
        }
        catch {
            // File may have been deleted between the watcher event and reading it.
            this.tasksByPath.delete(this.relativePath(uri));
        }
    }
    indexText(uri, text) {
        const path = this.relativePath(uri);
        const lines = text.split(/\r?\n/);
        const tasks = [];
        let precedingHeader = null;
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
            const location = new TaskLocation_1.TaskLocation(path, lineNumber, sectionStart, sectionIndex, precedingHeader);
            const task = Task_1.Task.fromLine({ line, taskLocation: location });
            if (task !== null) {
                tasks.push(task);
                sectionIndex++;
            }
        });
        this.tasksByPath.set(path, tasks);
    }
    relativePath(uri) {
        return vscode.workspace.asRelativePath(uri, false);
    }
}
exports.TaskIndex = TaskIndex;
//# sourceMappingURL=TaskIndex.js.map