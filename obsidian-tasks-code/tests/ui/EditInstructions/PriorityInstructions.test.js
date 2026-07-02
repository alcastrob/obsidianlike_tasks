"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const PriorityInstructions_1 = require("../../../src/ui/EditInstructions/PriorityInstructions");
const Priority_1 = require("../../../src/Task/Priority");
describe('SetPriority', () => {
    const lowPriorityTask = new TaskBuilder_1.TaskBuilder().priority(Priority_1.Priority.Low).build();
    const normalPriorityTask = new TaskBuilder_1.TaskBuilder().priority(Priority_1.Priority.None).build();
    const highPriorityTask = new TaskBuilder_1.TaskBuilder().priority(Priority_1.Priority.High).build();
    it('should provide information to set up a menu item for setting priority', () => {
        // Arrange
        const instruction = new PriorityInstructions_1.SetPriority(Priority_1.Priority.None);
        // Assert
        expect(instruction.instructionDisplayName()).toEqual('Priority: Normal');
        expect(instruction.isCheckedForTask(highPriorityTask)).toEqual(false);
        expect(instruction.isCheckedForTask(normalPriorityTask)).toEqual(true);
    });
    it('should edit priority', () => {
        // Arrange
        const instruction = new PriorityInstructions_1.SetPriority(Priority_1.Priority.High);
        // Act
        const newTasks = instruction.apply(lowPriorityTask);
        // Assert
        expect(newTasks.length).toEqual(1);
        expect(newTasks[0].priority).toEqual(Priority_1.Priority.High);
    });
    it('should not edit task if already has chosen priority', () => {
        // Arrange
        const instruction = new PriorityInstructions_1.SetPriority(Priority_1.Priority.High);
        // Act
        const newTasks = instruction.apply(highPriorityTask);
        // Assert
        expect(newTasks.length).toEqual(1);
        // Expect it is the same object
        expect(Object.is(newTasks[0], highPriorityTask)).toBe(true);
    });
});
describe('All Priority Instructions', () => {
    it('should supply all priority instructions', () => {
        // Arrange
        const allInstructions = (0, PriorityInstructions_1.allPriorityInstructions)();
        // Assert
        expect(allInstructions.length).toBe(6);
        expect(allInstructions[0].newPriority).toBe(Priority_1.Priority.Highest);
        expect(allInstructions[5].newPriority).toBe(Priority_1.Priority.Lowest);
    });
});
//# sourceMappingURL=PriorityInstructions.test.js.map