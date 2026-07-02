"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const BlockingField_1 = require("../../../src/Query/Filter/BlockingField");
const BooleanField_1 = require("../../../src/Query/Filter/BooleanField");
const Status_1 = require("../../../src/Statuses/Status");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
describe('blocking', () => {
    const notBlocking = new TaskBuilder_1.TaskBuilder().build();
    const child = new TaskBuilder_1.TaskBuilder().id('12345').build();
    const childWithoutParent = new TaskBuilder_1.TaskBuilder().id('23456').build();
    const childThatIsDone = new TaskBuilder_1.TaskBuilder().id('34567').status(Status_1.Status.DONE).build();
    const parent = new TaskBuilder_1.TaskBuilder().dependsOn(['12345', '34567']).build();
    const allTasks = [notBlocking, child, childWithoutParent, childThatIsDone, parent];
    const isBlocking = new BlockingField_1.BlockingField().createFilterOrErrorMessage('is blocking');
    const isNotBlocking = new BlockingField_1.BlockingField().createFilterOrErrorMessage('is not blocking');
    it('is blocking', () => {
        expect(isBlocking).toBeValid();
        expect(isBlocking).not.toMatchTaskInTaskList(notBlocking, allTasks);
        expect(isBlocking).toMatchTaskInTaskList(child, allTasks);
        expect(isBlocking).not.toMatchTaskInTaskList(parent, allTasks);
        expect(isBlocking).not.toMatchTaskInTaskList(childWithoutParent, allTasks);
    });
    it('is not blocking', () => {
        expect(isNotBlocking).toBeValid();
        expect(isNotBlocking).toMatchTaskInTaskList(notBlocking, allTasks);
        expect(isNotBlocking).not.toMatchTaskInTaskList(child, allTasks);
        expect(isNotBlocking).toMatchTaskInTaskList(parent, allTasks);
        expect(isNotBlocking).toMatchTaskInTaskList(childWithoutParent, allTasks);
    });
    it('should not treat a done task as blocking', () => {
        expect(isBlocking).not.toMatchTaskInTaskList(childThatIsDone, allTasks);
    });
    it('is blocking - with circular dependencies, all tasks are matched', () => {
        const id1 = '1';
        const id2 = '2';
        const id3 = '3';
        const task1 = new TaskBuilder_1.TaskBuilder().id(id1).dependsOn([id2]).build();
        const task2 = new TaskBuilder_1.TaskBuilder().id(id2).dependsOn([id3]).build();
        const task3 = new TaskBuilder_1.TaskBuilder().id(id3).dependsOn([id1]).build();
        const allTasks = [task1, task2, task3];
        expect(isBlocking).toMatchTaskInTaskList(task1, allTasks);
        expect(isBlocking).toMatchTaskInTaskList(task2, allTasks);
        expect(isBlocking).toMatchTaskInTaskList(task3, allTasks);
    });
    it('should work with Boolean filters', function () {
        const id = 'abc';
        const task1 = new TaskBuilder_1.TaskBuilder().id(id).build();
        const task2 = new TaskBuilder_1.TaskBuilder().dependsOn([id]).build();
        const allTasks = [task1, task2];
        const booleanFilter = new BooleanField_1.BooleanField().createFilterOrErrorMessage('NOT ( NOT ( is blocking ) )');
        // This test ensures that BooleanField passes the task list down to individual filters
        expect(booleanFilter).toMatchTaskInTaskList(task1, allTasks);
        expect(booleanFilter).not.toMatchTaskInTaskList(task2, allTasks);
    });
});
describe('blocked', () => {
    const isNotBlocked = new BlockingField_1.BlockingField().createFilterOrErrorMessage('is not blocked');
    const isBlocked = new BlockingField_1.BlockingField().createFilterOrErrorMessage('is blocked');
    const blockingId = 'abc';
    const blocking = new TaskBuilder_1.TaskBuilder().id(blockingId).build();
    it('should hide blocked tasks', () => {
        const blocked = new TaskBuilder_1.TaskBuilder().dependsOn([blockingId]).build();
        const allTasks = [blocking, blocked];
        expect(isNotBlocked).toBeValid();
        expect(isNotBlocked).not.toMatchTaskInTaskList(blocked, allTasks);
        expect(isNotBlocked).toMatchTaskInTaskList(blocking, allTasks);
        expect(isBlocked).toMatchTaskInTaskList(blocked, allTasks);
        expect(isBlocked).not.toMatchTaskInTaskList(blocking, allTasks);
    });
    it('should treat completed deps as non-blocking', () => {
        const blockingCompletedId = 'def';
        const blockingCompleted = new TaskBuilder_1.TaskBuilder().id(blockingCompletedId).status(Status_1.Status.DONE).build();
        const blockedByIncomplete = new TaskBuilder_1.TaskBuilder().dependsOn([blockingId]).build();
        const blockedByComplete = new TaskBuilder_1.TaskBuilder().dependsOn([blockingCompletedId]).build();
        const blockedByAll = new TaskBuilder_1.TaskBuilder().dependsOn([blockingId, blockingCompletedId]).build();
        const allTasks = [blocking, blockedByIncomplete, blockedByComplete, blockedByAll, blockingCompleted];
        expect(isNotBlocked).toMatchTaskInTaskList(blockingCompleted, allTasks);
        expect(isNotBlocked).toMatchTaskInTaskList(blockedByComplete, allTasks);
        expect(isNotBlocked).not.toMatchTaskInTaskList(blockedByIncomplete, allTasks);
        expect(isNotBlocked).not.toMatchTaskInTaskList(blockedByAll, allTasks);
    });
    it('should not treat completed tasks as blocked', () => {
        const doneTaskDependingOnBlocking = (0, TestHelpers_1.fromLine)({ line: `- [x] Done ⛔ ${blockingId}` });
        const allTasks = [blocking, doneTaskDependingOnBlocking];
        expect(isNotBlocked).toMatchTaskInTaskList(doneTaskDependingOnBlocking, allTasks);
    });
});
//# sourceMappingURL=BlockingField.test.js.map