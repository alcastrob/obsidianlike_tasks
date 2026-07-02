"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSetStatusLineTransformer = exports.setStatusOnLine = void 0;
exports.createSetStatusCommands = createSetStatusCommands;
const obsidian_1 = require("obsidian");
const TasksFile_1 = require("../Scripting/TasksFile");
const Task_1 = require("../Task/Task");
const TaskLocation_1 = require("../Task/TaskLocation");
const StatusInstructions_1 = require("../ui/EditInstructions/StatusInstructions");
const CreateEditorCallback_1 = require("./CreateEditorCallback");
/**
 * Sets a task's status on a single line, returning the new text and cursor position.
 *
 * @param line - The line of text to transform
 * @param path - The file path containing the line
 * @param newStatus - The status to set the task to
 * @returns An EditorInsertion with the new text and cursor position, or undefined if the line is not a task
 */
const setStatusOnLine = (line, path, newStatus) => {
    const task = Task_1.Task.fromLine({
        line,
        taskLocation: TaskLocation_1.TaskLocation.fromUnknownPosition(new TasksFile_1.TasksFile(path)),
        fallbackDate: null,
    });
    if (task !== null) {
        const lines = task.handleNewStatusWithRecurrenceInUsersOrder(newStatus).map((t) => t.toFileLineString());
        const newLineNumber = lines.length > 0 ? lines.length - 1 : 0;
        return { text: lines.join('\n'), moveTo: { line: newLineNumber } };
    }
    return undefined;
};
exports.setStatusOnLine = setStatusOnLine;
/**
 * Creates a line transformer that sets a task's status to the given status.
 *
 * @param newStatus - The status to set the task to
 * @returns A LineTransformer function for use with createEditorCallback
 */
const createSetStatusLineTransformer = (newStatus) => {
    return (line, path) => {
        const result = (0, exports.setStatusOnLine)(line, path, newStatus);
        if (result === undefined) {
            new obsidian_1.Notice('Cannot set status: line is not a task or does not match global filter');
        }
        return result;
    };
};
exports.createSetStatusLineTransformer = createSetStatusLineTransformer;
/**
 * Create set-status commands for each registered status
 * @param statusRegistry
 */
function createSetStatusCommands(statusRegistry) {
    const statusInstructions = (0, StatusInstructions_1.allStatusInstructions)(statusRegistry);
    const setStatusCommands = [];
    for (const instruction of statusInstructions) {
        const status = instruction.newStatus;
        // We want the command id to not change if a user renames the status.
        // And we also don't want to have to figure out how to handle duplicate status names.
        // So we use the single-character status symbol in the command id, avoiding using a space character.
        const symbolSlug = status.symbol === ' ' ? 'space' : status.symbol;
        const command = {
            id: `set-status-symbol-to-${symbolSlug}`,
            name: instruction.instructionDisplayName(),
            editorCheckCallback: (0, CreateEditorCallback_1.createEditorCallback)((0, exports.createSetStatusLineTransformer)(status)),
        };
        setStatusCommands.push(command);
    }
    return setStatusCommands;
}
//# sourceMappingURL=ChangeStatusCommands.js.map