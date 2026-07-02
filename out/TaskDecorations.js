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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskDecorations = void 0;
const vscode = __importStar(require("vscode"));
const moment_1 = __importDefault(require("moment"));
const Task_1 = require("./core/Task/Task");
const TaskLocation_1 = require("./core/Task/TaskLocation");
const DUE_DATE_EMOJI_PATTERN = /(?:📅|📆|🗓)\uFE0F? *\d{4}-\d{2}-\d{2}/u;
/**
 * Approximates the two most visually important cues from Obsidian's live-preview task
 * rendering, using VS Code's `TextEditorDecorationType` API instead of a CodeMirror widget
 * pipeline: completed tasks are struck through and dimmed, and an overdue task's due-date
 * signifier is highlighted in red.
 */
class TaskDecorations {
    constructor() {
        this.doneDecoration = vscode.window.createTextEditorDecorationType({
            textDecoration: 'line-through',
            opacity: '0.6',
        });
        this.overdueDecoration = vscode.window.createTextEditorDecorationType({
            color: '#e06c75',
            fontWeight: 'bold',
        });
        this.disposables = [];
    }
    activate() {
        this.disposables.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor)
                this.updateDecorations(editor);
        }), vscode.workspace.onDidChangeTextDocument((event) => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === event.document) {
                this.scheduleUpdate(editor);
            }
        }));
        for (const editor of vscode.window.visibleTextEditors) {
            this.updateDecorations(editor);
        }
    }
    dispose() {
        this.doneDecoration.dispose();
        this.overdueDecoration.dispose();
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
    }
    scheduleUpdate(editor) {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => this.updateDecorations(editor), 300);
    }
    updateDecorations(editor) {
        if (editor.document.languageId !== 'markdown') {
            return;
        }
        const path = vscode.workspace.asRelativePath(editor.document.uri, false);
        const today = (0, moment_1.default)().startOf('day');
        const doneRanges = [];
        const overdueRanges = [];
        for (let line = 0; line < editor.document.lineCount; line++) {
            const lineText = editor.document.lineAt(line).text;
            const task = Task_1.Task.fromLine({ line: lineText, taskLocation: new TaskLocation_1.TaskLocation(path, line) });
            if (task === null) {
                continue;
            }
            if (task.isDone) {
                doneRanges.push(editor.document.lineAt(line).range);
                continue;
            }
            if (task.dueDate && task.dueDate.isBefore(today, 'day')) {
                const match = lineText.match(DUE_DATE_EMOJI_PATTERN);
                if (match?.index !== undefined) {
                    overdueRanges.push(new vscode.Range(line, match.index, line, match.index + match[0].length));
                }
            }
        }
        editor.setDecorations(this.doneDecoration, doneRanges);
        editor.setDecorations(this.overdueDecoration, overdueRanges);
    }
}
exports.TaskDecorations = TaskDecorations;
//# sourceMappingURL=TaskDecorations.js.map