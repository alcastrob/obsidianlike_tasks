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
exports.TaskCodeLensProvider = void 0;
const vscode = __importStar(require("vscode"));
const Task_1 = require("./core/Task/Task");
const TaskLocation_1 = require("./core/Task/TaskLocation");
/**
 * Shows 'Done' / 'Edit' actions above every checkbox task line in a markdown file, standing
 * in for the click-to-toggle checkbox and hover actions that Obsidian's live-preview editor
 * renders directly inline (which VS Code's plain-text editor has no equivalent widget system
 * for).
 */
class TaskCodeLensProvider {
    provideCodeLenses(document) {
        if (document.languageId !== 'markdown') {
            return [];
        }
        const path = vscode.workspace.asRelativePath(document.uri, false);
        const lenses = [];
        for (let line = 0; line < document.lineCount; line++) {
            const lineText = document.lineAt(line).text;
            const task = Task_1.Task.fromLine({ line: lineText, taskLocation: new TaskLocation_1.TaskLocation(path, line) });
            if (task === null) {
                continue;
            }
            const range = document.lineAt(line).range;
            lenses.push(new vscode.CodeLens(range, {
                title: task.isDone ? '$(discard) Mark as todo' : '$(check) Done',
                command: 'tasksManager.toggleTaskAtLine',
                arguments: [document.uri, line],
            }), new vscode.CodeLens(range, {
                title: '$(edit) Edit',
                command: 'tasksManager.editTaskAtLine',
                arguments: [document.uri, line],
            }));
            if (task.isRecurring) {
                lenses.push(new vscode.CodeLens(range, {
                    title: `$(sync) ${task.recurrenceRule}`,
                    command: 'tasksManager.noop',
                }));
            }
        }
        return lenses;
    }
}
exports.TaskCodeLensProvider = TaskCodeLensProvider;
//# sourceMappingURL=TaskCodeLensProvider.js.map