"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromLine = fromLine;
exports.fromLines = fromLines;
exports.fromMarkdown = fromMarkdown;
exports.toLine = toLine;
exports.toLines = toLines;
exports.toMarkdown = toMarkdown;
exports.createTasksFromMarkdown = createTasksFromMarkdown;
const Task_1 = require("../../src/Task/Task");
const TaskLocation_1 = require("../../src/Task/TaskLocation");
const TasksFileHelpers_1 = require("./TasksFileHelpers");
/**
 * @see fromLines
 * @see toLine
 */
function fromLine({ line, path = '', precedingHeader = null, }) {
    return Task_1.Task.fromLine({
        line,
        taskLocation: new TaskLocation_1.TaskLocation((0, TasksFileHelpers_1.createTestTasksFile)(path), 0, 0, 0, precedingHeader),
        fallbackDate: null,
    });
}
/**
 * @see fromLine
 * @see createTasksFromMarkdown
 * @see toLines
 */
function fromLines({ lines, path = '', precedingHeader = null, }) {
    return lines.map((line) => fromLine({ line, path, precedingHeader }));
}
function fromMarkdown(tasksMarkdown) {
    const lines = tasksMarkdown.split('\n').filter((line) => line.length > 0);
    return fromLines({ lines });
}
/**
 * @see toLines
 * @see fromLine
 */
function toLine(task) {
    return task.toFileLineString();
}
/**
 * @see toLine
 * @see fromLines
 * @see toMarkdown
 */
function toLines(tasks) {
    return tasks.map((task) => toLine(task));
}
/**
 * @see toLines
 */
function toMarkdown(tasks) {
    return toLines(tasks).join('\n');
}
/**
 * @see fromLines
 */
function createTasksFromMarkdown(tasksAsMarkdown, path, precedingHeader) {
    const taskLines = tasksAsMarkdown.split('\n');
    const tasks = [];
    for (const line of taskLines) {
        const task = Task_1.Task.fromLine({
            line: line,
            taskLocation: new TaskLocation_1.TaskLocation((0, TasksFileHelpers_1.createTestTasksFile)(path), 0, 0, 0, precedingHeader),
            fallbackDate: null,
        });
        if (task) {
            tasks.push(task);
        }
    }
    return tasks;
}
//# sourceMappingURL=TestHelpers.js.map