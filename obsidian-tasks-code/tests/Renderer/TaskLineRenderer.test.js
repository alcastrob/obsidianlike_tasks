"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const DebugSettings_1 = require("../../src/Config/DebugSettings");
const GlobalFilter_1 = require("../../src/Config/GlobalFilter");
const Settings_1 = require("../../src/Config/Settings");
const QueryLayoutOptions_1 = require("../../src/Layout/QueryLayoutOptions");
const TaskLayoutOptions_1 = require("../../src/Layout/TaskLayoutOptions");
const DateParser_1 = require("../../src/DateTime/DateParser");
const TaskLineRenderer_1 = require("../../src/Renderer/TaskLineRenderer");
const TaskRegularExpressions_1 = require("../../src/Task/TaskRegularExpressions");
const ApprovalTestHelpers_1 = require("../TestingTools/ApprovalTestHelpers");
const HTMLHelpers_1 = require("../TestingTools/HTMLHelpers");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const TestHelpers_1 = require("../TestingTools/TestHelpers");
const obsidian_1 = require("../__mocks__/obsidian");
const RenderingTestHelpers_1 = require("./RenderingTestHelpers");
jest.mock('obsidian');
window.moment = moment_1.default;
/**
 * Renders a task for test purposes and returns the rendered ListItem.
 *
 * @param task to be rendered
 *
 * @param taskLayoutOptions for the task rendering. Skip for default options. See {@link TaskLayoutOptions}.
 *
 * @param testRenderer imitates Obsidian rendering. Skip for the default {@link mockTextRenderer}.
 *
 * @param queryLayoutOptions for the task rendering. Skip for default options. See {@link QueryLayoutOptions}.
 */
async function renderListItem(task, taskLayoutOptions, queryLayoutOptions, testRenderer) {
    const taskLineRenderer = new TaskLineRenderer_1.TaskLineRenderer({
        textRenderer: testRenderer ?? RenderingTestHelpers_1.mockTextRenderer,
        obsidianApp: obsidian_1.mockApp,
        obsidianComponent: null,
        taskLayoutOptions: taskLayoutOptions ?? new TaskLayoutOptions_1.TaskLayoutOptions(),
        queryLayoutOptions: queryLayoutOptions ?? new QueryLayoutOptions_1.QueryLayoutOptions(),
    });
    const divElement = document.createElement('div');
    const li = (0, TaskLineRenderer_1.createAndAppendElement)('li', divElement);
    await taskLineRenderer.renderTaskLine({
        li: li,
        task: task,
        taskIndex: 0,
        isTaskInQueryFile: true,
    });
    return li;
}
function getTextSpan(listItem) {
    return listItem.children[1];
}
function getDescriptionText(listItem) {
    const textSpan = getTextSpan(listItem);
    return textSpan.children[0].children[0].innerText;
}
/**
 * Returns an array with the components of a List Item as strings.
 */
function getListItemComponents(listItem) {
    const components = [getDescriptionText(listItem)];
    const textSpan = getTextSpan(listItem);
    for (const innerSpan of Array.from(textSpan.children)) {
        if (innerSpan.textContent) {
            components.push(innerSpan.textContent);
        }
    }
    return components;
}
afterEach(() => {
    GlobalFilter_1.GlobalFilter.getInstance().reset();
    GlobalFilter_1.GlobalFilter.getInstance().setRemoveGlobalFilter(false);
    (0, Settings_1.resetSettings)();
});
describe('task line rendering - HTML', () => {
    it('creates the correct span structure for a basic task inside a List Item', async () => {
        const taskLine = '- [ ] This is a simple task';
        const task = (0, TestHelpers_1.fromLine)({
            line: taskLine,
        });
        const listItem = await renderListItem(task);
        // Check that it has two children: a checkbox and a text span
        expect(listItem.children.length).toEqual(2);
        const checkbox = listItem.children[0];
        expect(checkbox.nodeName).toEqual('INPUT');
        expect(checkbox.classList.contains('task-list-item-checkbox')).toBeTruthy();
        const textSpan = listItem.children[1];
        expect(textSpan.nodeName).toEqual('SPAN');
        expect(textSpan.classList.contains('tasks-list-text')).toBeTruthy();
        // Check that the text span contains a single description span
        expect(textSpan.children.length).toEqual(1);
        const descriptionSpan = textSpan.children[0];
        expect(descriptionSpan.nodeName).toEqual('SPAN');
        expect(descriptionSpan.className).toEqual('task-description');
        // Check that the description span contains an internal span (see taskToHtml for an explanation why it's there)
        expect(descriptionSpan.children.length).toEqual(1);
        const internalDescriptionSpan = descriptionSpan.children[0];
        expect(internalDescriptionSpan.nodeName).toEqual('SPAN');
        // Check that eventually the correct text was rendered
        expect(internalDescriptionSpan.innerText).toEqual('This is a simple task');
    });
});
describe('task line rendering - global filter', () => {
    const getDescriptionTest = async (taskLine) => {
        const task = (0, TestHelpers_1.fromLine)({
            line: taskLine,
        });
        const listItem = await renderListItem(task);
        return getDescriptionText(listItem);
    };
    it('should render Global Filter when the Remove Global Filter is off', async () => {
        GlobalFilter_1.GlobalFilter.getInstance().setRemoveGlobalFilter(false);
        GlobalFilter_1.GlobalFilter.getInstance().set('#global');
        const taskLine = '- [ ] This is a simple task with a #global filter';
        const descriptionWithFilter = await getDescriptionTest(taskLine);
        expect(descriptionWithFilter).toEqual('This is a simple task with a #global filter');
    });
    it('should not render Global Filter when the Remove Global Filter is on', async () => {
        GlobalFilter_1.GlobalFilter.getInstance().setRemoveGlobalFilter(true);
        GlobalFilter_1.GlobalFilter.getInstance().set('#global');
        const taskLine = '- [ ] #global/subtag-shall-stay This is a simple task with a #global filter';
        const descriptionWithoutFilter = await getDescriptionTest(taskLine);
        expect(descriptionWithoutFilter).toEqual('#global/subtag-shall-stay This is a simple task with a filter');
    });
});
describe('task line rendering - layout options', () => {
    const testLayoutOptions = async (expectedComponents, shownComponents) => {
        const task = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask();
        const taskLayoutOptions = new TaskLayoutOptions_1.TaskLayoutOptions();
        // Hide every layout component:
        TaskLayoutOptions_1.taskLayoutComponents.forEach((component) => {
            taskLayoutOptions.hide(component);
        });
        // Re-enable description
        taskLayoutOptions.setVisibility(TaskLayoutOptions_1.TaskLayoutComponent.Description, true);
        // Re-enable the requested components:
        shownComponents.forEach((hiddenComponent) => {
            taskLayoutOptions.setVisibility(hiddenComponent, true);
        });
        const listItem = await renderListItem(task, taskLayoutOptions);
        const renderedComponents = getListItemComponents(listItem);
        expect(renderedComponents).toEqual(expectedComponents);
    };
    it('renders correctly with the default layout options', async () => {
        await testLayoutOptions([
            'Do exercises #todo #health',
            ' 🆔 abcdef',
            ' ⛔ 123456,abc123',
            ' 🔼',
            ' 🔁 every day when done',
            ' 🏁 delete',
            ' ➕ 2023-07-01',
            ' 🛫 2023-07-02',
            ' ⏳ 2023-07-03',
            ' 📅 2023-07-04',
            ' ❌ 2023-07-06',
            ' ✅ 2023-07-05',
            ' ^dcf64c',
        ], TaskLayoutOptions_1.taskLayoutComponents);
    });
    it('renders a done task correctly with the default layout', async () => {
        await testLayoutOptions([
            'Do exercises #todo #health',
            ' 🆔 abcdef',
            ' ⛔ 123456,abc123',
            ' 🔼',
            ' 🔁 every day when done',
            ' 🏁 delete',
            ' ➕ 2023-07-01',
            ' 🛫 2023-07-02',
            ' ⏳ 2023-07-03',
            ' 📅 2023-07-04',
            ' ❌ 2023-07-06',
            ' ✅ 2023-07-05',
            ' ^dcf64c',
        ], TaskLayoutOptions_1.taskLayoutComponents);
    });
    // NEW_TASK_FIELD_EDIT_REQUIRED
    it('renders with priority', async () => {
        await testLayoutOptions(['Do exercises #todo #health', ' 🔼'], [TaskLayoutOptions_1.TaskLayoutComponent.Priority]);
    });
    it('renders with recurrence rule', async () => {
        await testLayoutOptions(['Do exercises #todo #health', ' 🔁 every day when done'], [TaskLayoutOptions_1.TaskLayoutComponent.RecurrenceRule]);
    });
    it('renders with created date', async () => {
        await testLayoutOptions(['Do exercises #todo #health', ' ➕ 2023-07-01'], [TaskLayoutOptions_1.TaskLayoutComponent.CreatedDate]);
    });
    it('renders with start date', async () => {
        await testLayoutOptions(['Do exercises #todo #health', ' 🛫 2023-07-02'], [TaskLayoutOptions_1.TaskLayoutComponent.StartDate]);
    });
    it('renders with scheduled date', async () => {
        await testLayoutOptions(['Do exercises #todo #health', ' ⏳ 2023-07-03'], [TaskLayoutOptions_1.TaskLayoutComponent.ScheduledDate]);
    });
    it('renders with due date', async () => {
        await testLayoutOptions(['Do exercises #todo #health', ' 📅 2023-07-04'], [TaskLayoutOptions_1.TaskLayoutComponent.DueDate]);
    });
    it('renders with done date', async () => {
        await testLayoutOptions(['Do exercises #todo #health', ' ✅ 2023-07-05'], [TaskLayoutOptions_1.TaskLayoutComponent.DoneDate]);
    });
    it('renders with cancelled date', async () => {
        await testLayoutOptions(['Do exercises #todo #health', ' ❌ 2023-07-06'], [TaskLayoutOptions_1.TaskLayoutComponent.CancelledDate]);
    });
    it('renders with id', async () => {
        await testLayoutOptions(['Do exercises #todo #health', ' 🆔 abcdef'], [TaskLayoutOptions_1.TaskLayoutComponent.Id]);
    });
    it('renders with depends on', async () => {
        await testLayoutOptions(['Do exercises #todo #health', ' ⛔ 123456,abc123'], [TaskLayoutOptions_1.TaskLayoutComponent.DependsOn]);
    });
    it('renders with onCompletion', async () => {
        await testLayoutOptions(['Do exercises #todo #health', ' 🏁 delete'], [TaskLayoutOptions_1.TaskLayoutComponent.OnCompletion]);
    });
});
describe('task line rendering - errors in task fields', () => {
    const testLayoutOptionsFromLine = async (taskLine, expectedComponents) => {
        const task = (0, TestHelpers_1.fromLine)({
            line: taskLine,
        });
        const listItem = await renderListItem(task);
        const renderedComponents = getListItemComponents(listItem);
        expect(renderedComponents).toEqual(expectedComponents);
    };
    it('writes a placeholder message if a date is invalid', async () => {
        await testLayoutOptionsFromLine('- [ ] Task with invalid due date 📅 2023-13-02', [
            'Task with invalid due date',
            ' 📅 Invalid date',
        ]);
    });
    it('standardise the recurrence rule, even if the rule is invalid', async () => {
        await testLayoutOptionsFromLine('- [ ] Task with invalid recurrence rule 🔁 every month on the 32nd', [
            'Task with invalid recurrence rule',
            ' 🔁 every month on the 32th',
        ]);
    });
});
describe('task line rendering - debug info rendering', () => {
    it('renders debug info if requested', async () => {
        // Disable sort instructions
        (0, Settings_1.updateSettings)({ debugSettings: new DebugSettings_1.DebugSettings(false, true) });
        const task = (0, TestHelpers_1.fromLine)({
            line: '- [ ] Task with debug info',
            path: 'a/b/c.d',
            precedingHeader: 'Previous Heading',
        });
        const listItem = await renderListItem(task);
        const renderedDescription = getDescriptionText(listItem);
        expect(renderedDescription).toEqual("Task with debug info<br>🐛 <b>0</b> . 0 . 0 . '<code>- [ ] Task with debug info</code>'<br>'<code>a/b/c.d</code>' > '<code>Previous Heading</code>'<br>");
    });
});
describe('task line rendering - classes and data attributes', () => {
    const testComponentClasses = async (taskLine, mainClass, attributes) => {
        const task = (0, TestHelpers_1.fromLine)({
            line: taskLine,
        });
        const listItem = await renderListItem(task);
        expect(listItem).toHaveAChildSpanWithClassAndDataAttributes(mainClass, attributes);
    };
    // NEW_TASK_FIELD_EDIT_REQUIRED
    it('should render priority component with its class and data attribute', async () => {
        await testComponentClasses('- [ ] Full task ⏫ ⏳ 2022-07-03 🛫 2022-07-04 🔁 every day', 'task-priority', 'taskPriority: high');
        await testComponentClasses('- [ ] Full task 🔼 📅 2022-07-02 ⏳ 2022-07-03 🛫 2022-07-04 🔁 every day', 'task-priority', 'taskPriority: medium');
        await testComponentClasses('- [ ] Full task 🔽 📅 2022-07-02 ⏳ 2022-07-03 🛫 2022-07-04 🔁 every day', 'task-priority', 'taskPriority: low');
    });
    it('renders dependency fields with their correct classes', async () => {
        await testComponentClasses('- [ ] Minimal task 🆔 g7317o', 'task-id', '');
        await testComponentClasses('- [ ] Minimal task ⛔ ya44g5,hry475', 'task-dependsOn', '');
    });
    it('should render recurrence component with its class and data attribute', async () => {
        await testComponentClasses('- [ ] Full task ⏫ 📅 2022-07-02 ⏳ 2022-07-03 🛫 2022-07-04 🔁 every day', 'task-recurring', '');
    });
    it('should render date component with its class and data attribute with "today" value', async () => {
        const today = DateParser_1.DateParser.parseDate('today').format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat);
        // This test ensures that all date fields are handled correctly.
        await testComponentClasses(`- [ ] Full task ⏫ ➕ ${today}`, 'task-created', 'taskCreated: today');
        await testComponentClasses(`- [ ] Full task ⏫ 📅 ${today}`, 'task-due', 'taskDue: today');
        await testComponentClasses(`- [ ] Full task ⏫ ⏳ ${today}`, 'task-scheduled', 'taskScheduled: today');
        await testComponentClasses(`- [ ] Full task ⏫ 🛫 ${today}`, 'task-start', 'taskStart: today');
        await testComponentClasses(`- [x] Done task ✅ ${today}`, 'task-done', 'taskDone: today');
        await testComponentClasses(`- [-] Canc task ❌ ${today}`, 'task-cancelled', 'taskCancelled: today');
    });
    // Now that we know that 'today' is correctly added to all date fields, the remaining tests
    // only need to test a single date field.
    it('should render date component with its class and data attribute with "future-1d" value', async () => {
        const future = DateParser_1.DateParser.parseDate('tomorrow').format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat);
        await testComponentClasses(`- [ ] Full task ⏫ 📅 ${future}`, 'task-due', 'taskDue: future-1d');
    });
    it('should render date component with its class and data attribute with "future-7d" value', async () => {
        const future = DateParser_1.DateParser.parseDate('in 7 days').format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat);
        await testComponentClasses(`- [ ] Full task ⏫ 📅 ${future}`, 'task-due', 'taskDue: future-7d');
    });
    it('should render date component with its class and data attribute with "past-1d" value', async () => {
        const past = DateParser_1.DateParser.parseDate('yesterday').format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat);
        await testComponentClasses(`- [ ] Full task ⏫ 📅 ${past}`, 'task-due', 'taskDue: past-1d');
    });
    it('should render date component with its class and data attribute with "past-7d" value', async () => {
        const past = DateParser_1.DateParser.parseDate('7 days ago').format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat);
        await testComponentClasses(`- [ ] Full task ⏫ 📅 ${past}`, 'task-due', 'taskDue: past-7d');
    });
    it('should render date component with its class and data attribute with "future-far"', async () => {
        const future = DateParser_1.DateParser.parseDate('in 8 days').format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat);
        await testComponentClasses(`- [ ] Full task ⏫ 📅 ${future}`, 'task-due', 'taskDue: future-far');
    });
    it('should render date component with its class and data attribute with "past-far" values', async () => {
        const past = DateParser_1.DateParser.parseDate('8 days ago').format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat);
        await testComponentClasses(`- [ ] Full task ⏫ 📅 ${past}`, 'task-due', 'taskDue: past-far');
    });
    it('should not add data attributes for invalid dates', async () => {
        await testComponentClasses('- [ ] task with invalid due date 📅 2023-02-29', 'task-due', '');
    });
    it.each([
        ['task-priority', 'taskPriority: medium', 'priority'],
        ['task-createdDate', 'taskCreated: past-far', 'createdDate'],
        ['task-dueDate', 'taskDue: past-far', 'dueDate'],
        ['task-scheduledDate', 'taskScheduled: past-far', 'scheduledDate'],
        ['task-startDate', 'taskStart: past-far', 'startDate'],
        ['task-doneDate', 'taskDone: past-far', 'doneDate'],
        ['task-cancelledDate', 'taskCancelled: past-far', 'cancelledDate'],
    ])('should not render "%s" class but should set "%s" data attributes to the list item', async (expectedAbsentClass, expectedDateAttributes, hiddenComponent) => {
        const task = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask();
        const options = new TaskLayoutOptions_1.TaskLayoutOptions();
        options.hide(hiddenComponent);
        const listItem = await renderListItem(task, options);
        expect(listItem).not.toHaveAChildSpanWithClass(expectedAbsentClass);
        expect(listItem).toHaveAmongDataAttributes(expectedDateAttributes);
    });
    /*
     * In this test we try to imitate Obsidian's Markdown renderer more thoroughly than other tests,
     * so we can verify that the rendering code adds the correct tag classes inside the rendered
     * Markdown.
     * Note that this test, just like the code that it tests, assumed a specific rendered structure
     * by Obsidian, which is not guaranteed by the API.
     */
    it('adds tag attributes inside the description span', async () => {
        const taskLine = '- [ ] Class with <a class="tag">#someTag</a>';
        const task = (0, TestHelpers_1.fromLine)({
            line: taskLine,
        });
        const listItem = await renderListItem(task, new TaskLayoutOptions_1.TaskLayoutOptions(), new QueryLayoutOptions_1.QueryLayoutOptions(), RenderingTestHelpers_1.mockHTMLRenderer);
        const textSpan = getTextSpan(listItem);
        const descriptionSpan = textSpan.children[0].children[0];
        expect(descriptionSpan.textContent).toEqual('Class with #someTag');
        const tagSpan = descriptionSpan.children[0];
        expect(tagSpan.textContent).toEqual('#someTag');
        expect(tagSpan.classList[0]).toEqual('tag');
        expect(tagSpan.dataset.tagName).toEqual('#someTag');
    });
    it('sanitizes tag names when put into data attributes', async () => {
        const taskLine = '- [ ] Class with <a class="tag">#illegal"data&attribute</a>';
        const task = (0, TestHelpers_1.fromLine)({
            line: taskLine,
        });
        const listItem = await renderListItem(task, new TaskLayoutOptions_1.TaskLayoutOptions(), new QueryLayoutOptions_1.QueryLayoutOptions(), RenderingTestHelpers_1.mockHTMLRenderer);
        const textSpan = getTextSpan(listItem);
        const descriptionSpan = textSpan.children[0].children[0];
        expect(descriptionSpan.textContent).toEqual('Class with #illegal"data&attribute');
        const tagSpan = descriptionSpan.children[0];
        expect(tagSpan.textContent).toEqual('#illegal"data&attribute');
        expect(tagSpan.classList[0]).toEqual('tag');
        expect(tagSpan.dataset.tagName).toEqual('#illegal-data-attribute');
    });
    const testLiAttributes = async (taskLine, attributes) => {
        const task = (0, TestHelpers_1.fromLine)({
            line: taskLine,
        });
        const listItem = await renderListItem(task);
        for (const attribute of attributes) {
            expect(listItem).toHaveAmongDataAttributes(attribute);
        }
    };
    it('creates data attributes for custom statuses', async () => {
        await testLiAttributes('- [ ] An incomplete task', ['task: ', 'taskStatusName: Todo', 'taskStatusType: TODO']);
        await testLiAttributes('- [x] A complete task', ['task: x', 'taskStatusName: Done', 'taskStatusType: DONE']);
        await testLiAttributes('- [/] In-progress task', [
            'task: /',
            'taskStatusName: In Progress',
            'taskStatusType: IN_PROGRESS',
        ]);
        await testLiAttributes('- [-] In-progress task', [
            'task: -',
            'taskStatusName: Cancelled',
            'taskStatusType: CANCELLED',
        ]);
    });
    it('marks nonexistent task priority as "normal" priority', async () => {
        await testLiAttributes('- [ ] Full task 📅 2022-07-02 ⏳ 2022-07-03 🛫 2022-07-04 🔁 every day', [
            'taskPriority: normal',
        ]);
    });
});
describe('Visualise HTML', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-07-05'));
    });
    afterAll(() => {
        jest.useRealTimers();
    });
    async function renderAndVerifyHTML(task, { taskLayoutOptions, queryLayoutOptions, }) {
        const listItem = await renderListItem(task, taskLayoutOptions, queryLayoutOptions, RenderingTestHelpers_1.mockHTMLRenderer);
        const taskAsMarkdown = `<!--
${task.toFileLineString()}
-->\n\n`;
        const prettyHTML = (0, HTMLHelpers_1.prettifyHTML)(listItem.outerHTML);
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(taskAsMarkdown + prettyHTML, 'html');
    }
    const fullTask = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask();
    const minimalTask = (0, TestHelpers_1.fromLine)({ line: '- [-] empty' });
    function layoutOptionsFullMode() {
        return {
            taskLayoutOptions: new TaskLayoutOptions_1.TaskLayoutOptions(), // makes the assumption that all the field are shown by default
            queryLayoutOptions: new QueryLayoutOptions_1.QueryLayoutOptions(),
        };
    }
    function layoutOptionsShortMode() {
        const queryLayoutOptions = new QueryLayoutOptions_1.QueryLayoutOptions();
        queryLayoutOptions.shortMode = true;
        return {
            taskLayoutOptions: new TaskLayoutOptions_1.TaskLayoutOptions(),
            queryLayoutOptions,
        };
    }
    it('Full task - full mode', async () => {
        await renderAndVerifyHTML(fullTask, layoutOptionsFullMode());
    });
    it('Full task - short mode', async () => {
        await renderAndVerifyHTML(fullTask, layoutOptionsShortMode());
    });
    it('Minimal task - full mode', async () => {
        await renderAndVerifyHTML(minimalTask, layoutOptionsFullMode());
    });
    it('Minimal task - short mode', async () => {
        await renderAndVerifyHTML(minimalTask, layoutOptionsShortMode());
    });
});
describe('task line rendering - preserving classes and data attributes', () => {
    /*
     * Create an original list item, along with a parent element,
     * and a separate replacement list item.
     * Note the plain li elements will only be used by tests that check
     * persistence of pre-existing classes and attributes during the
     * replacement
     */
    const originalAndReplacement = () => {
        const list = document.createElement('ul');
        const original = (0, TaskLineRenderer_1.createAndAppendElement)('li', list);
        const replacement = document.createElement('li');
        return { original, replacement };
    };
    it('copies pre-existing classes from the original onto the replacement', () => {
        const { original, replacement } = originalAndReplacement();
        original.classList.add('test-plugin-class', 'another-plugin-class');
        (0, TaskLineRenderer_1.reconcileReplacementTask)(original, replacement);
        expect(replacement.classList.contains('test-plugin-class')).toBe(true);
        expect(replacement.classList.contains('another-plugin-class')).toBe(true);
    });
    it('copies pre-existing data attributes from the original onto the replacement', () => {
        const { original, replacement } = originalAndReplacement();
        original.setAttribute('data-test-color', 'red');
        original.setAttribute('data-custom', 'value');
        (0, TaskLineRenderer_1.reconcileReplacementTask)(original, replacement);
        expect(replacement.getAttribute('data-test-color')).toBe('red');
        expect(replacement.getAttribute('data-custom')).toBe('value');
    });
    it('does not copy pre-existing non-data attributes from the original onto the replacement', () => {
        const { original, replacement } = originalAndReplacement();
        original.setAttribute('test-attr', 'value');
        original.setAttribute('aria-label', 'a task');
        (0, TaskLineRenderer_1.reconcileReplacementTask)(original, replacement);
        expect(replacement.hasAttribute('test-attr')).toBe(false);
        expect(replacement.hasAttribute('aria-label')).toBe(false);
    });
    /*
     * Create an original list item, along with a parent element,
     * and a fully rendered task list item, so it carries the classes
     * and data attributes that Tasks itself adds
     */
    const originalAndRenderedReplacement = async (taskLine) => {
        const replacement = await renderListItem((0, TestHelpers_1.fromLine)({ line: taskLine }));
        const list = document.createElement('ul');
        const original = (0, TaskLineRenderer_1.createAndAppendElement)('li', list);
        return { original, replacement };
    };
    it("should have the Tasks plugin's own classes after the replacement", async () => {
        const { original, replacement } = await originalAndRenderedReplacement('- [x] A complete task');
        original.classList.add('test-plugin-class');
        (0, TaskLineRenderer_1.reconcileReplacementTask)(original, replacement);
        expect(replacement.classList.contains('task-list-item')).toBe(true);
        expect(replacement.classList.contains('is-checked')).toBe(true);
        expect(replacement.classList.contains('plugin-tasks-list-item')).toBe(true);
    });
    it("should have the Tasks plugin's own data attributes after the replacement", async () => {
        const { original, replacement } = await originalAndRenderedReplacement('- [x] A complete task');
        original.setAttribute('data-custom', 'value');
        (0, TaskLineRenderer_1.reconcileReplacementTask)(original, replacement);
        expect(replacement.hasAttribute('data-task')).toBe(true);
        expect(replacement.hasAttribute('data-line')).toBe(true);
        expect(replacement.hasAttribute('data-task-status-name')).toBe(true);
        expect(replacement.hasAttribute('data-task-status-type')).toBe(true);
    });
    it("should not overwrite the replacement's own data attributes with the original's", async () => {
        const { original, replacement } = await originalAndRenderedReplacement('- [x] A complete task');
        original.setAttribute('data-task', ' ');
        original.setAttribute('data-line', '99');
        (0, TaskLineRenderer_1.reconcileReplacementTask)(original, replacement);
        expect(replacement.getAttribute('data-task')).toBe('x');
        expect(replacement.getAttribute('data-line')).toBe('0');
    });
});
//# sourceMappingURL=TaskLineRenderer.test.js.map