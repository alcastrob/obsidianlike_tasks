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
exports.createTasksApi = createTasksApi;
const vscode = __importStar(require("vscode"));
const moment_1 = __importDefault(require("moment"));
const Task_1 = require("../core/Task/Task");
const TaskLocation_1 = require("../core/Task/TaskLocation");
const Query_1 = require("../core/Query/Query");
const taskCommands_1 = require("../commands/taskCommands");
function toDto(task) {
    return {
        path: task.path,
        line: task.lineNumber,
        description: task.descriptionWithoutTags,
        tags: task.tags,
        isDone: task.isDone,
        statusSymbol: task.status.symbol,
        isOverdue: !task.isDone && task.dueDate !== null && task.dueDate.isBefore((0, moment_1.default)(), 'day'),
        priority: task.priorityName,
        dueDate: task.dueDate ? task.dueDate.format('YYYY-MM-DD') : null,
        scheduledDate: task.scheduledDate ? task.scheduledDate.format('YYYY-MM-DD') : null,
        startDate: task.startDate ? task.startDate.format('YYYY-MM-DD') : null,
        isRecurring: task.isRecurring,
        recurrenceRule: task.isRecurring ? task.recurrenceRule : null,
        heading: task.heading,
    };
}
/**
 * @param onDidChangeTasks Must be a stable event (e.g. a module-level `EventEmitter`'s `.event`
 * created once, independent of whether `getTaskIndex()` yet returns a real `TaskIndex`) — the
 * returned object here gets spread into `extension.ts`'s `activate()` return value
 * (`{ ...createTasksApi(...) }`), and spreading an object evaluates getters immediately, once,
 * copying their *current* result as a plain value. A `get onDidChangeTasks()` computed from
 * `getTaskIndex()` at spread-time would permanently bake in whatever that returned at that
 * exact moment — `undefined`, if the index hasn't been created yet — silently breaking every
 * subscriber for the rest of the session. See the longer comment in `extension.ts`.
 */
function createTasksApi(getTaskIndex, onDidChangeTasks) {
    return {
        isTaskLine(lineText) {
            return Task_1.Task.extractTaskComponents(lineText) !== null;
        },
        toggleTaskLine(lineText) {
            const task = Task_1.Task.fromLine({ line: lineText, taskLocation: TaskLocation_1.TaskLocation.fromUnknownPosition('') });
            if (task === null) {
                return [lineText];
            }
            return task.toggleWithRecurrenceInUsersOrder().map((t) => t.toFileLineString());
        },
        renderTasksQuery(queryText) {
            const taskIndex = getTaskIndex();
            if (!taskIndex) {
                return { items: [], groups: null, unrecognizedLines: [] };
            }
            const query = new Query_1.TasksQuery(queryText);
            const result = query.apply(taskIndex.getAllTasks());
            return {
                items: result.groups ? [] : result.tasks.map(toDto),
                groups: result.groups ? result.groups.map((g) => ({ name: g.name, items: g.tasks.map(toDto) })) : null,
                unrecognizedLines: result.unrecognizedLines,
            };
        },
        async toggleTaskAtLocation(path, line) {
            const folder = vscode.workspace.workspaceFolders?.[0];
            if (!folder) {
                return;
            }
            const uri = vscode.Uri.joinPath(folder.uri, path);
            const document = await vscode.workspace.openTextDocument(uri);
            const lineText = document.lineAt(line).text;
            const task = Task_1.Task.fromLine({ line: lineText, taskLocation: new TaskLocation_1.TaskLocation(path, line) });
            if (task === null) {
                return;
            }
            const replacementLines = task.toggleWithRecurrenceInUsersOrder().map((t) => t.toFileLineString());
            const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
            const edit = new vscode.WorkspaceEdit();
            edit.replace(uri, document.lineAt(line).range, replacementLines.join(eol));
            await vscode.workspace.applyEdit(edit);
        },
        async editTaskAtLocation(path, line) {
            const folder = vscode.workspace.workspaceFolders?.[0];
            if (!folder) {
                return;
            }
            const uri = vscode.Uri.joinPath(folder.uri, path);
            const document = await vscode.workspace.openTextDocument(uri);
            const lineText = document.lineAt(line).text;
            const tasks = await (0, taskCommands_1.editTaskFromLineText)(lineText, new TaskLocation_1.TaskLocation(path, line), () => getTaskIndex()?.getAllTasks() ?? []);
            if (!tasks) {
                return;
            }
            const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
            const edit = new vscode.WorkspaceEdit();
            edit.replace(uri, document.lineAt(line).range, tasks.map((t) => t.toFileLineString()).join(eol));
            await vscode.workspace.applyEdit(edit);
        },
        onDidChangeTasks,
    };
}
//# sourceMappingURL=TasksApi.js.map