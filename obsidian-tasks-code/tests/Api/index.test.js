"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createTaskLineModal_1 = require("../../src/Api/createTaskLineModal");
const editTaskLineModal_1 = require("../../src/Api/editTaskLineModal");
const index_1 = require("../../src/Api/index");
jest.mock('../../src/Api/createTaskLineModal', () => ({
    createTaskLineModal: jest.fn(),
}));
jest.mock('../../src/Api/editTaskLineModal', () => ({
    editTaskLineModal: jest.fn(),
}));
describe('definition of public Api', () => {
    it('should call createTaskLineModal with the app and allTasks', async () => {
        const task = jest.fn();
        const app = {}; // Mock the app object
        const tasks = [task];
        const mockPlugin = {
            getTasks: () => tasks,
            app,
        };
        const publicApi = (0, index_1.tasksApiV1)(mockPlugin);
        await publicApi.createTaskLineModal();
        expect(createTaskLineModal_1.createTaskLineModal).toHaveBeenCalledWith(app, tasks, expect.any(Function));
    });
    it('should call editTaskLineModal with the app, taskLine and allTasks', async () => {
        const task = jest.fn();
        const app = {}; // Mock the app object
        const tasks = [task];
        const mockPlugin = {
            getTasks: () => tasks,
            app,
        };
        const taskLine = '- [ ] Task Name';
        const publicApi = (0, index_1.tasksApiV1)(mockPlugin);
        await publicApi.editTaskLineModal(taskLine);
        expect(editTaskLineModal_1.editTaskLineModal).toHaveBeenCalledWith(app, taskLine, tasks, expect.any(Function));
    });
});
//# sourceMappingURL=index.test.js.map