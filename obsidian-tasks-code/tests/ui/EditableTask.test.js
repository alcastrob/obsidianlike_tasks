"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const GlobalFilter_1 = require("../../src/Config/GlobalFilter");
const Status_1 = require("../../src/Statuses/Status");
const OnCompletion_1 = require("../../src/Task/OnCompletion");
const EditableTask_1 = require("../../src/ui/EditableTask");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
window.moment = moment_1.default;
function testEditableTaskDescriptionAndGlobalFilterOnSave({ globalFilter, taskDescription, expectedEditableTaskDescription, }) {
    GlobalFilter_1.GlobalFilter.getInstance().set(globalFilter);
    const taskWithoutGlobalFilter = new TaskBuilder_1.TaskBuilder().description(taskDescription).build();
    const editableTask = EditableTask_1.EditableTask.fromTask(taskWithoutGlobalFilter, [taskWithoutGlobalFilter]);
    expect(editableTask.description).toEqual(expectedEditableTaskDescription);
}
describe('EditableTask tests', () => {
    beforeEach(() => {
        GlobalFilter_1.GlobalFilter.getInstance().reset();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-05-01'));
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    it('should create an editable task without dependencies', () => {
        const taskToEdit = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask();
        const editableTask = EditableTask_1.EditableTask.fromTask(taskToEdit, [taskToEdit]);
        expect(editableTask).toMatchInlineSnapshot(`
            EditableTask {
              "addGlobalFilterOnSave": false,
              "blockedBy": [],
              "blocking": [],
              "cancelledDate": "2023-07-06",
              "createdDate": "2023-07-01",
              "description": "Do exercises #todo #health",
              "doneDate": "2023-07-05",
              "dueDate": "2023-07-04",
              "forwardOnly": true,
              "onCompletion": "delete",
              "originalBlocking": [],
              "priority": "medium",
              "recurrenceRule": "every day when done",
              "scheduledDate": "2023-07-03",
              "startDate": "2023-07-02",
              "status": Status {
                "configuration": StatusConfiguration {
                  "availableAsCommand": true,
                  "name": "Todo",
                  "nextStatusSymbol": "x",
                  "symbol": " ",
                  "type": "TODO",
                },
              },
            }
        `);
    });
    it('should create an editable task with dependencies', () => {
        const taskToEdit = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask();
        const blockingTask = new TaskBuilder_1.TaskBuilder().description('I am blocking the task to edit').id('123456').build();
        const blockedTask = new TaskBuilder_1.TaskBuilder()
            .description('I am blocked by the task to edit')
            .dependsOn(['abcdef'])
            .build();
        const allTasks = [taskToEdit, blockingTask, blockedTask];
        const editableTask = EditableTask_1.EditableTask.fromTask(taskToEdit, allTasks);
        expect(editableTask.blocking).toEqual([blockedTask]);
        expect(editableTask.blockedBy).toEqual([blockingTask]);
    });
    it('should remember to add global filter when it is absent in task description', () => {
        testEditableTaskDescriptionAndGlobalFilterOnSave({
            globalFilter: '#todo',
            taskDescription: 'global filter is absent',
            expectedEditableTaskDescription: 'global filter is absent',
        });
    });
    it('should remember to add global filter when it is present in task description and remove it from the description', () => {
        testEditableTaskDescriptionAndGlobalFilterOnSave({
            globalFilter: '#important',
            taskDescription: '#important is the global filter',
            expectedEditableTaskDescription: 'is the global filter',
        });
    });
    it('should not add global filter by default (global filter was not set)', () => {
        testEditableTaskDescriptionAndGlobalFilterOnSave({
            globalFilter: GlobalFilter_1.GlobalFilter.empty,
            taskDescription: 'global filter has not been set',
            expectedEditableTaskDescription: 'global filter has not been set',
        });
    });
    it('should apply no edits to an empty task', async () => {
        const task = new TaskBuilder_1.TaskBuilder().build();
        const allTasks = [task];
        const editableTask = EditableTask_1.EditableTask.fromTask(task, allTasks);
        const appliedEdits = await editableTask.applyEdits(task, [task]);
        expect(appliedEdits).toEqual([task]);
    });
    it.failing('should apply no edits to a fully populated task', async () => {
        const task = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask();
        const allTasks = [task];
        const editableTask = EditableTask_1.EditableTask.fromTask(task, allTasks);
        const appliedEdits = await editableTask.applyEdits(task, [task]);
        expect(appliedEdits).toEqual([task]);
    });
    it('should apply edit all fields in a fully populated task', async () => {
        const task = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask();
        const allTasks = [task];
        const editableTask = EditableTask_1.EditableTask.fromTask(task, allTasks);
        editableTask.description = '';
        editableTask.status = Status_1.Status.TODO;
        editableTask.priority = 'none';
        editableTask.onCompletion = OnCompletion_1.OnCompletion.Ignore;
        editableTask.recurrenceRule = '';
        editableTask.createdDate = '';
        editableTask.startDate = '';
        editableTask.scheduledDate = '';
        editableTask.dueDate = '';
        editableTask.doneDate = '';
        editableTask.cancelledDate = '';
        editableTask.forwardOnly = true;
        editableTask.blockedBy = [];
        editableTask.blocking = [];
        const appliedEdits = await editableTask.applyEdits(task, allTasks);
        expect(appliedEdits.length).toEqual(1);
        expect(appliedEdits[0]).toMatchInlineSnapshot(`
            Task {
              "_cancelledDate": null,
              "_createdDate": null,
              "_doneDate": null,
              "_dueDate": null,
              "_scheduledDate": null,
              "_startDate": null,
              "_urgency": null,
              "blockLink": " ^dcf64c",
              "children": [],
              "dependsOn": [],
              "description": "",
              "id": "abcdef",
              "indentation": "  ",
              "listMarker": "-",
              "onCompletion": "",
              "originalMarkdown": "  - [ ] Do exercises #todo #health 🆔 abcdef ⛔ 123456,abc123 🔼 🔁 every day when done 🏁 delete ➕ 2023-07-01 🛫 2023-07-02 ⏳ 2023-07-03 📅 2023-07-04 ❌ 2023-07-06 ✅ 2023-07-05 ^dcf64c",
              "parent": null,
              "priority": "3",
              "recurrence": null,
              "scheduledDateIsInferred": false,
              "status": Status {
                "configuration": StatusConfiguration {
                  "availableAsCommand": true,
                  "name": "Todo",
                  "nextStatusSymbol": "x",
                  "symbol": " ",
                  "type": "TODO",
                },
              },
              "statusCharacter": " ",
              "tags": [
                "#todo",
                "#health",
              ],
              "taskLocation": TaskLocation {
                "_lineNumber": 17,
                "_precedingHeader": "My Header",
                "_sectionIndex": 3,
                "_sectionStart": 5,
                "_tasksFile": TasksFile {
                  "_cachedMetadata": {},
                  "_frontmatter": {
                    "tags": [],
                  },
                  "_outlinksInBody": [],
                  "_outlinksInProperties": [],
                  "_path": "some/folder/fileName.md",
                  "_tags": [],
                  "tFile": undefined,
                },
              },
            }
        `);
    });
    it('should set a date in YYYY-MM-DD format', async () => {
        const task = new TaskBuilder_1.TaskBuilder().build();
        const allTasks = [];
        const editableTask = EditableTask_1.EditableTask.fromTask(task, allTasks);
        editableTask.dueDate = '2024-07-13';
        const editedTasks = await editableTask.applyEdits(task, allTasks);
        // TODO Why does this have the time 12:00?
        //      When I edit a task in the plugin, in the modal, and then group by the following, the time is midnight,
        //      so where is the time dropped in production code?
        //          group by function task.due.formatAsDateAndTime()
        //      Or have I misunderstood something?
        //      For now, I would just like assurance that this is the same behaviour as
        //      the code before this PR.... (I expect it is)
        expect(editedTasks[0].dueDate).toEqualMoment((0, moment_1.default)('2024-07-13T12:00:00.000Z'));
    });
    it('should honour the forwardOnly value', async () => {
        const task = new TaskBuilder_1.TaskBuilder().build();
        const allTasks = [];
        const editableTask = EditableTask_1.EditableTask.fromTask(task, allTasks);
        jest.setSystemTime(new Date('2024-05-22')); // Wednesday 22nd May
        editableTask.dueDate = 'tuesday';
        const tuesdayBefore = (0, moment_1.default)('2024-05-28T12:00:00.000Z');
        const tuesdayAfter = (0, moment_1.default)('2024-05-21T12:00:00.000Z');
        editableTask.forwardOnly = true;
        const tasksFutureDay = await editableTask.applyEdits(task, allTasks);
        expect(tasksFutureDay[0].dueDate).toEqualMoment(tuesdayBefore);
        editableTask.forwardOnly = false;
        const tasksClosestDay = await editableTask.applyEdits(task, allTasks);
        expect(tasksClosestDay[0].dueDate).toEqualMoment(tuesdayAfter);
    });
});
describe('parseAndValidateRecurrence() tests', () => {
    const emptyTask = new TaskBuilder_1.TaskBuilder().description('').build();
    const noRecurrenceRule = (editableTask) => {
        editableTask.recurrenceRule = '';
        return editableTask;
    };
    const invalidRecurrenceRule = (editableTask) => {
        editableTask.recurrenceRule = 'thisIsWrong';
        return editableTask;
    };
    const withRecurrenceRuleButNoHappensDate = (editableTask) => {
        editableTask.recurrenceRule = 'every day';
        return editableTask;
    };
    const withRecurrenceRuleAndHappensDate = (editableTask) => {
        editableTask.recurrenceRule = 'every 1 months when done'; // confirm that recurrence text is standardised
        editableTask.startDate = '2024-05-20';
        return editableTask;
    };
    it.each([
        // editable task, expected parsed recurrence, expected recurrence validity
        [noRecurrenceRule, '<i>not recurring</>', true],
        [invalidRecurrenceRule, '<i>invalid recurrence rule</i>', false],
        [withRecurrenceRuleButNoHappensDate, '<i>due, scheduled or start date required</i>', false],
        [withRecurrenceRuleAndHappensDate, 'every month when done', true],
    ])("editable task with '%s' fields should have '%s' parsed recurrence and its validity is %s", (taskEditor, expectedParsedRecurrence, expectedRecurrenceValidity) => {
        const editableTask = EditableTask_1.EditableTask.fromTask(emptyTask, [emptyTask]);
        const editedTask = taskEditor(editableTask);
        const { parsedRecurrence, isRecurrenceValid } = editedTask.parseAndValidateRecurrence();
        expect(parsedRecurrence).toEqual(expectedParsedRecurrence);
        expect(isRecurrenceValid).toEqual(expectedRecurrenceValidity);
    });
});
//# sourceMappingURL=EditableTask.test.js.map