"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PriorityMenu_1 = require("../../../src/ui/Menus/PriorityMenu");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const Priority_1 = require("../../../src/Task/Priority");
const MenuTestingHelpers_1 = require("./MenuTestingHelpers");
describe('PriorityMenu', () => {
    beforeEach(() => {
        MenuTestingHelpers_1.TestableTaskSaver.reset();
    });
    it('should show checkmark against the current task priority', () => {
        // Arrange
        const task = new TaskBuilder_1.TaskBuilder().build();
        // Act
        const menu = new PriorityMenu_1.PriorityMenu(task);
        // Assert
        const itemsAsText = (0, MenuTestingHelpers_1.menuToString)(menu);
        expect(itemsAsText).toMatchInlineSnapshot(`
            "
              Priority: Highest
              Priority: High
              Priority: Medium
            x Priority: Normal
              Priority: Low
              Priority: Lowest"
        `);
    });
    it('should modify task, if different priority selected', () => {
        // Arrange
        const task = new TaskBuilder_1.TaskBuilder().build();
        const menu = new PriorityMenu_1.PriorityMenu(task, MenuTestingHelpers_1.TestableTaskSaver.testableTaskSaver);
        // Act
        // @ts-expect-error TS2339: Property 'items' does not exist on type 'PriorityMenu'.
        const todoItem = menu.items[0];
        expect(todoItem.title).toEqual('Priority: Highest');
        todoItem.callback();
        // Assert
        expect(Object.is(task, MenuTestingHelpers_1.TestableTaskSaver.taskBeingOverwritten)).toEqual(true);
        expect(MenuTestingHelpers_1.TestableTaskSaver.taskBeingOverwritten.priority).toEqual(Priority_1.Priority.None);
        expect(MenuTestingHelpers_1.TestableTaskSaver.tasksBeingSaved.length).toEqual(1);
        expect(MenuTestingHelpers_1.TestableTaskSaver.tasksBeingSaved[0].priority).toEqual(Priority_1.Priority.Highest);
    });
    it('should not modify task, if current priority selected', () => {
        // Arrange
        const task = new TaskBuilder_1.TaskBuilder().priority(Priority_1.Priority.Highest).build();
        // Act
        const menu = new PriorityMenu_1.PriorityMenu(task, MenuTestingHelpers_1.TestableTaskSaver.testableTaskSaver);
        // Act
        // @ts-expect-error TS2339: Property 'items' does not exist on type 'PriorityMenu'.
        const todoItem = menu.items[0];
        expect(todoItem.title).toEqual('Priority: Highest');
        todoItem.callback();
        // Assert
        // TestableTaskSaver.testableTaskSaver() should never have been called, so the values
        // it saves should still be undefined:
        expect(MenuTestingHelpers_1.TestableTaskSaver.taskBeingOverwritten).toBeUndefined();
        expect(MenuTestingHelpers_1.TestableTaskSaver.tasksBeingSaved).toBeUndefined();
    });
});
//# sourceMappingURL=PriorityMenu.test.js.map