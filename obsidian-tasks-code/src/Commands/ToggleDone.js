"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleDone = exports.toggleLine = exports.getNewCursorPosition = void 0;
const TasksFile_1 = require("../Scripting/TasksFile");
const StatusRegistry_1 = require("../Statuses/StatusRegistry");
const Task_1 = require("../Task/Task");
const TaskLocation_1 = require("../Task/TaskLocation");
const TaskRegularExpressions_1 = require("../Task/TaskRegularExpressions");
const CreateEditorCallback_1 = require("./CreateEditorCallback");
// Re-export for backwards compatibility with existing test imports
var CreateEditorCallback_2 = require("./CreateEditorCallback");
Object.defineProperty(exports, "getNewCursorPosition", { enumerable: true, get: function () { return CreateEditorCallback_2.getNewCursorPosition; } });
const toggleLine = (line, path) => {
    const task = Task_1.Task.fromLine({
        // Why are we using Task.fromLine instead of the Cache here?
        line,
        taskLocation: TaskLocation_1.TaskLocation.fromUnknownPosition(new TasksFile_1.TasksFile(path)), // We don't need precise location to toggle it here in the editor.
        fallbackDate: null, // We don't need this to toggle it here in the editor.
    });
    if (task !== null) {
        const lines = task.toggleWithRecurrenceInUsersOrder().map((t) => t.toFileLineString());
        const newLineNumber = lines.length > 0 ? lines.length - 1 : 0;
        return { text: lines.join('\n'), moveTo: { line: newLineNumber } };
    }
    else {
        // If the task is null this means that we have one of:
        // 1. a regular checklist item
        // 2. a list item
        // 3. a simple text line
        // 4. a standard task, but which does not contain the global filter, to be toggled, but no done date added.
        // The task regex will match checklist items.
        const regexMatch = line.match(TaskRegularExpressions_1.TaskRegularExpressions.taskRegex);
        if (regexMatch !== null) {
            // Toggle the status of the checklist item.
            const statusString = regexMatch[3];
            const status = StatusRegistry_1.StatusRegistry.getInstance().bySymbol(statusString);
            const newStatusString = status.nextStatusSymbol;
            return { text: line.replace(TaskRegularExpressions_1.TaskRegularExpressions.taskRegex, `$1$2 [${newStatusString}] $4`) };
        }
        else if (TaskRegularExpressions_1.TaskRegularExpressions.listItemRegex.test(line)) {
            // Convert the list item to a checklist item.
            const text = line.replace(TaskRegularExpressions_1.TaskRegularExpressions.listItemRegex, '$1$2 [ ]');
            return { text, moveTo: { ch: text.length } };
        }
        else {
            // Convert the line to a checklist item.
            const text = line.replace(TaskRegularExpressions_1.TaskRegularExpressions.indentationRegex, '$1- [ ] ');
            return { text, moveTo: { ch: text.length } };
        }
    }
};
exports.toggleLine = toggleLine;
exports.toggleDone = (0, CreateEditorCallback_1.createEditorCallback)(exports.toggleLine);
//# sourceMappingURL=ToggleDone.js.map