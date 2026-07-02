"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const GlobalQuery_1 = require("../../src/Config/GlobalQuery");
const Settings_1 = require("../../src/Config/Settings");
const Cache_1 = require("../../src/Obsidian/Cache");
const QueryResultsRenderer_1 = require("../../src/Renderer/QueryResultsRenderer");
const obsidian_1 = require("../__mocks__/obsidian");
const ApprovalTestHelpers_1 = require("../TestingTools/ApprovalTestHelpers");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const TasksFileHelpers_1 = require("../TestingTools/TasksFileHelpers");
const RenderingTestHelpers_1 = require("./RenderingTestHelpers");
window.moment = moment_1.default;
beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-12-01'));
});
afterEach(() => {
    jest.useRealTimers();
    (0, Settings_1.resetSettings)();
    GlobalQuery_1.GlobalQuery.getInstance().reset();
});
function makeQueryResultsRenderer(source, tasksFile, allTasks) {
    const htmlQueryRendererParameters = (0, RenderingTestHelpers_1.makeHtmlQueryRendererParameters)(allTasks);
    const queryResultsRenderer = new QueryResultsRenderer_1.QueryResultsRenderer('block-language-tasks', source, tasksFile, () => Promise.resolve(), null, obsidian_1.mockApp, RenderingTestHelpers_1.mockHTMLRenderer, htmlQueryRendererParameters);
    expect(queryResultsRenderer.query.error).toBeUndefined();
    return queryResultsRenderer;
}
async function verifyRenderedHtml(allTasks, source, state = Cache_1.State.Warm) {
    const renderer = makeQueryResultsRenderer(source, (0, TasksFileHelpers_1.createTestTasksFile)('file.md'), allTasks);
    const container = document.createElement('div');
    await renderer.render(state, allTasks, container);
    (0, RenderingTestHelpers_1.verifyRenderedTasks)(container, allTasks);
}
describe('QueryResultsRenderer - accessing results', () => {
    const aTask = [new TaskBuilder_1.TaskBuilder().description('task').build()];
    const twoTasks = [...aTask, new TaskBuilder_1.TaskBuilder().description('another task').build()];
    it('should have empty results before rendering', () => {
        const renderer = makeQueryResultsRenderer('', (0, TasksFileHelpers_1.createTestTasksFile)('file.md'), aTask);
        expect(renderer.queryResult.totalTasksCount).toEqual(0);
        expect(renderer.filteredQueryResult.totalTasksCount).toEqual(0);
    });
    it('should have actual results after rendering', async () => {
        const renderer = makeQueryResultsRenderer('', (0, TasksFileHelpers_1.createTestTasksFile)('file.md'), aTask);
        await renderer.render(Cache_1.State.Warm, aTask, document.createElement('div'));
        expect(renderer.queryResult.totalTasksCount).toEqual(1);
        expect(renderer.filteredQueryResult.totalTasksCount).toEqual(1);
    });
    it('should have actual result after filtering results', async () => {
        const renderer = makeQueryResultsRenderer('', (0, TasksFileHelpers_1.createTestTasksFile)('file.md'), twoTasks);
        await renderer.render(Cache_1.State.Warm, twoTasks, document.createElement('div'));
        await renderer.applySearchBoxFilterAndRerender('another', document.createElement('div'));
        expect(renderer.queryResult.totalTasksCount).toEqual(2);
        expect(renderer.filteredQueryResult.totalTasksCount).toEqual(1);
        expect(await renderer.resultsAsMarkdown()).toMatchInlineSnapshot(`
            "- [ ] another task
            "
        `);
    });
});
describe('QueryResultsRenderer - rendering queries', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-07-05'));
    });
    it('should render the toolbar', async () => {
        const source = 'show toolbar';
        const noTasks = [];
        await verifyRenderedHtml(noTasks, source);
    });
    it('should not render the toolbar', async () => {
        const source = 'hide toolbar';
        const noTasks = [];
        await verifyRenderedHtml(noTasks, source);
    });
    it('fully populated task', async () => {
        // The approved file from this test is embedded in the user documentation,
        // so we ignore any GlobalQuery, to avoid accidental changes to the docs:
        GlobalQuery_1.GlobalQuery.getInstance().reset();
        const allTasks = [TaskBuilder_1.TaskBuilder.createFullyPopulatedTask()];
        await verifyRenderedHtml(allTasks, 'show urgency');
    });
    it('fully populated task - short mode', async () => {
        // The approved file from this test is embedded in the user documentation,
        // so we ignore any GlobalQuery, to avoid accidental changes to the docs:
        GlobalQuery_1.GlobalQuery.getInstance().reset();
        const allTasks = [TaskBuilder_1.TaskBuilder.createFullyPopulatedTask()];
        await verifyRenderedHtml(allTasks, 'show urgency\nshort mode');
    });
    it('should render search-time error', async () => {
        const source = 'sort by function task.linenumer';
        const twoTasks = [
            new TaskBuilder_1.TaskBuilder().description('first').build(),
            new TaskBuilder_1.TaskBuilder().description('second').build(),
        ];
        await verifyRenderedHtml(twoTasks, source);
    });
});
describe('QueryResultsRenderer - responding to file edits', () => {
    it('should update the query when its file path is changed', () => {
        // Arrange
        const source = 'path includes {{query.file.path}}';
        const renderer = makeQueryResultsRenderer(source, (0, TasksFileHelpers_1.createTestTasksFile)('oldPath.md'), []);
        expect(renderer.query.explainQuery()).toContain('path includes oldPath.md');
        // Act
        renderer.setTasksFile((0, TasksFileHelpers_1.createTestTasksFile)('newPath.md'));
        // Assert
        expect(renderer.query.explainQuery()).toContain('path includes newPath.md');
    });
    it('should be able to reread the query when query settings are changed', () => {
        // Arrange
        (0, Settings_1.updateSettings)({ presets: { CurrentGrouping: 'group by PATH' } });
        const source = 'preset CurrentGrouping';
        const renderer = makeQueryResultsRenderer(source, (0, TasksFileHelpers_1.createTestTasksFile)('any file.md'), []);
        expect(renderer.query.explainQuery()).toContain('group by PATH');
        // Act
        (0, Settings_1.updateSettings)({ presets: { CurrentGrouping: 'group by DUE' } });
        renderer.rereadQueryFromFile();
        // Assert
        expect(renderer.query.explainQuery()).toContain('group by DUE');
    });
});
/**
 * See https://github.com/approvals/ApprovalTests.Python/blob/main/docs/reference/storyboard.md
 */
class RendererStoryboard {
    constructor(source, allTasks) {
        this.output = `<html>
<meta charset="UTF-8">
`;
        this.allTasks = allTasks;
        this.renderer = makeQueryResultsRenderer(source, (0, TasksFileHelpers_1.createTestTasksFile)('file.md'), allTasks);
    }
    /**
     * This simulates QueryRenderer.renderResults()
     * Returns the prettified rendered HTML, to allow 'expect' calls to be added.
     * @param description
     */
    async renderAndAddFrame(description) {
        const container = document.createElement('div');
        await this.renderer.render(Cache_1.State.Warm, this.allTasks, container);
        return this.addFrame(description, container);
    }
    addFrame(description, container) {
        this.output += `<h2>${description}:</h2>\n\n`;
        this.output += `<p>Results filter: '${this.renderer.filterString}'</p>\n`;
        const { tasksAsMarkdown, prettyHTML } = (0, RenderingTestHelpers_1.tasksMarkdownAndPrettifiedHtml)(container, this.allTasks);
        this.output += tasksAsMarkdown + prettyHTML;
        return { prettyHTML, container };
    }
    verify() {
        this.output += '</html>\n';
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(this.output, 'html');
    }
}
describe('QueryResultsRenderer - sequences', () => {
    const parent = new TaskBuilder_1.TaskBuilder().description('parent').dueDate('2025-12-01').build();
    const child = new TaskBuilder_1.TaskBuilder().description('child').indentation('  ').id('childID').parent(parent).build();
    const parentAndChild = [parent, child];
    it('global query change to task layout option', async () => {
        // see issue #3702
        const source = 'explain';
        const storyboard = new RendererStoryboard(source, parentAndChild);
        const dueDate = '📅 2025-12-01';
        {
            const { prettyHTML } = await storyboard.renderAndAddFrame('Initial results');
            expect(prettyHTML).toContain(dueDate);
        }
        GlobalQuery_1.GlobalQuery.getInstance().set('hide due date');
        storyboard.renderer.rereadQueryFromFile();
        {
            const { prettyHTML } = await storyboard.renderAndAddFrame('Check that due date is hidden by global query');
            expect(prettyHTML).not.toContain(dueDate);
        }
        storyboard.verify();
    });
    it('global query change to query layout option', async () => {
        const source = 'explain';
        const storyboard = new RendererStoryboard(source, parentAndChild);
        const urgency = '<span class="tasks-urgency">10.75</span>';
        {
            const { prettyHTML } = await storyboard.renderAndAddFrame('Initial results');
            expect(prettyHTML).not.toContain(urgency);
        }
        GlobalQuery_1.GlobalQuery.getInstance().set('show urgency');
        storyboard.renderer.rereadQueryFromFile();
        {
            const { prettyHTML } = await storyboard.renderAndAddFrame('Check that urgency is shown by global query');
            expect(prettyHTML).toContain(urgency);
        }
        storyboard.verify();
    });
    it('rerendered results retain the filter', async () => {
        const storyboard = new RendererStoryboard('', parentAndChild);
        const { container } = await storyboard.renderAndAddFrame('Initial results - expect 2 tasks');
        await storyboard.renderer.applySearchBoxFilterAndRerender('parent', container);
        storyboard.addFrame('Filtered results (parent) - expect 1 task', container);
        GlobalQuery_1.GlobalQuery.getInstance().set('sort by function reverse task.description.length');
        storyboard.renderer.rereadQueryFromFile();
        await storyboard.renderAndAddFrame('Filtered results after editing Global Query - expect same 1 task');
        storyboard.verify();
    });
});
//# sourceMappingURL=QueryResultsRenderer.test.js.map