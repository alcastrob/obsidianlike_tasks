"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment/moment"));
const GlobalFilter_1 = require("../../src/Config/GlobalFilter");
const Cache_1 = require("../../src/Obsidian/Cache");
const Priority_1 = require("../../src/Task/Priority");
const SimulatedFile_1 = require("../Obsidian/SimulatedFile");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const TestHelpers_1 = require("../TestingTools/TestHelpers");
const RenderingTestHelpers_1 = require("./RenderingTestHelpers");
window.moment = moment_1.default;
afterEach(() => {
    GlobalFilter_1.GlobalFilter.getInstance().reset();
});
describe('MarkdownQueryResultsRenderer tests', () => {
    it('should render single task', async () => {
        const { markdown } = await (0, RenderingTestHelpers_1.renderMarkdown)('hide tree', [
            new TaskBuilder_1.TaskBuilder().description('hello').priority(Priority_1.Priority.Medium).build(),
        ]);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] hello 🔼
            "
        `);
    });
    it('should render single task twice', async () => {
        const source = 'hide tree';
        const { renderer, query } = (0, RenderingTestHelpers_1.createMarkdownRenderer)(source);
        const task = [new TaskBuilder_1.TaskBuilder().description('hello').priority(Priority_1.Priority.Medium).build()];
        await renderer.renderQuery(Cache_1.State.Warm, query.applyQueryToTasks(task));
        const r1 = renderer.markdown;
        await renderer.renderQuery(Cache_1.State.Warm, query.applyQueryToTasks(task));
        const r2 = renderer.markdown;
        expect(r1).toEqual(r2);
    });
    it('should render two tasks', async () => {
        const { markdown } = await (0, RenderingTestHelpers_1.renderMarkdown)('hide tree\nsort by priority reverse', [
            new TaskBuilder_1.TaskBuilder().description('hello').priority(Priority_1.Priority.Medium).build(),
            new TaskBuilder_1.TaskBuilder().description('bye').priority(Priority_1.Priority.High).build(),
        ]);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] hello 🔼
            - [ ] bye ⏫
            "
        `);
    });
    it('should write one grouping level', async () => {
        const tasks = (0, TestHelpers_1.fromMarkdown)(`
- [ ] 4444
- [ ] 333
- [ ] 55555
`);
        const { markdown } = await (0, RenderingTestHelpers_1.renderMarkdown)('hide tree\ngroup by function task.description.length', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            #### 3

            - [ ] 333

            #### 4

            - [ ] 4444

            #### 5

            - [ ] 55555
            "
        `);
    });
    it('should write four grouping levels', async () => {
        const tasks = (0, TestHelpers_1.fromMarkdown)(`
- [ ] 1 ⏳ 2025-10-29
- [ ] 2 ⏬
- [ ] 3 ⏫ ⏳ 2025-10-30
- [ ] 4 ⏳ 2025-10-29
- [ ] 5 #something
- [ ] 6 🆔 id6
`);
        const { markdown } = await (0, RenderingTestHelpers_1.renderMarkdown)(`
group by function task.tags.join(',')
group by priority
group by scheduled
group by id
`, tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            ##### %%1%%High priority

            ###### 2025-10-30 Thursday

            - [ ] 3 ⏫ ⏳ 2025-10-30

            ##### %%3%%Normal priority

            ###### 2025-10-29 Wednesday

            - [ ] 1 ⏳ 2025-10-29
            - [ ] 4 ⏳ 2025-10-29

            ###### No scheduled date

            ###### id6

            - [ ] 6 🆔 id6

            ##### %%5%%Lowest priority

            ###### No scheduled date

            - [ ] 2 ⏬

            #### #something

            ##### %%3%%Normal priority

            ###### No scheduled date

            - [ ] 5 #something
            "
        `);
    });
    it('should remove indentation for nested tasks', async () => {
        const tasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_2roots_listitem_listitem_task');
        const { markdown } = await (0, RenderingTestHelpers_1.renderMarkdown)('', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] grandchild task 1
            - [ ] grandchild task 2
            "
        `);
    });
    it('should indent nested tasks', async () => {
        const tasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_1parent2children2grandchildren1sibling_start_with_heading');
        const { markdown } = await (0, RenderingTestHelpers_1.renderMarkdown)('show tree', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] #task parent task
                - [ ] #task child task 1
                    - [ ] #task grandchild 1
                - [ ] #task child task 2
                    - [ ] #task grandchild 2
            - [ ] #task sibling
            "
`);
    });
    it('should indent nested list items', async () => {
        const tasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_task_2listitem_3task');
        const { markdown } = await (0, RenderingTestHelpers_1.renderMarkdown)('show tree', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] parent task
                - child list item 1
                    - [ ] grandchild task 1
                    - [ ] grandchild task 2
                - child list item 2
                    - [ ] grandchild task 3
            "
        `);
    });
    it('should render status of non-task list items', async () => {
        GlobalFilter_1.GlobalFilter.getInstance().set('#task');
        const tasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('inheritance_non_task_child');
        const { markdown } = await (0, RenderingTestHelpers_1.renderMarkdown)('show tree', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] #task task parent
                - [ ] #task task child
                - [ ] non-task child
                - [x] non-task child status x
                - list item child
            "
        `);
    });
    it('should use hyphen as list marker', async () => {
        const tasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('mixed_list_markers');
        const { markdown } = await (0, RenderingTestHelpers_1.renderMarkdown)('', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] hyphen
            - [ ] asterisk
            - [ ] plus
            - [ ] numbered task with dot
            - [ ] numbered task with parenthesis
            "
        `);
    });
    it('should remove callout prefixes', async () => {
        const tasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('callout_labelled');
        const { markdown } = await (0, RenderingTestHelpers_1.renderMarkdown)('', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] #task Task in 'callout_labelled'
            - [ ] #task Task indented in 'callout_labelled'
            "
        `);
    });
    it('should render the explanation', async () => {
        const tasks = (0, SimulatedFile_1.readTasksFromSimulatedFile)('callout_labelled');
        const { markdown } = await (0, RenderingTestHelpers_1.renderMarkdown)('explain\ndescription includes indented', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            Explanation of this Tasks code block query:

              description includes indented

            - [ ] #task Task indented in 'callout_labelled'
            "
        `);
    });
    it('should render an error', async () => {
        const { markdown } = await (0, RenderingTestHelpers_1.renderMarkdown)('abracadabra', []);
        expect(markdown).toMatchInlineSnapshot(`
            "
            do not understand query
            Problem line: "abracadabra""
        `);
    });
});
//# sourceMappingURL=MarkdownQueryResultsRenderer.test.js.map