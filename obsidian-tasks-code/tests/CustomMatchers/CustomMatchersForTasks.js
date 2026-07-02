"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toToggleTo = toToggleTo;
exports.toToggleWithRecurrenceInUsersOrderTo = toToggleWithRecurrenceInUsersOrderTo;
exports.toMatchMarkdownLines = toMatchMarkdownLines;
const jest_diff_1 = require("jest-diff");
const TestHelpers_1 = require("../TestingTools/TestHelpers");
function toToggleTo(line, expectedLines) {
    const task = (0, TestHelpers_1.fromLine)({ line: line });
    const tasks = task.toggle();
    return toMatchMarkdownLines(tasks, expectedLines);
}
function toToggleWithRecurrenceInUsersOrderTo(line, expectedLines) {
    const task = (0, TestHelpers_1.fromLine)({ line: line });
    const tasks = task.toggleWithRecurrenceInUsersOrder();
    return toMatchMarkdownLines(tasks, expectedLines);
}
function toMatchMarkdownLines(tasks, expectedLines) {
    const receivedLines = tasks.map((t) => t.toFileLineString());
    return toMatchLines(receivedLines, expectedLines);
}
function toMatchLines(receivedLines, expectedLines) {
    const matches = receivedLines.join('\n') === expectedLines.join('\n');
    if (!matches) {
        return {
            message: () => 'unexpected incorrect new task lines:\n' + (0, jest_diff_1.diff)(expectedLines, receivedLines),
            pass: false,
        };
    }
    return {
        message: () => `new task lines" should not be: "${receivedLines}"`,
        pass: true,
    };
}
//# sourceMappingURL=CustomMatchersForTasks.js.map