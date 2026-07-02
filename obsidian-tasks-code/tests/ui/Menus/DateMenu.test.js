"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment/moment"));
const DateMenu_1 = require("../../../src/ui/Menus/DateMenu");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const TaskLayoutOptions_1 = require("../../../src/Layout/TaskLayoutOptions");
const MenuTestingHelpers_1 = require("./MenuTestingHelpers");
window.moment = moment_1.default;
const farPast = '2022-01-17';
const today = '2023-12-03';
beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(today));
    MenuTestingHelpers_1.TestableTaskSaver.reset();
});
afterEach(() => {
    jest.useRealTimers();
});
describe('DateMenu', () => {
    beforeEach(() => {
        MenuTestingHelpers_1.TestableTaskSaver.reset();
    });
    it('should populate a menu for a Due date', () => {
        // Arrange
        const task = new TaskBuilder_1.TaskBuilder().dueDate(farPast).build();
        // Act
        const field = TaskLayoutOptions_1.TaskLayoutComponent.ScheduledDate;
        const menu = new DateMenu_1.DateMenu(field, task);
        // Assert
        const itemsAsText = (0, MenuTestingHelpers_1.menuToString)(menu);
        expect(itemsAsText).toMatchInlineSnapshot(`
            "
              Scheduled today, on Sun 3rd Dec
              Scheduled tomorrow, on Mon 4th Dec
              ---
              Scheduled in 2 days, on Tue 5th Dec
              Scheduled in 3 days, on Wed 6th Dec
              Scheduled in 4 days, on Thu 7th Dec
              Scheduled in 5 days, on Fri 8th Dec
              Scheduled in 6 days, on Sat 9th Dec
              ---
              Scheduled in a week, on Sun 10th Dec
              Scheduled in 2 weeks, on Sun 17th Dec
              Scheduled in 3 weeks, on Sun 24th Dec
              Scheduled in a month, on Wed 3rd Jan
              ---
              Remove scheduled date"
        `);
    });
    it('should populate a menu for a Cancelled date', () => {
        // Arrange
        const task = new TaskBuilder_1.TaskBuilder().cancelledDate(today).build();
        // Act
        const field = TaskLayoutOptions_1.TaskLayoutComponent.CancelledDate;
        const menu = new DateMenu_1.DateMenu(field, task);
        // Assert
        const itemsAsText = (0, MenuTestingHelpers_1.menuToString)(menu);
        expect(itemsAsText).toMatchInlineSnapshot(`
            "
            x Cancelled today, on Sun 3rd Dec
              Cancelled yesterday, on Sat 2nd Dec
              ---
              Cancelled 2 days ago, on Fri 1st Dec
              Cancelled 3 days ago, on Thu 30th Nov
              Cancelled 4 days ago, on Wed 29th Nov
              Cancelled 5 days ago, on Tue 28th Nov
              Cancelled 6 days ago, on Mon 27th Nov
              ---
              Cancelled 1 week ago, on Sun 26th Nov
              Cancelled 2 weeks ago, on Sun 19th Nov
              Cancelled 3 weeks ago, on Sun 12th Nov
              Cancelled 1 month ago, on Fri 3rd Nov
              ---
              Remove cancelled date"
        `);
    });
});
//# sourceMappingURL=DateMenu.test.js.map