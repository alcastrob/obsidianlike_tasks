"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const svelte_1 = require("@testing-library/svelte");
const moment_1 = __importDefault(require("moment"));
const CreateOrEditTaskParser_1 = require("../../src/Commands/CreateOrEditTaskParser");
const GlobalFilter_1 = require("../../src/Config/GlobalFilter");
const Settings_1 = require("../../src/Config/Settings");
const DateFallback_1 = require("../../src/DateTime/DateFallback");
const StatusRegistry_1 = require("../../src/Statuses/StatusRegistry");
const EditTask_svelte_1 = __importDefault(require("../../src/ui/EditTask.svelte"));
const ApprovalTestHelpers_1 = require("../TestingTools/ApprovalTestHelpers");
const CombinationApprovalsAsync_1 = require("../TestingTools/CombinationApprovalsAsync");
const HTMLHelpers_1 = require("../TestingTools/HTMLHelpers");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const RenderingTestHelpers_1 = require("./RenderingTestHelpers");
window.moment = moment_1.default;
/**
 * Construct an onSubmit function for editing the given task, and when Apply is clicked,
 * returning the edit task(s) converted to a string.
 * @param task
 */
function constructSerialisingOnSubmit(task) {
    let resolvePromise;
    const waitForClose = new Promise((resolve, _) => {
        resolvePromise = resolve;
    });
    const onSubmit = (updatedTasks) => {
        const serializedTask = DateFallback_1.DateFallback.removeInferredStatusIfNeeded(task, updatedTasks)
            .map((task) => task.toFileLineString())
            .join('\n');
        resolvePromise(serializedTask);
    };
    return { waitForClose, onSubmit };
}
function renderAndCheckModal(task, onSubmit, allTasks = [task]) {
    const result = (0, svelte_1.render)(EditTask_svelte_1.default, {
        task,
        statusOptions: StatusRegistry_1.StatusRegistry.getInstance().registeredStatuses,
        onSubmit,
        allTasks,
    });
    const { container } = result;
    expect(() => container).toBeTruthy();
    return { result, container };
}
async function editInputElementAndSubmit(inputElement, newValue, submit, waitForClose) {
    await (0, RenderingTestHelpers_1.editInputElement)(inputElement, newValue);
    submit.click();
    return await waitForClose;
}
function convertDescriptionToTaskLine(taskDescription) {
    return `- [ ] ${taskDescription}`;
}
/**
 * Simulate the behaviour of:
 *   - clicking on a line in Obsidian,
 *   - opening the Edit task modal,
 *   - optionally editing the description,
 *   - and clicking Apply.
 * @param line
 * @param newDescription - the new value for the description field.
 *                         If `undefined`, the description won't be edited, unless text is needed to enable the Apply button.
 * @returns The edited task line.
 *
 * See also {@link editFieldAndSave} which is simpler, and works for more fields
 */
async function editTaskLine(line, newDescription) {
    const task = (0, CreateOrEditTaskParser_1.taskFromLine)({ line: line, path: '' });
    const { waitForClose, onSubmit } = constructSerialisingOnSubmit(task);
    const { result, container } = renderAndCheckModal(task, onSubmit);
    const description = (0, RenderingTestHelpers_1.getAndCheckRenderedDescriptionElement)(container);
    const submit = (0, RenderingTestHelpers_1.getAndCheckApplyButton)(result);
    let adjustedNewDescription = newDescription ? newDescription : description.value;
    if (!adjustedNewDescription) {
        adjustedNewDescription = 'simulate user typing text in to empty description field';
    }
    return await editInputElementAndSubmit(description, adjustedNewDescription, submit, waitForClose);
}
/**
 * Simulate the behaviour of:
 *   - clicking on a line in Obsidian,
 *   - opening the Edit task modal,
 *   - editing a field,
 *   - and clicking Apply.
 * @param line
 * @param elementId - specifying the field to edit
 * @param newValue - the new value for the field.
 * @returns The edited task line.
 *
 * See also {@link editTaskLine} which has extra logic for testing the description
 */
async function editFieldAndSave(line, elementId, newValue) {
    const task = (0, CreateOrEditTaskParser_1.taskFromLine)({ line: line, path: '' });
    const { waitForClose, onSubmit } = constructSerialisingOnSubmit(task);
    const { result, container } = renderAndCheckModal(task, onSubmit);
    const description = (0, RenderingTestHelpers_1.getAndCheckRenderedElement)(container, elementId);
    const submit = (0, RenderingTestHelpers_1.getAndCheckApplyButton)(result);
    return await editInputElementAndSubmit(description, newValue, submit, waitForClose);
}
async function renderTaskModalAndChangeStatus(line, newStatusSymbol) {
    const task = (0, CreateOrEditTaskParser_1.taskFromLine)({ line: line, path: '' });
    const { waitForClose, onSubmit } = constructSerialisingOnSubmit(task);
    const { result, container } = renderAndCheckModal(task, onSubmit);
    const statusSelector = (0, RenderingTestHelpers_1.getAndCheckRenderedElement)(container, 'status-type');
    const submit = (0, RenderingTestHelpers_1.getAndCheckApplyButton)(result);
    await svelte_1.fireEvent.change(statusSelector, {
        target: { value: newStatusSymbol },
    });
    return { waitForClose, container, submit };
}
/**
 * Simulate the behaviour of:
 *   - clicking on a line in Obsidian,
 *   - opening the Edit task modal,
 *   - editing a field,
 *   - changing the status,
 *   - and clicking Apply.
 * @param line
 * @param elementId - specifying the field to edit
 * @param newValue - the new value for the field
 * @param newStatusSymbol - new Status symbol value
 */
async function renderChangeDateAndStatus(line, elementId, newValue, newStatusSymbol) {
    const task = (0, CreateOrEditTaskParser_1.taskFromLine)({ line: line, path: '' });
    const { waitForClose, onSubmit } = constructSerialisingOnSubmit(task);
    const { result, container } = renderAndCheckModal(task, onSubmit);
    const inputElement = (0, RenderingTestHelpers_1.getAndCheckRenderedElement)(container, elementId);
    await (0, RenderingTestHelpers_1.editInputElement)(inputElement, newValue);
    const statusSelector = (0, RenderingTestHelpers_1.getAndCheckRenderedElement)(container, 'status-type');
    await svelte_1.fireEvent.change(statusSelector, {
        target: { value: newStatusSymbol },
    });
    const submit = (0, RenderingTestHelpers_1.getAndCheckApplyButton)(result);
    return { waitForClose, container, submit };
}
function getElementValue(container, elementId) {
    const element = (0, RenderingTestHelpers_1.getAndCheckRenderedElement)(container, elementId);
    return element.value;
}
afterEach(() => {
    (0, Settings_1.resetSettings)();
});
describe('Task rendering', () => {
    afterEach(() => {
        GlobalFilter_1.GlobalFilter.getInstance().reset();
    });
    function testElementRender(line, elementId, expectedElementValue) {
        const task = (0, CreateOrEditTaskParser_1.taskFromLine)({ line, path: '' });
        const onSubmit = (_) => { };
        const { container } = renderAndCheckModal(task, onSubmit);
        const inputElement = (0, RenderingTestHelpers_1.getAndCheckRenderedElement)(container, elementId);
        expect(inputElement.value).toEqual(expectedElementValue);
    }
    function testDescriptionRender(taskDescription, expectedDescription) {
        const line = convertDescriptionToTaskLine(taskDescription);
        testElementRender(line, 'description', expectedDescription);
    }
    it('should display task description (empty Global Filter)', () => {
        testDescriptionRender('important thing #todo', 'important thing #todo');
    });
    it('should display task description without non-tag Global Filter)', () => {
        GlobalFilter_1.GlobalFilter.getInstance().set('filter');
        testDescriptionRender('filter important thing', 'important thing');
    });
    it('should display task description with complex non-tag Global Filter)', () => {
        GlobalFilter_1.GlobalFilter.getInstance().set('filter');
        // This behavior is inconsistent with Obsidian's tag definition which includes nested tags
        testDescriptionRender('filter/important thing', 'filter/important thing');
    });
    it('should display task description without tag-like Global Filter', () => {
        GlobalFilter_1.GlobalFilter.getInstance().set('#todo');
        testDescriptionRender('#todo another plan', 'another plan');
    });
    it('should display task description with complex tag-like Global Filter', () => {
        GlobalFilter_1.GlobalFilter.getInstance().set('#todo');
        // This behavior is inconsistent with Obsidian's tag definition which includes nested tags
        testDescriptionRender('#todo/important another plan', '#todo/important another plan');
    });
    it('should display task description with emoji removed, when global filter is in initial line', () => {
        GlobalFilter_1.GlobalFilter.getInstance().set('#todo');
        testDescriptionRender('#todo with global filter and with scheduled date ⏳ 2023-06-13', 'with global filter and with scheduled date');
    });
    it('should display task description with emoji removed, even if the global filter is missing from initial line (bug 2037)', () => {
        GlobalFilter_1.GlobalFilter.getInstance().set('#todo');
        // When written, this was a demonstration of the behaviour logged in
        // https://github.com/obsidian-tasks-group/obsidian-tasks/issues/2037
        testDescriptionRender('without global filter but with scheduled date ⏳ 2023-06-13', 'without global filter but with scheduled date');
    });
    const fullyPopulatedLine = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask().toFileLineString();
    it('should display valid created date', () => {
        testElementRender(fullyPopulatedLine, 'created', '2023-07-01');
    });
    it('should display valid start date', () => {
        testElementRender(fullyPopulatedLine, 'start', '2023-07-02');
    });
    it('should display valid scheduled date', () => {
        testElementRender(fullyPopulatedLine, 'scheduled', '2023-07-03');
    });
    it('should display valid due date', () => {
        testElementRender(fullyPopulatedLine, 'due', '2023-07-04');
    });
    it('should display valid done date', () => {
        testElementRender(fullyPopulatedLine, 'done', '2023-07-05');
    });
    it('should display valid cancelled date', () => {
        testElementRender(fullyPopulatedLine, 'cancelled', '2023-07-06');
    });
    const invalidDateText = 'Invalid date';
    it('should display invalid cancelled date', () => {
        testElementRender('- [ ] ❌ 2024-02-31', 'cancelled', invalidDateText);
    });
    it('should display invalid created date', () => {
        testElementRender('- [ ] ➕ 2024-02-31', 'created', invalidDateText);
    });
    it('should display invalid done date', () => {
        testElementRender('- [ ] ✅ 2024-02-31', 'done', invalidDateText);
    });
    it('should display invalid due date', () => {
        testElementRender('- [ ] 📅 2024-02-31', 'due', invalidDateText);
    });
    it('should display invalid scheduled date', () => {
        testElementRender('- [ ] ⏳ 2024-02-31', 'scheduled', invalidDateText);
    });
    it('should display invalid start date', () => {
        testElementRender('- [ ] 🛫 2024-02-31', 'start', invalidDateText);
    });
});
describe('Task editing', () => {
    afterEach(() => {
        GlobalFilter_1.GlobalFilter.getInstance().reset();
    });
    async function testDescriptionEdit(taskDescription, newDescription, expectedDescription) {
        const line = convertDescriptionToTaskLine(taskDescription);
        const editedTask = await editTaskLine(line, newDescription);
        expect(editedTask).toEqual(`- [ ] ${expectedDescription}`);
    }
    it('should keep task description if it was not edited (Empty Global Filter)', async () => {
        const description = 'simple task #remember';
        await testDescriptionEdit(description, description, description);
    });
    it('should change task description if it was edited (Empty Global Filter)', async () => {
        await testDescriptionEdit('simple task #remember', 'another', 'another');
    });
    it('should not change the description if the task was not edited and keep Global Filter', async () => {
        const globalFilter = '#remember';
        const description = 'simple task';
        GlobalFilter_1.GlobalFilter.getInstance().set(globalFilter);
        await testDescriptionEdit(`${globalFilter} ${description}`, description, `${globalFilter} ${description}`);
    });
    it('should change the description if the task was edited and keep Global Filter', async () => {
        const globalFilter = '#remember';
        const oldDescription = 'simple task';
        const newDescription = 'new plan';
        GlobalFilter_1.GlobalFilter.getInstance().set(globalFilter);
        await testDescriptionEdit(`${globalFilter} ${oldDescription}`, newDescription, `${globalFilter} ${newDescription}`);
    });
    describe('Status editing', () => {
        const today = '2024-02-29';
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(today));
        });
        afterAll(() => {
            jest.useRealTimers();
        });
        afterEach(() => {
            (0, Settings_1.resetSettings)();
        });
        it('should change status to Done and add doneDate', async () => {
            const { waitForClose, container, submit } = await renderTaskModalAndChangeStatus('- [ ] expecting done date to be added', 'x');
            expect(getElementValue(container, 'done')).toEqual(today);
            submit.click();
            expect(await waitForClose).toMatchInlineSnapshot('"- [x] expecting done date to be added ✅ 2024-02-29"');
        });
        it('should change status to Done and keep doneDate', async () => {
            const { waitForClose, container, submit } = await renderTaskModalAndChangeStatus('- [ ] expecting done date to be kept ✅ 2024-09-19', 'x');
            expect(getElementValue(container, 'done')).toEqual('2024-09-19');
            submit.click();
            expect(await waitForClose).toMatchInlineSnapshot('"- [x] expecting done date to be kept ✅ 2024-09-19"');
        });
        it('should change status to Todo and remove doneDate', async () => {
            const { waitForClose, container, submit } = await renderTaskModalAndChangeStatus('- [x] expecting done date to be removed ✅ 2024-02-29', ' ');
            expect(getElementValue(container, 'done')).toEqual('');
            submit.click();
            expect(await waitForClose).toMatchInlineSnapshot('"- [ ] expecting done date to be removed"');
        });
        it('should change status to Cancelled and add cancelledDate', async () => {
            const { waitForClose, container, submit } = await renderTaskModalAndChangeStatus('- [ ] expecting cancelled date to be added', '-');
            expect(getElementValue(container, 'cancelled')).toEqual(today);
            submit.click();
            expect(await waitForClose).toMatchInlineSnapshot('"- [-] expecting cancelled date to be added ❌ 2024-02-29"');
        });
        it('should change status to Cancelled and keep cancelledDate', async () => {
            const { waitForClose, container, submit } = await renderTaskModalAndChangeStatus('- [ ] expecting cancelled date to be kept ❌ 2024-09-20', '-');
            expect(getElementValue(container, 'cancelled')).toEqual('2024-09-20');
            submit.click();
            expect(await waitForClose).toMatchInlineSnapshot('"- [-] expecting cancelled date to be kept ❌ 2024-09-20"');
        });
        it('should change status to Todo and remove cancelledDate', async () => {
            const { waitForClose, container, submit } = await renderTaskModalAndChangeStatus('- [-] expecting cancelled date to be removed ❌ 2024-02-29', ' ');
            expect(getElementValue(container, 'cancelled')).toEqual('');
            submit.click();
            expect(await waitForClose).toMatchInlineSnapshot('"- [ ] expecting cancelled date to be removed"');
        });
        /**
         * Test opening task modal for a given line, changing a date to a value, changing the status,
         * clicking Apply, verifying the final line.
         *
         * @param line
         * @param dateElementToChange
         * @param dateValue
         * @param newStatusSymbol
         * @param expectedTaskAfterEdits
         */
        async function testDateInputAndStatusChange(line, dateElementToChange, dateValue, newStatusSymbol, expectedTaskAfterEdits) {
            const { waitForClose, container, submit } = await renderChangeDateAndStatus(line, dateElementToChange, dateValue, newStatusSymbol);
            expect(getElementValue(container, dateElementToChange)).toEqual(dateValue);
            submit.click();
            expect(await waitForClose).toEqual(expectedTaskAfterEdits);
        }
        it.each([
            [
                '- [ ] input done date, change status to done and expect the date to be kept',
                'done',
                '2024-09-20',
                'x',
                '- [x] input done date, change status to done and expect the date to be kept ✅ 2024-09-20',
            ],
            [
                '- [ ] input cancelled date, change status to cancelled and expect the date to be kept',
                'cancelled',
                '2024-09-21',
                '-',
                // https://github.com/obsidian-tasks-group/obsidian-tasks/issues/3089
                '- [-] input cancelled date, change status to cancelled and expect the date to be kept ❌ 2024-09-21',
            ],
        ])('for "%s" task, change %s date to %s and status to %s', async (line, dateElementToChange, dateValue, newStatusSymbol, expectedTaskAfterEdits) => {
            await testDateInputAndStatusChange(line, dateElementToChange, dateValue, newStatusSymbol, expectedTaskAfterEdits);
        });
        it('should create new instance of recurring task, with doneDate set to today', async () => {
            (0, Settings_1.updateSettings)({ recurrenceOnNextLine: false });
            const { waitForClose, submit } = await renderTaskModalAndChangeStatus('- [ ] Recurring 🔁 every day 📅 2024-02-17', 'x');
            submit.click();
            expect(await waitForClose).toMatchInlineSnapshot(`
                "- [ ] Recurring 🔁 every day 📅 2024-02-18
                - [x] Recurring 🔁 every day 📅 2024-02-17 ✅ 2024-02-29"
            `);
        });
        it('should respect user setting for order of new recurring tasks', async () => {
            (0, Settings_1.updateSettings)({ recurrenceOnNextLine: true });
            const { waitForClose, submit } = await renderTaskModalAndChangeStatus('- [ ] Recurring 🔁 every day 📅 2024-02-17', 'x');
            submit.click();
            expect(await waitForClose).toMatchInlineSnapshot(`
                "- [x] Recurring 🔁 every day 📅 2024-02-17 ✅ 2024-02-29
                - [ ] Recurring 🔁 every day 📅 2024-02-18"
            `);
        });
        it('should create new instance of "when done" recurring task, with doneDate set to today', async () => {
            (0, Settings_1.updateSettings)({ setCreatedDate: true });
            const { waitForClose, submit } = await renderTaskModalAndChangeStatus('- [ ] Recurring 🔁 every day when done 📅 2024-02-17', 'x');
            submit.click();
            expect(await waitForClose).toMatchInlineSnapshot(`
                "- [ ] Recurring 🔁 every day when done ➕ 2024-02-29 📅 2024-03-01
                - [x] Recurring 🔁 every day when done 📅 2024-02-17 ✅ 2024-02-29"
            `);
        });
        it('should calculate the next recurrence date based on the actual done date in the field', async () => {
            (0, Settings_1.updateSettings)({ setCreatedDate: true });
            const { waitForClose, container, submit } = await renderTaskModalAndChangeStatus('- [ ] Recurring 🔁 every day when done 📅 2024-02-17', 'x');
            const doneField = (0, RenderingTestHelpers_1.getAndCheckRenderedElement)(container, 'done');
            await (0, RenderingTestHelpers_1.editInputElement)(doneField, '2024-02-23');
            submit.click();
            expect(await waitForClose).toMatchInlineSnapshot(`
                "- [ ] Recurring 🔁 every day when done ➕ 2024-02-29 📅 2024-02-24
                - [x] Recurring 🔁 every day when done 📅 2024-02-17 ✅ 2024-02-23"
            `);
        });
    });
    describe('Date editing', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2024-11-27'));
        });
        afterEach(() => {
            jest.useRealTimers();
        });
        const line = '- [ ] simple';
        it('should edit and save cancelled date', async () => {
            expect(await editFieldAndSave(line, 'cancelled', '2024-01-01')).toEqual('- [ ] simple ❌ 2024-01-01');
        });
        it('should edit and save created date', async () => {
            expect(await editFieldAndSave(line, 'created', '2024-01-01')).toEqual('- [ ] simple ➕ 2024-01-01');
        });
        it('should edit and save done date', async () => {
            expect(await editFieldAndSave(line, 'done', '2024-01-01')).toEqual('- [ ] simple ✅ 2024-01-01');
        });
        it('should edit and save due date', async () => {
            expect(await editFieldAndSave(line, 'due', '2024-01-01')).toEqual('- [ ] simple 📅 2024-01-01');
        });
        it('should edit and save scheduled date', async () => {
            expect(await editFieldAndSave(line, 'scheduled', '2024-01-01')).toEqual('- [ ] simple ⏳ 2024-01-01');
        });
        it('should edit and save start date', async () => {
            expect(await editFieldAndSave(line, 'start', '2024-01-01')).toEqual('- [ ] simple 🛫 2024-01-01');
        });
        it('should edit and save start date "today"', async () => {
            expect(await editFieldAndSave(line, 'start', 'today')).toEqual('- [ ] simple 🛫 2024-11-27');
        });
        it('should edit and save start date "this week"', async () => {
            // Confirm understanding that today's date is a Wednesday
            expect((0, moment_1.default)().format('YYYY-MM-DD dddd')).toEqual('2024-11-27 Wednesday');
            // See https://github.com/obsidian-tasks-group/obsidian-tasks/issues/2588
            // With 'only future dates' being on by default, the selection of a date
            // earlier than today is unexpected.
            // This was written with Tasks using "chrono-node": "2.3.9"
            expect(await editFieldAndSave(line, 'start', 'this week')).toEqual('- [ ] simple 🛫 2024-11-24');
        });
    });
    describe('OnCompletion editing', () => {
        it('should retain any OnCompletion value', async () => {
            // We cannot yet edit the OnCompletion in the modal.
            // So for now, just test to ensure that any initial value is retained.
            expect(await editFieldAndSave('- [ ] description  🏁 delete', 'start', '2024-01-01')).toEqual('- [ ] description 🏁 delete 🛫 2024-01-01');
        });
    });
});
/**
 * @summary This tests behaviour under a wide variety of scenarios, such as multiple different user settings, and input lines.
 *
 * As the number of combinations of settings values increases, it becomes harder and harder
 * to write sufficient tests manually, and to find corner cases in exploratory testing.
 */
describe('Exhaustive editing', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-07-18'));
    });
    afterEach(() => {
        GlobalFilter_1.GlobalFilter.getInstance().reset();
        (0, Settings_1.resetSettings)();
        jest.useRealTimers();
    });
    /**
     * Test outcome of simply editing and saving a task line, under many conditions.
     * Written as our previous test coverage was not good enough to detect the following:
     *   - https://github.com/obsidian-tasks-group/obsidian-tasks/issues/2112
     *   - Since Tasks 4.0.1, using 'Create or edit task' on a line with a checkbox
     *     but no global filter no longer adds the Created date.
     */
    describe('Edit and save', () => {
        const name = 'All inputs';
        const title = 'KEY: (globalFilter, set created date)\n';
        const globalFilterValues = ['', '#task'];
        const setCreatedDateValues = [false, true];
        const initialTaskLineValues = [
            '',
            'plain text, not a list item',
            '-',
            '- ',
            '- [ ]',
            '- [ ] ',
            '- list item, but no checkbox',
            '- [ ] checkbox with initial description',
            '- [ ] checkbox with initial description and created date ➕ 2023-01-01',
            '- [ ] #task checkbox with global filter string and initial description',
            '- [ ] checkbox with initial description ending with task tag at end #task',
        ];
        // For explanation of this call, see:
        // https://publish.obsidian.md/tasks-contributing/Testing/Approval+Tests#Verify+the+results+of+multiple+input+values
        (0, CombinationApprovalsAsync_1.verifyAllCombinations3Async)(name, title, async (globalFilter, setCreatedDate, initialTaskLine) => {
            GlobalFilter_1.GlobalFilter.getInstance().set(globalFilter);
            // @ts-expect-error: TS2322: Type 'T2' is not assignable to type 'boolean | undefined'.
            (0, Settings_1.updateSettings)({ setCreatedDate });
            // @ts-expect-error: TS2345: Argument of type 'T3' is not assignable to parameter of type 'string'.
            const editedTaskLine = await editTaskLine(initialTaskLine, undefined);
            return `
('${globalFilter}', ${setCreatedDate})
    '${initialTaskLine}' =>
    '${editedTaskLine}'`;
        }, globalFilterValues, setCreatedDateValues, initialTaskLineValues);
    });
});
function verifyModalHTML() {
    // Populate task a valid and an invalid date. Note that the valid date value
    // is not visible in the HTML output.
    const task = (0, CreateOrEditTaskParser_1.taskFromLine)({ line: '- [ ] absolutely to do 🛫 2024-01-01 ⏳ 2024-02-33', path: '' });
    const onSubmit = () => { };
    const allTasks = [task];
    const { container } = renderAndCheckModal(task, onSubmit, allTasks);
    const prettyHTML = (0, HTMLHelpers_1.prettifyHTML)(container.innerHTML);
    (0, ApprovalTestHelpers_1.verifyWithFileExtension)(prettyHTML, 'html');
}
describe('Edit Modal HTML snapshot tests', () => {
    afterEach(() => {
        (0, Settings_1.resetSettings)();
    });
    it('should match snapshot', () => {
        (0, Settings_1.updateSettings)({ provideAccessKeys: true });
        verifyModalHTML();
    });
    it('should match snapshot - without access keys', () => {
        (0, Settings_1.updateSettings)({ provideAccessKeys: false });
        verifyModalHTML();
    });
});
describe('Hiding modal fields', () => {
    function testElementRendered(elementId) {
        const fullyPopulatedLine = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask().toFileLineString();
        const task = (0, CreateOrEditTaskParser_1.taskFromLine)({ line: fullyPopulatedLine, path: '' });
        const onSubmit = (_) => { };
        const { container } = renderAndCheckModal(task, onSubmit);
        (0, RenderingTestHelpers_1.getAndCheckRenderedElement)(container, elementId);
    }
    function testElementNotRendered(elementId) {
        const fullyPopulatedLine = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask().toFileLineString();
        const task = (0, CreateOrEditTaskParser_1.taskFromLine)({ line: fullyPopulatedLine, path: '' });
        const onSubmit = (_) => { };
        const { container } = renderAndCheckModal(task, onSubmit);
        const element = container.ownerDocument.getElementById(elementId);
        expect(element).toBeNull();
    }
    const fields = Object.keys((0, Settings_1.getSettings)().isShownInEditModal);
    it.each(fields)('should show %s field by default', (field) => {
        testElementRendered(field);
    });
    it.each(fields)('should show %s field even if it is absent in the settings', (field) => {
        (0, Settings_1.updateSettings)({ isShownInEditModal: (0, RenderingTestHelpers_1.optionsWithoutARandomField)() });
        testElementRendered(field);
    });
    function hideFields(...fields) {
        const withHiddenField = { ...(0, Settings_1.getSettings)().isShownInEditModal };
        for (const field of fields) {
            withHiddenField[field] = false;
        }
        return withHiddenField;
    }
    it.each(fields)('should hide %s field', (field) => {
        (0, Settings_1.updateSettings)({ isShownInEditModal: hideFields(field) });
        testElementNotRendered(field);
    });
    it('should hide line after priority', () => {
        (0, Settings_1.updateSettings)({ isShownInEditModal: hideFields('priority') });
        testElementNotRendered('line-after-priority');
    });
    it('should hide "Only future dates checkbox" and line after happens dates', () => {
        // NEW_TASK_FIELD_EDIT_REQUIRED - add new happens date below
        (0, Settings_1.updateSettings)({ isShownInEditModal: hideFields('due', 'scheduled', 'start') });
        testElementNotRendered('only-future-dates');
        testElementNotRendered('line-after-happens-dates');
    });
    it('should hide line after dependencies', () => {
        (0, Settings_1.updateSettings)({ isShownInEditModal: hideFields('before_this', 'after_this') });
        testElementNotRendered('line-after-dependencies');
    });
});
//# sourceMappingURL=EditTask.test.js.map