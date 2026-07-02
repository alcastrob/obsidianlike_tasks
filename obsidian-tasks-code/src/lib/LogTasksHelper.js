"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logStartOfTaskEdit = logStartOfTaskEdit;
exports.logEndOfTaskEdit = logEndOfTaskEdit;
/**
 * Debug logging helper, for the start of Task-editing (or file-editing) operations
 * @param logger
 * @param codeLocation - a string description, such as 'callingFunctionName()'.
 * @param originalTask
 */
function logStartOfTaskEdit(logger, codeLocation, originalTask) {
    logger.debug(`${codeLocation}: task line number: ${originalTask.taskLocation.lineNumber}. file path: "${originalTask.path}"`);
    logger.debug(`${codeLocation} original: ${originalTask.originalMarkdown}`);
}
/**
 * Debug logging helper, for the completion of Task-editing (or file-editing) operations
 * @param logger
 * @param codeLocation - a string description, such as 'callingFunctionName()'.
 * @param newTasks
 */
function logEndOfTaskEdit(logger, codeLocation, newTasks) {
    newTasks.map((task, index) => {
        // Alignment of task lines is intentionally consistent between logStartOfTaskEdit() and this:
        logger.debug(`${codeLocation} ==> ${index + 1}   : ${task.toFileLineString()}`);
    });
}
//# sourceMappingURL=LogTasksHelper.js.map