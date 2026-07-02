"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskDependency_1 = require("../../src/Task/TaskDependency");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
describe('TaskDependency', () => {
    it('Should add id to task without id', () => {
        const task = new TaskBuilder_1.TaskBuilder().build();
        const newTask = (0, TaskDependency_1.ensureTaskHasId)(task, []);
        expect(newTask.id).not.toEqual('');
    });
    it('Should return original task if it already has id', () => {
        const task = new TaskBuilder_1.TaskBuilder().id('abc123').build();
        const newTask = (0, TaskDependency_1.ensureTaskHasId)(task, ['abc123']);
        expect(newTask === task).toEqual(true);
    });
    it('Should add dependency on existing id', () => {
        const childTask = new TaskBuilder_1.TaskBuilder().id('123456').build();
        const parentTask = new TaskBuilder_1.TaskBuilder().description('parent task').build();
        const [newParent, newChild] = (0, TaskDependency_1.addDependency)(parentTask, childTask, ['123456']);
        expect(parentTask.dependsOn).toEqual([]);
        expect(newParent.dependsOn).toEqual(['123456']);
        expect(childTask.id).toEqual('123456');
        expect(newChild.id).toEqual('123456');
        expect(newChild === childTask).toEqual(true);
    });
    it('Should not create a duplicate dependency - using addDependency', () => {
        const childTask = new TaskBuilder_1.TaskBuilder().id('123456').build();
        const parentTask = new TaskBuilder_1.TaskBuilder().dependsOn(['123456']).description('parent task').build();
        const [newParent, newChild] = (0, TaskDependency_1.addDependency)(parentTask, childTask, ['123456']);
        expect(parentTask.dependsOn).toEqual(['123456']);
        expect(newParent.dependsOn).toEqual(['123456']);
        expect(childTask.id).toEqual('123456');
        expect(newChild.id).toEqual('123456');
        expect(newChild === childTask).toEqual(true);
        expect(newParent === parentTask).toEqual(true);
    });
    it('Should add an id to a child task with no id', () => {
        const childTask = new TaskBuilder_1.TaskBuilder().build();
        const parentTask = new TaskBuilder_1.TaskBuilder().description('parent task').build();
        const [newParent, newChild] = (0, TaskDependency_1.addDependency)(parentTask, childTask, []);
        expect(newChild.id).not.toEqual('');
        expect(newParent.dependsOn).toEqual([newChild.id]);
    });
    it('Should remove a dependency', () => {
        const childTask = new TaskBuilder_1.TaskBuilder().id('123456').build();
        const parentTask = new TaskBuilder_1.TaskBuilder().dependsOn(['123456']).description('parent task').build();
        const newParent = (0, TaskDependency_1.removeDependency)(parentTask, childTask);
        expect(parentTask.dependsOn).toEqual(['123456']);
        expect(newParent.dependsOn).toEqual([]);
        expect(childTask.id).toEqual('123456');
    });
    it('Should make task depend on 3 child tasks', () => {
        const childTask1 = new TaskBuilder_1.TaskBuilder().id('123456').build();
        const childTask2 = new TaskBuilder_1.TaskBuilder().id('234567').build();
        const childTask3 = new TaskBuilder_1.TaskBuilder().id('345678').build();
        const parentTask = new TaskBuilder_1.TaskBuilder().description('parent task').dependsOn(['012345']).build();
        const newParent = (0, TaskDependency_1.setDependenciesOnTasksWithIds)(parentTask, [childTask1, childTask2, childTask3]);
        expect(parentTask.dependsOn).toEqual(['012345']);
        expect(newParent.dependsOn).toEqual(['123456', '234567', '345678']);
    });
    it('Should not create a duplicate dependency - using setDependenciesOnTasksWithIds', () => {
        const childTask = new TaskBuilder_1.TaskBuilder().id('123456').build();
        const parentTask = new TaskBuilder_1.TaskBuilder().dependsOn(['123456']).description('parent task').build();
        const newParent = (0, TaskDependency_1.setDependenciesOnTasksWithIds)(parentTask, [childTask]);
        expect(parentTask.dependsOn).toEqual(['123456']);
        expect(newParent.dependsOn).toEqual(['123456']);
        expect(childTask.id).toEqual('123456');
        expect(newParent === parentTask).toEqual(true);
    });
});
//# sourceMappingURL=TaskDependency.test.js.map