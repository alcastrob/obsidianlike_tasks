"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QueryContext_1 = require("../../src/Scripting/QueryContext");
const VerifyMarkdown_1 = require("../TestingTools/VerifyMarkdown");
const MarkdownTable_1 = require("../../src/lib/MarkdownTable");
const TaskExpression_1 = require("../../src/Scripting/TaskExpression");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const MockDataHelpers_1 = require("../TestingTools/MockDataHelpers");
const LinkResolver_1 = require("../../src/Task/LinkResolver");
const obsidian_1 = require("../__mocks__/obsidian");
const MockDataLoader_1 = require("../TestingTools/MockDataLoader");
const TasksFileHelpers_1 = require("../TestingTools/TasksFileHelpers");
const ScriptingTestHelpers_1 = require("./ScriptingTestHelpers");
beforeEach(() => { });
afterEach(() => {
    LinkResolver_1.LinkResolver.getInstance().resetGetFirstLinkpathDestFn();
});
describe('query', () => {
    function verifyFieldDataForReferenceDocs(fields) {
        const markdownTable = new MarkdownTable_1.MarkdownTable(['Field', 'Type', 'Example']);
        const testDataName = 'query_using_properties';
        const query_using_properties = MockDataLoader_1.MockDataLoader.get(testDataName);
        const cachedMetadata = (0, MockDataHelpers_1.getTasksFileFromMockData)(testDataName).cachedMetadata;
        // This is getting annoying, having to do this repeatedly.
        LinkResolver_1.LinkResolver.getInstance().setGetFirstLinkpathDestFn((rawLink, _sourcePath) => (0, obsidian_1.getFirstLinkpathDestFromData)(query_using_properties, rawLink));
        const tasksFile = (0, TasksFileHelpers_1.createTestTasksFile)('root/sub-folder/file containing query.md', cachedMetadata);
        const task = new TaskBuilder_1.TaskBuilder()
            .description('... an array with all the Tasks-tracked tasks in the vault ...')
            .build();
        const queryContext = (0, QueryContext_1.makeQueryContextWithTasks)(tasksFile, [task]);
        for (const field of fields) {
            const value1 = (0, TaskExpression_1.parseAndEvaluateExpression)(task, field, queryContext);
            const cells = [
                (0, ScriptingTestHelpers_1.addBackticks)(field),
                (0, ScriptingTestHelpers_1.addBackticks)((0, ScriptingTestHelpers_1.determineExpressionType)(value1)),
                (0, ScriptingTestHelpers_1.addBackticks)((0, ScriptingTestHelpers_1.formatToRepresentType)(value1)),
            ];
            markdownTable.addRow(cells);
        }
        (0, VerifyMarkdown_1.verifyMarkdownForDocs)(markdownTable.markdown);
    }
    it('file properties', () => {
        verifyFieldDataForReferenceDocs([
            'query.file.path',
            'query.file.pathWithoutExtension',
            'query.file.root',
            'query.file.folder',
            'query.file.filename',
            'query.file.filenameWithoutExtension',
            "query.file.hasProperty('task_instruction')",
            "query.file.hasProperty('non_existent_property')",
            "query.file.property('task_instruction')",
            "query.file.property('non_existent_property')",
            'query.file.outlinksInProperties',
            'query.file.outlinksInBody',
            'query.file.outlinks',
        ]);
    });
    it('search properties', () => {
        verifyFieldDataForReferenceDocs(['query.allTasks']);
    });
});
//# sourceMappingURL=QueryProperties.test.js.map