"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CreateOrEditTaskParser_1 = require("../../src/Commands/CreateOrEditTaskParser");
const createTaskLineModal_1 = require("../../src/Api/createTaskLineModal");
const TaskModal_1 = require("../__mocks__/TaskModal");
const app = {};
const noOpOnSaveSettings = async () => { };
const createNewTask = (line = '') => {
    return (0, CreateOrEditTaskParser_1.taskFromLine)({ line, path: '' });
};
jest.mock('../../src/Obsidian/TaskModal', () => {
    return {
        TaskModal: jest.fn(({ app, task, onSubmit, onCancel, allTasks, }) => {
            return new TaskModal_1.TaskModal({ app, task, onSubmit, onCancel, allTasks });
        }),
    };
});
describe('APIv1 - createTaskLineModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    /**
     * When we ask to create the task line modal, it should call open() on the TaskModal instance.
     */
    it('TaskModal.open() should be called', () => {
        (0, createTaskLineModal_1.createTaskLineModal)(app, [], noOpOnSaveSettings);
        expect(TaskModal_1.TaskModal.instance.open).toHaveBeenCalledTimes(1);
    });
    /**
     * If the Modal returns the expected text, the api function createTaskLineModal() returns that text
     */
    it('should return the Markdown for a task if submitted', async () => {
        const taskLinePromise = (0, createTaskLineModal_1.createTaskLineModal)(app, [], noOpOnSaveSettings);
        const expected = '- [ ] test';
        TaskModal_1.TaskModal.instance.onSubmit([createNewTask(expected)]);
        const result = await taskLinePromise;
        expect(result).toEqual(expected);
    });
    /**
     * If the Modal is cancelled, the api function createTaskLineModal() should return an empty string
     */
    it('should return an empty string if cancelled', async () => {
        const taskLinePromise = (0, createTaskLineModal_1.createTaskLineModal)(app, [], noOpOnSaveSettings);
        const expected = '';
        TaskModal_1.TaskModal.instance.cancel();
        const result = await taskLinePromise;
        expect(result).toEqual(expected);
    });
    it('should pass allTasks to TaskModal', async () => {
        const allTasks = [createNewTask('- [ ] test')];
        void (0, createTaskLineModal_1.createTaskLineModal)(app, allTasks, noOpOnSaveSettings);
        expect(TaskModal_1.TaskModal.instance.allTasks).toEqual(allTasks);
    });
});
//# sourceMappingURL=createTaskLineModal.test.js.map