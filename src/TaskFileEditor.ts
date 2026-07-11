import * as vscode from 'vscode';
import { Task } from './core/Task/Task';

/**
 * Writes `newTasks` back to the file/line where `originalTask` was found, replacing exactly that
 * one line. Used to propagate dependency edits made in the "Create or edit Task" dialog (adding or
 * removing a "blocking" relationship, or assigning an id to a task newly referenced as "before
 * this") to files other than the one the user is actively editing — the equivalent of Obsidian
 * Tasks' `replaceTaskWithTasks()` (`src/Obsidian/File.ts`), minus the `ListItem` parent/child
 * hierarchy this port doesn't have, so here it's always a plain single-line replace.
 */
export async function replaceTaskWithTasks(originalTask: Task, newTasks: Task[]): Promise<void> {
    if (newTasks.length === 0) {
        return;
    }
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
        return;
    }

    const uri = vscode.Uri.joinPath(folder.uri, originalTask.path);
    const document = await vscode.workspace.openTextDocument(uri);
    const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

    const edit = new vscode.WorkspaceEdit();
    edit.replace(
        uri,
        document.lineAt(originalTask.lineNumber).range,
        newTasks.map((t) => t.toFileLineString()).join(eol),
    );
    await vscode.workspace.applyEdit(edit);
}
