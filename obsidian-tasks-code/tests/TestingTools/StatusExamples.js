"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doneTogglesToCancelled = doneTogglesToCancelled;
exports.doneTogglesToCancelledWithUnconventionalSymbols = doneTogglesToCancelledWithUnconventionalSymbols;
exports.variousNonTaskStatuses = variousNonTaskStatuses;
exports.importantCycle = importantCycle;
exports.todoToInProgressToDone = todoToInProgressToDone;
exports.proCon = proCon;
function doneTogglesToCancelled() {
    const statuses = [
        [' ', 'Todo', '/', 'TODO'],
        ['x', 'Done', '-', 'DONE'],
        ['/', 'In Progress', 'x', 'IN_PROGRESS'],
        ['-', 'Cancelled', ' ', 'CANCELLED'],
    ];
    return statuses;
}
function doneTogglesToCancelledWithUnconventionalSymbols() {
    const statuses = [
        [' ', 'Todo', '*', 'TODO'],
        ['*', 'Done', 'x', 'DONE'],
        ['x', 'Cancelled', ' ', 'CANCELLED'],
    ];
    return statuses;
}
function variousNonTaskStatuses() {
    const importantCycle = [
        ['b', 'Bookmark', 'b', 'NON_TASK'],
        ['E', 'Example', 'E', 'NON_TASK'],
        ['I', 'Information', 'I', 'NON_TASK'],
        ['P', 'Paraphrase', 'P', 'NON_TASK'],
        ['Q', 'Quote', 'Q', 'NON_TASK'],
    ];
    return importantCycle;
}
function importantCycle() {
    const importantCycle = [
        ['!', 'Important', 'D', 'TODO'],
        ['D', 'Doing - Important', 'X', 'IN_PROGRESS'],
        ['X', 'Done - Important', '!', 'DONE'],
    ];
    return importantCycle;
}
function todoToInProgressToDone() {
    const importantCycle = [
        [' ', 'Todo', '/', 'TODO'],
        ['/', 'In Progress', 'x', 'IN_PROGRESS'],
        ['x', 'Done', ' ', 'DONE'],
    ];
    return importantCycle;
}
function proCon() {
    const importantCycle = [
        ['P', 'Pro', 'C', 'NON_TASK'],
        ['C', 'Con', 'P', 'NON_TASK'],
    ];
    return importantCycle;
}
//# sourceMappingURL=StatusExamples.js.map