import * as vscode from 'vscode';
import { Task } from './core/Task/Task';
import { TaskLocation } from './core/Task/TaskLocation';

/**
 * Shows 'Done' / 'Edit' actions above every checkbox task line in a markdown file, standing
 * in for the click-to-toggle checkbox and hover actions that Obsidian's live-preview editor
 * renders directly inline (which VS Code's plain-text editor has no equivalent widget system
 * for).
 */
export class TaskCodeLensProvider implements vscode.CodeLensProvider {
    public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        if (document.languageId !== 'markdown') {
            return [];
        }

        const path = vscode.workspace.asRelativePath(document.uri, false);
        const lenses: vscode.CodeLens[] = [];

        for (let line = 0; line < document.lineCount; line++) {
            const lineText = document.lineAt(line).text;
            const task = Task.fromLine({ line: lineText, taskLocation: new TaskLocation(path, line) });
            if (task === null) {
                continue;
            }

            const range = document.lineAt(line).range;

            lenses.push(
                new vscode.CodeLens(range, {
                    title: task.isDone ? '$(discard) Mark as todo' : '$(check) Done',
                    command: 'tasksManager.toggleTaskAtLine',
                    arguments: [document.uri, line],
                }),
                new vscode.CodeLens(range, {
                    title: '$(edit) Edit',
                    command: 'tasksManager.editTaskAtLine',
                    arguments: [document.uri, line],
                }),
            );

            if (task.isRecurring) {
                lenses.push(
                    new vscode.CodeLens(range, {
                        title: `$(sync) ${task.recurrenceRule}`,
                        command: 'tasksManager.noop',
                    }),
                );
            }
        }

        return lenses;
    }
}
