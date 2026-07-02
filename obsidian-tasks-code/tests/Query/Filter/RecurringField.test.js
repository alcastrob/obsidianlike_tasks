"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const RecurringField_1 = require("../../../src/Query/Filter/RecurringField");
const FilterTestHelpers_1 = require("../../TestingTools/FilterTestHelpers");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const RecurrenceBuilder_1 = require("../../TestingTools/RecurrenceBuilder");
window.moment = moment_1.default;
function testRecurringFilter(filter, line, expected) {
    const task = (0, TestHelpers_1.fromLine)({ line });
    (0, FilterTestHelpers_1.testTaskFilter)(filter, task, expected);
}
describe('recurring', () => {
    const non_recurring = '- [ ] non-recurring task';
    const recurring = '- [ ] recurring 🔁 every day 📅 2022-06-17';
    // Invalid recurrence rules are discarded, and treated as non-recurring
    const invalid = '- [ ] recurring 🔁 invalid rule 📅 2022-06-17';
    it('is recurring', () => {
        // Arrange
        const filter = new RecurringField_1.RecurringField().createFilterOrErrorMessage('is recurring');
        // Assert
        testRecurringFilter(filter, non_recurring, false);
        testRecurringFilter(filter, recurring, true);
        testRecurringFilter(filter, invalid, false);
    });
    it('is not recurring', () => {
        // Arrange
        const filter = new RecurringField_1.RecurringField().createFilterOrErrorMessage('is not recurring');
        // Assert
        testRecurringFilter(filter, non_recurring, true);
        testRecurringFilter(filter, recurring, false);
        testRecurringFilter(filter, invalid, true);
    });
    it('should honour original case, when explaining simple filters', () => {
        const filter = new RecurringField_1.RecurringField().createFilterOrErrorMessage('is NOT recurring');
        expect(filter).toHaveExplanation('is NOT recurring');
    });
});
describe('sorting by recurring', () => {
    const recurrence = new RecurrenceBuilder_1.RecurrenceBuilder().rule('every week when done').startDate('2022-07-14').build();
    const recurring = new TaskBuilder_1.TaskBuilder().recurrence(recurrence).build();
    const nonRecurring = new TaskBuilder_1.TaskBuilder().recurrence(null).build();
    it('supports Field sorting methods correctly', () => {
        const field = new RecurringField_1.RecurringField();
        expect(field.supportsSorting()).toEqual(true);
    });
    it('parses sort by recurrence', () => {
        const field = new RecurringField_1.RecurringField();
        expect(field.createSorterFromLine('sort by recurring')).not.toBeNull();
    });
    it('sort by due', () => {
        // Arrange
        const sorter = new RecurringField_1.RecurringField().createNormalSorter();
        // Assert
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, recurring, nonRecurring);
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, nonRecurring, recurring);
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, nonRecurring, nonRecurring);
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, recurring, recurring);
    });
    it('sort by due reverse', () => {
        // Arrange
        const sorter = new RecurringField_1.RecurringField().createReverseSorter();
        // Assert
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, recurring, nonRecurring);
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, nonRecurring, recurring);
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, nonRecurring, nonRecurring);
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, recurring, recurring);
    });
});
describe('grouping by recurring', () => {
    it('supports grouping methods correctly', () => {
        expect(new RecurringField_1.RecurringField()).toSupportGroupingWithProperty('recurring');
    });
    it.each([
        ['- [ ] a', ['Not Recurring']],
        ['- [ ] a 🔁 every Sunday', ['Recurring']],
    ])('task "%s" should have groups: %s', (taskLine, groups) => {
        // Arrange
        const grouper = new RecurringField_1.RecurringField().createNormalGrouper();
        // Assert
        const tasks = [(0, TestHelpers_1.fromLine)({ line: taskLine })];
        expect({ grouper, tasks }).groupHeadingsToBe(groups);
    });
    it('should sort groups for RecurringField', () => {
        const grouper = new RecurringField_1.RecurringField().createNormalGrouper();
        const tasks = SampleTasks_1.SampleTasks.withAllRecurrences();
        expect({ grouper, tasks }).groupHeadingsToBe(['Not Recurring', 'Recurring']);
    });
});
//# sourceMappingURL=RecurringField.test.js.map