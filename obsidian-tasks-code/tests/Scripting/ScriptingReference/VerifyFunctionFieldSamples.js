"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFunctionFieldFilterSamplesOnTasks = verifyFunctionFieldFilterSamplesOnTasks;
exports.verifyFunctionFieldFilterSamplesForDocs = verifyFunctionFieldFilterSamplesForDocs;
exports.verifyFunctionFieldSortSamplesOnTasks = verifyFunctionFieldSortSamplesOnTasks;
exports.verifyFunctionFieldGrouperSamplesOnTasks = verifyFunctionFieldGrouperSamplesOnTasks;
exports.verifyFunctionFieldGrouperSamplesForDocs = verifyFunctionFieldGrouperSamplesForDocs;
const JestApprovals_1 = require("approvals/lib/Providers/Jest/JestApprovals");
const FunctionField_1 = require("../../../src/Query/Filter/FunctionField");
const CustomMatchersForGrouping_1 = require("../../CustomMatchers/CustomMatchersForGrouping");
const VerifyMarkdown_1 = require("../../TestingTools/VerifyMarkdown");
const ExpandPlaceholders_1 = require("../../../src/Scripting/ExpandPlaceholders");
const QueryContext_1 = require("../../../src/Scripting/QueryContext");
const Scanner_1 = require("../../../src/Query/Scanner");
const SearchInfo_1 = require("../../../src/Query/SearchInfo");
const Sort_1 = require("../../../src/Query/Sort/Sort");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const TasksFileHelpers_1 = require("../../TestingTools/TasksFileHelpers");
// -----------------------------------------------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------------------------------------------
function preprocessSingleInstruction(instruction, tasksFile) {
    const instructions = (0, Scanner_1.splitSourceHonouringLineContinuations)(instruction);
    expect(instructions.length).toEqual(1);
    return (0, ExpandPlaceholders_1.expandPlaceholders)(instructions[0], (0, QueryContext_1.makeQueryContext)(tasksFile));
}
function punctuateComments(comments) {
    return comments.map((comment) => {
        if ('.,:`'.includes(comment.slice(-1))) {
            return comment;
        }
        else {
            return comment + '.';
        }
    });
}
function formatQueryAndResultsForApproving(instruction, comments, matchingTasks) {
    const punctuatedComments = punctuateComments(comments);
    return `
${instruction}
${punctuatedComments.join('\n')}
=>
${matchingTasks.join('\n')}
====================================================================================
`;
}
function formatQueryAndCommentsForDocs(filters) {
    let markdown = '';
    if (filters.length === 0) {
        markdown = '';
    }
    else {
        for (const filter of filters) {
            const instruction = filter[0];
            const comments = filter.slice(1);
            const punctuatedComments = punctuateComments(comments);
            // Using javascript as the fenced code block language makes the
            // published documentation easier to read, as the syntax highlighting
            // breaks up an otherwise long wall of text.
            // If using WebStorm IDE, it will complain about invalid JavaScript.
            // Turn off checking: https://www.jetbrains.com/help/webstorm/markdown.html#disable-injection-in-code-blocks
            const language = 'javascript';
            markdown += `
\`\`\`${language}
${instruction}
\`\`\`

${punctuatedComments.map((l) => l.replace(/^( *)/, '$1- ')).join('\n')}
`;
        }
    }
    return markdown;
}
// -----------------------------------------------------------------------------------------------------------------
// Filtering
// -----------------------------------------------------------------------------------------------------------------
function verifyFunctionFieldFilterSamplesOnTasks(filters, tasks) {
    if (filters.length === 0) {
        return;
    }
    (0, JestApprovals_1.verifyAll)('Results of custom filters', filters, (filter) => {
        const instruction = filter[0];
        const comment = filter.slice(1);
        const tasksFile = (0, TasksFileHelpers_1.createTestTasksFile)('a/b.md');
        const expandedInstruction = preprocessSingleInstruction(instruction, tasksFile);
        const filterOrErrorMessage = new FunctionField_1.FunctionField().createFilterOrErrorMessage(expandedInstruction);
        expect(filterOrErrorMessage).toBeValid();
        const filterFunction = filterOrErrorMessage.filterFunction;
        const matchingTasks = [];
        const searchInfo = new SearchInfo_1.SearchInfo(tasksFile, tasks);
        for (const task of tasks) {
            const matches = filterFunction(task, searchInfo);
            if (matches) {
                matchingTasks.push(task.toFileLineString());
            }
        }
        return formatQueryAndResultsForApproving(instruction, comment, matchingTasks);
    });
}
function verifyFunctionFieldFilterSamplesForDocs(filters) {
    const markdown = formatQueryAndCommentsForDocs(filters);
    (0, VerifyMarkdown_1.verifyMarkdownForDocs)(markdown);
}
// -----------------------------------------------------------------------------------------------------------------
// Sorting
// -----------------------------------------------------------------------------------------------------------------
function verifyFunctionFieldSortSamplesOnTasks(instructions, tasks) {
    if (instructions.length === 0) {
        return;
    }
    (0, JestApprovals_1.verifyAll)('Results of custom sorters', instructions, (filter) => {
        const instruction = filter[0];
        const comment = filter.slice(1);
        const tasksFile = (0, TasksFileHelpers_1.createTestTasksFile)('a/b.md');
        const expandedInstruction = preprocessSingleInstruction(instruction, tasksFile);
        const sorter = new FunctionField_1.FunctionField().createSorterFromLine(expandedInstruction);
        expect(sorter).not.toBeNull();
        const tasksSorted = Sort_1.Sort.by([sorter], tasks, new SearchInfo_1.SearchInfo(tasksFile, tasks));
        return formatQueryAndResultsForApproving(instruction, comment, (0, TestHelpers_1.toLines)(tasksSorted));
    });
}
function verifyFunctionFieldGrouperSamplesOnTasks(customGroups, tasks) {
    (0, JestApprovals_1.verifyAll)('Results of custom groupers', customGroups, (group) => {
        const instruction = group[0];
        const comment = group.slice(1);
        const tasksFile = (0, TasksFileHelpers_1.createTestTasksFile)('a/b.md');
        const expandedInstruction = preprocessSingleInstruction(instruction, tasksFile);
        const grouper = new FunctionField_1.FunctionField().createGrouperFromLine(expandedInstruction);
        expect(grouper).not.toBeNull();
        const headings = (0, CustomMatchersForGrouping_1.groupHeadingsForTask)(grouper, tasks, new SearchInfo_1.SearchInfo(tasksFile, tasks));
        return formatQueryAndResultsForApproving(instruction, comment, headings);
    });
}
function verifyFunctionFieldGrouperSamplesForDocs(customGroups) {
    const markdown = formatQueryAndCommentsForDocs(customGroups);
    (0, VerifyMarkdown_1.verifyMarkdownForDocs)(markdown);
}
//# sourceMappingURL=VerifyFunctionFieldSamples.js.map