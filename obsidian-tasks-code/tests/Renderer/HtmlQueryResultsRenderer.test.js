"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment/moment"));
const GlobalFilter_1 = require("../../src/Config/GlobalFilter");
const GlobalQuery_1 = require("../../src/Config/GlobalQuery");
const Settings_1 = require("../../src/Config/Settings");
const Cache_1 = require("../../src/Obsidian/Cache");
const QueryRendererHelper_1 = require("../../src/Query/QueryRendererHelper");
const HtmlQueryResultsRenderer_1 = require("../../src/Renderer/HtmlQueryResultsRenderer");
const obsidian_1 = require("../__mocks__/obsidian");
const SimulatedFile_1 = require("../Obsidian/SimulatedFile");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const TasksFileHelpers_1 = require("../TestingTools/TasksFileHelpers");
const RenderingTestHelpers_1 = require("./RenderingTestHelpers");
window.moment = moment_1.default;
function makeHtmlRenderer(source, tasksFile, allTasks) {
    const query = (0, QueryRendererHelper_1.getQueryForQueryRenderer)(source, GlobalQuery_1.GlobalQuery.getInstance(), tasksFile);
    const renderer = new HtmlQueryResultsRenderer_1.HtmlQueryResultsRenderer(() => Promise.resolve(), null, obsidian_1.mockApp, RenderingTestHelpers_1.mockHTMLRenderer, (0, RenderingTestHelpers_1.makeHtmlQueryRendererParameters)(allTasks), source, tasksFile, query);
    return { query, renderer };
}
async function verifyRenderedHtml(allTasks, source, state = Cache_1.State.Warm) {
    const tasksFile = (0, TasksFileHelpers_1.createTestTasksFile)('query.md');
    const { query, renderer } = makeHtmlRenderer(source, tasksFile, allTasks);
    const container = document.createElement('div');
    renderer.content = container;
    await renderer.renderQuery(state, query.applyQueryToTasks(allTasks));
    (0, RenderingTestHelpers_1.verifyRenderedTasks)(container, allTasks);
}
async function renderTasks(state, renderer, allTasks, query) {
    const container = document.createElement('div');
    renderer.content = container;
    await renderer.renderQuery(state, query.applyQueryToTasks(allTasks));
    return container;
}
beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-07-05'));
});
afterEach(() => {
    jest.useRealTimers();
    GlobalFilter_1.GlobalFilter.getInstance().reset();
    GlobalQuery_1.GlobalQuery.getInstance().reset();
    (0, Settings_1.resetSettings)();
});
describe('HtmlQueryResultsRenderer tests', () => {
    it('loading message', async () => {
        const allTasks = [TaskBuilder_1.TaskBuilder.createFullyPopulatedTask()];
        await verifyRenderedHtml(allTasks, 'show urgency', Cache_1.State.Initializing);
    });
    it('error message', async () => {
        const allTasks = [TaskBuilder_1.TaskBuilder.createFullyPopulatedTask()];
        await verifyRenderedHtml(allTasks, 'apple sauce');
    });
    it('error message with angle brackets', async () => {
        const allTasks = [TaskBuilder_1.TaskBuilder.createFullyPopulatedTask()];
        await verifyRenderedHtml(allTasks, 'price<10 & value>5');
    });
    it('error message with ampersand and quotes', async () => {
        const allTasks = [TaskBuilder_1.TaskBuilder.createFullyPopulatedTask()];
        await verifyRenderedHtml(allTasks, 'this & that "test"');
    });
    it('explain', async () => {
        GlobalQuery_1.GlobalQuery.getInstance().set('hide toolbar');
        const allTasks = [TaskBuilder_1.TaskBuilder.createFullyPopulatedTask()];
        await verifyRenderedHtml(allTasks, 'scheduled 1970-01-01\nexplain');
    });
    it('task count', async () => {
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_1parent1child');
        const query = `
hide toolbar
hide backlinks
hide edit button
`;
        await verifyRenderedHtml(allTasks, query);
    });
    it('task count - limit exceeded', async () => {
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_1parent1child');
        const query = `
hide toolbar
hide backlinks
hide edit button

limit 1
`;
        // In the built plugin, the task count shows '1 task` - see #3724
        // In this approved file, the task count is correctly '1 of 2 tasks'.
        // This suggests the error may be outside HtmlQueryResultsRenderer
        await verifyRenderedHtml(allTasks, query);
    });
    it('fully populated task - hidden fields', async () => {
        const allTasks = [TaskBuilder_1.TaskBuilder.createFullyPopulatedTask()];
        await verifyRenderedHtml(allTasks, 'hide scheduled date\nhide priority');
    });
    const showTree = 'show tree\n';
    const hideTree = 'hide tree\n';
    it('parent-child items hidden', async () => {
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_rendering_sample');
        await verifyRenderedHtml(allTasks, hideTree + 'sort by function task.lineNumber');
    });
    it('parent-child items', async () => {
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_rendering_sample');
        await verifyRenderedHtml(allTasks, showTree + 'sort by function task.lineNumber');
    });
    it('parent-child items reverse sorted', async () => {
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_rendering_sample');
        await verifyRenderedHtml(allTasks, showTree + 'sort by function reverse task.lineNumber');
    });
    it('should render tasks without their parents', async () => {
        // example chosen to match subtasks whose parents do not match the query
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_task_2listitem_3task');
        await verifyRenderedHtml(allTasks, showTree + 'description includes grandchild');
    });
    it('should render non task check box when global filter is enabled', async () => {
        GlobalFilter_1.GlobalFilter.getInstance().set('#task');
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_non_task_child');
        await verifyRenderedHtml(allTasks, showTree);
    });
    it('should render four group headings', async () => {
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_task_2listitem_3task');
        await verifyRenderedHtml(allTasks, `
group by function task.description.length
group by function 'level2'
group by function 'level3'
group by function 'level4'
`);
    });
    it('should allow a task to be in multiple groups', async () => {
        const allTasks = [TaskBuilder_1.TaskBuilder.createFullyPopulatedTask()];
        await verifyRenderedHtml(allTasks, "group by function ['heading a', 'heading b']");
    });
    it('should indent nested tasks', async () => {
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_1parent2children2grandchildren1sibling_start_with_heading');
        await verifyRenderedHtml(allTasks, 'show tree');
    });
    it('should render grandchildren once under the parent', async () => {
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_1parent2children2grandchildren1sibling');
        await verifyRenderedHtml(allTasks, `
show tree
sort by function task.lineNumber
(description includes grandchild) OR (description includes parent)
        `);
    });
    it('should render grandchildren once and on the same level as parent', async () => {
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_1parent2children2grandchildren1sibling');
        await verifyRenderedHtml(allTasks, `
show tree
sort by function reverse task.lineNumber
(description includes grandchild) OR (description includes parent)
        `);
    });
});
describe('Reusing HtmlQueryResultsRenderer', () => {
    const tasksFile = (0, TasksFileHelpers_1.createTestTasksFile)('anywhere.md');
    it('should render the same thing twice - tree', async () => {
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_1parent2children2grandchildren1sibling_start_with_heading');
        const source = 'show tree';
        const { renderer, query } = makeHtmlRenderer(source, tasksFile, allTasks);
        const container = await renderTasks(Cache_1.State.Warm, renderer, allTasks, query);
        (0, RenderingTestHelpers_1.verifyRenderedTasks)(container, allTasks);
        const rerenderedContainer = await renderTasks(Cache_1.State.Warm, renderer, allTasks, query);
        (0, RenderingTestHelpers_1.verifyRenderedTasks)(rerenderedContainer, allTasks);
    });
    it('should render the same thing twice - flat', async () => {
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_1parent2children2grandchildren1sibling_start_with_heading');
        const source = 'hide tree';
        const { renderer, query } = makeHtmlRenderer(source, tasksFile, allTasks);
        const container = await renderTasks(Cache_1.State.Warm, renderer, allTasks, query);
        (0, RenderingTestHelpers_1.verifyRenderedTasks)(container, allTasks);
        const rerenderedContainer = await renderTasks(Cache_1.State.Warm, renderer, allTasks, query);
        (0, RenderingTestHelpers_1.verifyRenderedTasks)(rerenderedContainer, allTasks);
    });
});
describe('HtmlQueryResultsRenderer - task count location setting', () => {
    const tasksFile = (0, TasksFileHelpers_1.createTestTasksFile)('query.md');
    const source = 'hide toolbar\nhide backlinks\nhide edit button';
    const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_1parent1child');
    async function renderAndGetTaskCount(source, tasksFile, allTasks) {
        const { query, renderer } = makeHtmlRenderer(source, tasksFile, allTasks);
        const container = await renderTasks(Cache_1.State.Warm, renderer, allTasks, query);
        const taskCount = container.querySelector('.task-count');
        const taskList = container.querySelector('.plugin-tasks-query-result');
        const children = Array.from(container.children);
        const taskListIndex = children.indexOf(taskList);
        const taskCountIndex = children.indexOf(taskCount);
        return { taskListIndex, taskCountIndex };
    }
    it('should render task count at bottom by default', async () => {
        const { taskListIndex, taskCountIndex } = await renderAndGetTaskCount(source, tasksFile, allTasks);
        expect(taskCountIndex).toBeGreaterThan(taskListIndex);
    });
    it('should render task count at top when setting is top', async () => {
        (0, Settings_1.updateSettings)({ searchResults: { taskCountLocation: 'top' } });
        const { taskListIndex, taskCountIndex } = await renderAndGetTaskCount(source, tasksFile, allTasks);
        expect(taskCountIndex).toBeLessThan(taskListIndex);
    });
    it('should render task count at bottom when setting is bottom', async () => {
        (0, Settings_1.updateSettings)({ searchResults: { taskCountLocation: 'bottom' } });
        const { taskListIndex, taskCountIndex } = await renderAndGetTaskCount(source, tasksFile, allTasks);
        expect(taskCountIndex).toBeGreaterThan(taskListIndex);
    });
});
describe('HtmlQueryResultsRenderer - internal heading links', () => {
    let tasksByHeading;
    beforeAll(() => {
        const allTasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('internal_heading_links');
        tasksByHeading = allTasks.reduce((acc, task) => {
            const heading = task.taskLocation.precedingHeader ?? '';
            // For now, the test design only supports one task per heading, so make it an error
            // if there are multiple tasks in this heading:
            if (acc[heading]) {
                throw new Error(`Multiple tasks found under the heading: "${heading}".
The test design only supports one task per heading currently, so this is an error.

Edit "${task.path}" to move one of these lines to a separate heading:
"${acc[heading].originalMarkdown}"
"${task.originalMarkdown}"

And then rerun the command "Templater: Insert _meta/templates/convert_test_data_markdown_to_js.md".

For more info: https://publish.obsidian.md/tasks-contributing/Testing/Using+Obsidian+API+in+tests
`);
            }
            acc[heading] = task;
            return acc;
        }, {});
    });
    async function renderTask(task, queryFilePath = 'query.md') {
        const allTasks = [task];
        const { renderer, query } = makeHtmlRenderer('', (0, TasksFileHelpers_1.createTestTasksFile)(queryFilePath), allTasks);
        const container = document.createElement('div');
        renderer.content = container;
        await renderer.renderQuery(Cache_1.State.Warm, query.applyQueryToTasks(allTasks));
        return container.querySelector('.task-description')?.innerHTML ?? '';
    }
    it('should not modify description when rendering in same file', async () => {
        const description = await renderTask(tasksByHeading['Basic Internal Links'], 'Test Data/internal_heading_links.md');
        expect(description).toMatchInlineSnapshot('"<span>#task Task with<br>[[#Basic Internal Links]]</span>"');
    });
    it('should convert internal heading links when rendering in different file', async () => {
        const description = await renderTask(tasksByHeading['Basic Internal Links'], 'query.md');
        expect(description).toMatchInlineSnapshot('"<span>#task Task with<br>[[Test Data/internal_heading_links.md#Basic Internal Links|Basic Internal Links]]</span>"');
    });
    it('should handle multiple internal heading links in one description', async () => {
        const description = await renderTask(tasksByHeading['Multiple Links In One Task'], 'query.md');
        expect(description).toMatchInlineSnapshot('"<span>#task Task with<br>[[Test Data/internal_heading_links.md#Multiple Links In One Task|Multiple Links In One Task]] and<br>[[Test Data/internal_heading_links.md#Simple Headers|Simple Headers]]</span>"');
    });
    it('should not modify regular file links', async () => {
        const description = await renderTask(tasksByHeading['External File Links'], 'query.md');
        expect(description).toMatchInlineSnapshot('"<span>#task Task with<br>[[Other File]]</span>"');
    });
    it('should handle header links with mixed link types', async () => {
        const description = await renderTask(tasksByHeading['Mixed Link Types'], 'query.md');
        expect(description).toMatchInlineSnapshot('"<span>#task Task with<br>[[Other File]] and<br>[[Test Data/internal_heading_links.md#Mixed Link Types|Mixed Link Types]]</span>"');
    });
    it('should handle header links with file references', async () => {
        const description = await renderTask(tasksByHeading['Header Links With File Reference'], 'query.md');
        expect(description).toMatchInlineSnapshot('"<span>#task<br>[[Test Data/internal_heading_links.md#Header Links With File Reference|Header Links With File Reference]] then<br>[[Other File#Some Header]] and<br>[[Test Data/internal_heading_links.md#Another Header|Another Header]]</span>"');
    });
    it('should handle header links with special characters', async () => {
        const description = await renderTask(tasksByHeading['Headers-With_Special Characters'], 'query.md');
        expect(description).toMatchInlineSnapshot('"<span>#task Task with<br>[[Test Data/internal_heading_links.md#Headers-With_Special Characters|Headers-With_Special Characters]]</span>"');
    });
    it('should handle links with aliases', async () => {
        const description = await renderTask(tasksByHeading['Aliased Links'], 'query.md');
        expect(description).toMatchInlineSnapshot('"<span>#task Task with<br>[[Test Data/internal_heading_links.md#Aliased Links|I am an alias]]</span>"');
    });
    it('should not modify formatted text that looks like links in code blocks', async () => {
        const description = await renderTask(tasksByHeading['Links In Code Blocks'], 'query.md');
        expect(description).toMatchInlineSnapshot('"<span>#task Task with `[[#Links In Code Blocks]]` code block</span>"');
    });
    it('should not modify escaped links', async () => {
        const description = await renderTask(tasksByHeading['Escaped Links'], 'query.md');
        expect(description).toMatchInlineSnapshot('"<span>#task Task with \\[\\[#Escaped Links\\]\\] escaped link</span>"');
    });
});
//# sourceMappingURL=HtmlQueryResultsRenderer.test.js.map