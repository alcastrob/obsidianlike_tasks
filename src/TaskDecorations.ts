import * as vscode from 'vscode';
import moment from 'moment';
import { Task } from './core/Task/Task';
import { TaskLocation } from './core/Task/TaskLocation';

const DUE_DATE_EMOJI_PATTERN = /(?:📅|📆|🗓)\uFE0F? *\d{4}-\d{2}-\d{2}/u;

/**
 * Approximates the two most visually important cues from Obsidian's live-preview task
 * rendering, using VS Code's `TextEditorDecorationType` API instead of a CodeMirror widget
 * pipeline: completed tasks are struck through and dimmed, and an overdue task's due-date
 * signifier is highlighted in red.
 */
export class TaskDecorations implements vscode.Disposable {
    private readonly doneDecoration = vscode.window.createTextEditorDecorationType({
        textDecoration: 'line-through',
        opacity: '0.6',
    });

    private readonly overdueDecoration = vscode.window.createTextEditorDecorationType({
        color: '#e06c75',
        fontWeight: 'bold',
    });

    private readonly disposables: vscode.Disposable[] = [];
    private updateTimeout: ReturnType<typeof setTimeout> | undefined;

    public activate(): void {
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor) this.updateDecorations(editor);
            }),
            vscode.workspace.onDidChangeTextDocument((event) => {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document === event.document) {
                    this.scheduleUpdate(editor);
                }
            }),
        );

        for (const editor of vscode.window.visibleTextEditors) {
            this.updateDecorations(editor);
        }
    }

    public dispose(): void {
        this.doneDecoration.dispose();
        this.overdueDecoration.dispose();
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
    }

    private scheduleUpdate(editor: vscode.TextEditor): void {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => this.updateDecorations(editor), 300);
    }

    private updateDecorations(editor: vscode.TextEditor): void {
        if (editor.document.languageId !== 'markdown') {
            return;
        }

        const path = vscode.workspace.asRelativePath(editor.document.uri, false);
        const today = moment().startOf('day');
        const doneRanges: vscode.Range[] = [];
        const overdueRanges: vscode.Range[] = [];

        for (let line = 0; line < editor.document.lineCount; line++) {
            const lineText = editor.document.lineAt(line).text;
            const task = Task.fromLine({ line: lineText, taskLocation: new TaskLocation(path, line) });
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
