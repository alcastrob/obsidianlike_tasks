"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const Status_1 = require("../../src/Statuses/Status");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const VerifyMarkdown_1 = require("../TestingTools/VerifyMarkdown");
const TaskExpression_1 = require("../../src/Scripting/TaskExpression");
const MarkdownTable_1 = require("../../src/lib/MarkdownTable");
const QueryContext_1 = require("../../src/Scripting/QueryContext");
const SimulatedFile_1 = require("../Obsidian/SimulatedFile");
const LinkResolver_1 = require("../../src/Task/LinkResolver");
const obsidian_1 = require("../__mocks__/obsidian");
const TasksFileHelpers_1 = require("../TestingTools/TasksFileHelpers");
const ScriptingTestHelpers_1 = require("./ScriptingTestHelpers");
window.moment = moment_1.default;
// TODO Show a task in a callout, or an ordered list
beforeEach(() => { });
afterEach(() => {
    LinkResolver_1.LinkResolver.getInstance().resetGetFirstLinkpathDestFn();
});
describe('task', () => {
    function verifyFieldDataForReferenceDocs(fields) {
        const task1 = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask();
        const task2 = new TaskBuilder_1.TaskBuilder().description('minimal task').status(Status_1.Status.IN_PROGRESS).build();
        verifyFieldDataFromTasksForReferenceDocs([task1, task2], fields);
    }
    function verifyFieldDataFromTasksForReferenceDocs(tasks, fields) {
        const headings = ['Field'];
        tasks.forEach((_, index) => {
            headings.push(`Type ${index + 1}`);
            headings.push(`Example ${index + 1}`);
        });
        const markdownTable = new MarkdownTable_1.MarkdownTable(headings);
        const queryContext = (0, QueryContext_1.makeQueryContextWithTasks)((0, TasksFileHelpers_1.createTestTasksFile)(tasks[0].path), tasks);
        for (const field of fields) {
            const cells = [(0, ScriptingTestHelpers_1.addBackticks)(field)];
            for (const task of tasks) {
                const value = (0, TaskExpression_1.parseAndEvaluateExpression)(task, field, queryContext);
                cells.push((0, ScriptingTestHelpers_1.addBackticks)((0, ScriptingTestHelpers_1.determineExpressionType)(value)));
                cells.push((0, ScriptingTestHelpers_1.addBackticks)((0, ScriptingTestHelpers_1.formatToRepresentType)(value)));
            }
            markdownTable.addRow(cells);
        }
        (0, VerifyMarkdown_1.verifyMarkdownForDocs)(markdownTable.markdown);
    }
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-06-12'));
    });
    afterAll(() => {
        jest.useRealTimers();
    });
    // NEW_TASK_FIELD_EDIT_REQUIRED
    it('status', () => {
        verifyFieldDataForReferenceDocs([
            'task.isDone',
            'task.status.name',
            'task.status.type',
            'task.status.typeGroupText',
            'task.status.symbol',
            'task.status.nextSymbol',
        ]);
    });
    it('dates', () => {
        verifyFieldDataForReferenceDocs([
            'task.created',
            'task.start',
            'task.scheduled',
            'task.due',
            'task.cancelled',
            'task.done',
            'task.happens',
        ]);
    });
    it('date fields', () => {
        const textToUseIfUndated = "'no date'";
        verifyFieldDataForReferenceDocs([
            'task.due',
            'task.due.moment',
            'task.due.formatAsDate()',
            `task.due.formatAsDate(${textToUseIfUndated})`,
            'task.due.formatAsDateAndTime()',
            `task.due.formatAsDateAndTime(${textToUseIfUndated})`,
            "task.due.format('dddd')",
            `task.due.format('dddd', ${textToUseIfUndated})`,
            'task.due.toISOString()',
            'task.due.toISOString(true)', // https://momentjs.com/docs/#/displaying/as-iso-string/ - true prevents UTC conversion
            'task.due.category.name',
            'task.due.category.sortOrder',
            'task.due.category.groupText',
            'task.due.fromNow.name',
            'task.due.fromNow.sortOrder',
            'task.due.fromNow.groupText',
        ]);
    });
    it('dependency fields', () => {
        verifyFieldDataForReferenceDocs([
            // force line break
            'task.id',
            'task.dependsOn',
            'task.isBlocked(query.allTasks)',
            'task.isBlocking(query.allTasks)',
        ]);
    });
    it('other fields', () => {
        verifyFieldDataForReferenceDocs([
            'task.description',
            'task.descriptionWithoutTags',
            'task.priorityNumber',
            'task.priorityName',
            'task.priorityNameGroupText',
            'task.urgency',
            'task.isRecurring',
            'task.recurrenceRule',
            'task.onCompletion',
            'task.tags',
            // 'task.indentation', // Cannot just use length to determine if sub-task, as it many be '> ' due to being in a sub-task
            // 'task.listMarker', // Not a priority to release
            // 'task.blockLink', // Release support for grouping by task.blockLink, after removing the leading space and maybe the carat
            'task.originalMarkdown',
            'task.lineNumber',
            'task.listMarker',
        ]);
    });
    it('file properties', () => {
        verifyFieldDataForReferenceDocs([
            'task.file.path',
            'task.file.pathWithoutExtension',
            'task.file.root',
            'task.file.folder',
            'task.file.filename',
            'task.file.filenameWithoutExtension',
            'task.hasHeading',
            'task.heading',
        ]);
    });
    it('links', () => {
        // This is getting annoying, having to do this repeatedly.
        LinkResolver_1.LinkResolver.getInstance().setGetFirstLinkpathDestFn(obsidian_1.getFirstLinkpathDest);
        const tasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('links_everywhere');
        verifyFieldDataFromTasksForReferenceDocs(tasks, [
            'task.outlinks',
            'task.file.outlinksInProperties',
            'task.file.outlinksInBody',
            'task.file.outlinks',
        ]);
    });
    it('frontmatter properties', () => {
        const tasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('docs_sample_for_task_properties_reference');
        // Show just the first task:
        verifyFieldDataFromTasksForReferenceDocs(tasks.slice(0, 1), [
            "task.file.hasProperty('creation date')",
            "task.file.property('creation date')",
            "task.file.property('sample_checkbox_property')",
            "task.file.property('sample_date_property')",
            "task.file.property('sample_date_and_time_property')",
            "task.file.property('sample_list_property')",
            "task.file.property('sample_number_property')",
            "task.file.property('sample_text_property')",
            "task.file.property('sample_text_multiline_property')",
            "task.file.property('sample_link_property')",
            "task.file.property('sample_link_list_property')",
            "task.file.property('tags')",
            "task.file.property('nested_data').surname",
            "task.file.property('nested_data').firstname",
            "task.file.property('nested_data')['middle name']",
            "task.file.property('object_serialization').nested1",
            "task.file.property('object_serialization').nested2",
            // 'task.file.tags', // TODO Replace
            // 'task.file.tags()', // TODO Implement
            // "task.file.tags('body')", // TODO Implement
            // "task.file.tags('properties')", // TODO Implement
        ]);
    });
});
//# sourceMappingURL=TaskProperties.test.js.map