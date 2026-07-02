"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const StatusMenu_1 = require("../../../src/ui/Menus/StatusMenu");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const StatusRegistry_1 = require("../../../src/Statuses/StatusRegistry");
const StatusSettings_1 = require("../../../src/Config/StatusSettings");
const Settings_1 = require("../../../src/Config/Settings");
const StatusConfiguration_1 = require("../../../src/Statuses/StatusConfiguration");
const Status_1 = require("../../../src/Statuses/Status");
const MenuTestingHelpers_1 = require("./MenuTestingHelpers");
window.moment = moment_1.default;
afterEach(() => {
    (0, Settings_1.resetSettings)();
});
describe('StatusMenu', () => {
    beforeEach(() => {
        MenuTestingHelpers_1.TestableTaskSaver.reset();
    });
    it('should show checkmark against the current task status', () => {
        // Arrange
        const task = new TaskBuilder_1.TaskBuilder().status(Status_1.Status.IN_PROGRESS).build();
        const statusRegistry = new StatusRegistry_1.StatusRegistry();
        // Act
        const menu = new StatusMenu_1.StatusMenu(statusRegistry, task);
        // Assert
        const itemsAsText = (0, MenuTestingHelpers_1.menuToString)(menu);
        expect(itemsAsText).toMatchInlineSnapshot(`
            "
              Change status to: [ ] Todo
              Change status to: [x] Done
            x Change status to: [/] In Progress
              Change status to: [-] Cancelled"
        `);
    });
    it('should ignore duplicate status symbols in global status settings', () => {
        // Arrange
        const statusSettings = new StatusSettings_1.StatusSettings();
        statusSettings.customStatuses.push(new StatusConfiguration_1.StatusConfiguration('%', '% 1', '&', false, StatusConfiguration_1.StatusType.TODO));
        statusSettings.customStatuses.push(new StatusConfiguration_1.StatusConfiguration('%', '% 2', '&', false, StatusConfiguration_1.StatusType.TODO));
        (0, Settings_1.updateSettings)({
            statusSettings: statusSettings,
        });
        const statusRegistry = new StatusRegistry_1.StatusRegistry();
        StatusSettings_1.StatusSettings.applyToStatusRegistry(statusSettings, statusRegistry);
        const task = new TaskBuilder_1.TaskBuilder().build();
        // Act
        const menu = new StatusMenu_1.StatusMenu(statusRegistry, task);
        // Assert
        const itemsAsText = (0, MenuTestingHelpers_1.menuToString)(menu);
        expect(itemsAsText).toMatchInlineSnapshot(`
            "
            x Change status to: [ ] Todo
              Change status to: [x] Done
              Change status to: [/] In Progress
              Change status to: [-] Cancelled
              Change status to: [%] % 1"
        `);
    });
    it('should modify task, if different status selected', () => {
        // Arrange
        const onlyShowCancelled = new StatusRegistry_1.StatusRegistry();
        onlyShowCancelled.clearStatuses();
        onlyShowCancelled.add(Status_1.Status.CANCELLED);
        const task = new TaskBuilder_1.TaskBuilder().status(Status_1.Status.TODO).build();
        const menu = new StatusMenu_1.StatusMenu(onlyShowCancelled, task, MenuTestingHelpers_1.TestableTaskSaver.testableTaskSaver);
        // Act
        // @ts-expect-error TS2339: Property 'items' does not exist on type 'StatusMenu'.
        const todoItem = menu.items[0];
        todoItem.callback();
        // Assert
        expect(Object.is(task, MenuTestingHelpers_1.TestableTaskSaver.taskBeingOverwritten)).toEqual(true);
        expect(MenuTestingHelpers_1.TestableTaskSaver.taskBeingOverwritten.status.symbol).toEqual(' ');
        expect(MenuTestingHelpers_1.TestableTaskSaver.tasksBeingSaved.length).toEqual(1);
        expect(MenuTestingHelpers_1.TestableTaskSaver.tasksBeingSaved[0].status.symbol).toEqual('-');
    });
    it('should not modify task, if current status selected', () => {
        // Arrange
        const task = new TaskBuilder_1.TaskBuilder().build();
        const statusRegistry = new StatusRegistry_1.StatusRegistry();
        // Act
        const menu = new StatusMenu_1.StatusMenu(statusRegistry, task, MenuTestingHelpers_1.TestableTaskSaver.testableTaskSaver);
        // Act
        // @ts-expect-error TS2339: Property 'items' does not exist on type 'StatusMenu'.
        const todoItem = menu.items[0];
        expect(todoItem.title).toEqual('Change status to: [ ] Todo');
        todoItem.callback();
        // Assert
        // TestableTaskSaver.testableTaskSaver() should never have been called, so the values
        // it saves should still be undefined:
        expect(MenuTestingHelpers_1.TestableTaskSaver.taskBeingOverwritten).toBeUndefined();
        expect(MenuTestingHelpers_1.TestableTaskSaver.tasksBeingSaved).toBeUndefined();
    });
});
//# sourceMappingURL=StatusMenu.test.js.map