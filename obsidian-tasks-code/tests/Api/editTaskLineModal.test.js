"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const editTaskLineModal_1 = require("../../src/Api/editTaskLineModal");
const CreateOrEditTaskParser_1 = require("../../src/Commands/CreateOrEditTaskParser");
const TaskModal_1 = require("../__mocks__/TaskModal");
const app = {};
const noOpOnSaveSettings = async () => { };
const createNewTask = (line = '') => {
    return (0, CreateOrEditTaskParser_1.taskFromLine)({ line, path: '' });
};
jest.mock('../../src/Obsidian/TaskModal', () => {
    return {
        TaskModal: jest.fn(({ app, task, onSubmit, onCancel, allTasks }) => {
            return new TaskModal_1.TaskModal({ app, task, onSubmit, onCancel, allTasks });
        }),
    };
});
describe('APIv1 - editTaskLineModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('TaskModal.open() should be called', () => {
        const taskLine = '- [ ] ';
        (0, editTaskLineModal_1.editTaskLineModal)(app, taskLine, [], noOpOnSaveSettings);
        expect(TaskModal_1.TaskModal.instance.open).toHaveBeenCalled();
    });
    it('should return the edited Markdown', async () => {
        const taskLine = '- [ ] Updated Task';
        const taskLinePromise = (0, editTaskLineModal_1.editTaskLineModal)(app, '- [ ] Task Name', [], noOpOnSaveSettings);
        TaskModal_1.TaskModal.instance.onSubmit([createNewTask(taskLine)]);
        const result = await taskLinePromise;
        expect(result).toEqual('- [ ] Updated Task');
    });
    it('should return empty string on cancel', async () => {
        const taskLine = '- [ ] ';
        const taskLinePromise = (0, editTaskLineModal_1.editTaskLineModal)(app, taskLine, [], noOpOnSaveSettings);
        TaskModal_1.TaskModal.instance.cancel();
        const result = await taskLinePromise;
        expect(result).toEqual('');
    });
    it('should pass allTasks to TaskModal', () => {
        const taskLine = '- [ ] Task Name';
        const allTasks = [createNewTask('- [ ] Task 1')];
        (0, editTaskLineModal_1.editTaskLineModal)(app, taskLine, allTasks, noOpOnSaveSettings);
        expect(TaskModal_1.TaskModal.instance.allTasks).toEqual(allTasks);
    });
});
//# sourceMappingURL=editTaskLineModal.test.js.map