"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printIteration = printIteration;
exports.verifyAll = verifyAll;
exports.verifyWithFileExtension = verifyWithFileExtension;
exports.verifyQuery = verifyQuery;
exports.verifyQueryExplanation = verifyQueryExplanation;
exports.verifyTaskBlockExplanation = verifyTaskBlockExplanation;
exports.verifyTaskList = verifyTaskList;
exports.verifyTaskListInReverseOrder = verifyTaskListInReverseOrder;
exports.verifyHtml = verifyHtml;
const Options_1 = require("approvals/lib/Core/Options");
const JestApprovals_1 = require("approvals/lib/Providers/Jest/JestApprovals");
const Query_1 = require("../../src/Query/Query");
const QueryRendererHelper_1 = require("../../src/Query/QueryRendererHelper");
const VerifyMarkdown_1 = require("./VerifyMarkdown");
const TasksFileHelpers_1 = require("./TasksFileHelpers");
function printIteration(func, params1) {
    const EMPTY_ENTRY = {};
    let text = '';
    for (const p1 of params1) {
        let output;
        try {
            output = func(p1);
        }
        catch (e) {
            output = `${e}`;
        }
        const parameters = [p1].filter((p) => p !== EMPTY_ENTRY);
        text += `${parameters} => ${output}\n`;
    }
    return text;
}
function verifyAll(func, params1) {
    // @ts-ignore
    (0, JestApprovals_1.verify)(printIteration((t1) => func(t1), params1));
}
/**
 Save text to disk, so that it can be embedded in
 to documentation, using a 'snippet' line.
 * @param text
 * @param extensionWithoutDot, such as 'text' or 'explanation.text'. Needed to override the Approvals default of 'txt'.
 * @param options
 */
function verifyWithFileExtension(text, extensionWithoutDot, options) {
    options = options || new Options_1.Options();
    options = options.forFile().withFileExtention(extensionWithoutDot);
    (0, JestApprovals_1.verify)(text, options);
}
/**
 * Save an instructions block to disk, so that it can be embedded in
 * to documentation, using a 'snippet' line.
 * @todo Figure out how to include the '```tasks' and '```' lines:
 *       see discussion in https://github.com/SimonCropp/MarkdownSnippets/issues/537
 * @param instructions
 * @param options
 */
function verifyQuery(instructions, options) {
    verifyWithFileExtension(instructions, 'query.text', options);
}
/**
 * Save an explanation of the instructions block to disk, so that it can be
 * embedded in to documentation, using a 'snippet' line.
 *
 * This method explains only the instructions in a single query block.
 *
 * See {@link verifyTaskBlockExplanation} to also explain any global filter or global query.
 *
 * @param instructions
 * @param options
 */
function verifyQueryExplanation(instructions, options) {
    const query = new Query_1.Query(instructions);
    const explanation = query.explainQuery();
    expect(query.error).toBeUndefined();
    verifyWithFileExtension(explanation, 'explanation.text', options);
}
/**
 * Save an explanation of the task block to disk, so that it can be
 * embedded in to documentation, using a 'snippet' line.
 *
 * This method explains the query and also any global filter or global query.
 *
 * See {@link verifyQueryExplanation} to just explain the query.
 *
 * @param instructions
 * @param globalFilter
 * @param globalQuery
 * @param options
 * @param tasksFile
 */
function verifyTaskBlockExplanation(instructions, globalFilter, globalQuery, options, tasksFile = (0, TasksFileHelpers_1.createTestTasksFile)('some/sample/file path.md')) {
    const explanation = (0, QueryRendererHelper_1.explainResults)(instructions, globalFilter, globalQuery, tasksFile);
    verifyWithFileExtension(explanation, 'explanation.text', options);
}
/**
 * Write tasks to a markdown file, to enable their contents to be visualised.
 *
 * They are written in the order they are given.
 * @param tasks
 * @see verifyTaskListInReverseOrder
 */
function verifyTaskList(tasks) {
    (0, VerifyMarkdown_1.verifyMarkdown)(tasks.map((task) => task.toFileLineString()).join('\n'));
}
/**
 * Write tasks to a markdown file, to enable their contents to be visualised.
 *
 * They are written in reverse order, which may be useful for easier understand of toggled tasks.
 *
 * @param tasks
 * @see verifyTaskList
 */
function verifyTaskListInReverseOrder(tasks) {
    const reverse = [...tasks].reverse();
    verifyTaskList(reverse);
}
function verifyHtml(normalizedHTML) {
    verifyWithFileExtension(normalizedHTML, 'html');
}
//# sourceMappingURL=ApprovalTestHelpers.js.map