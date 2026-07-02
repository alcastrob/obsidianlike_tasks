"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const UrgencyField_1 = require("../../../src/Query/Filter/UrgencyField");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const Priority_1 = require("../../../src/Task/Priority");
window.moment = moment_1.default;
describe('urgency', () => {
    it('should not yet be implemented', () => {
        // Arrange
        const filter = new UrgencyField_1.UrgencyField().createFilterOrErrorMessage('any old nonsense');
        // Act, Assert
        expect(filter).not.toBeValid();
    });
});
describe('sorting by urgency', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new UrgencyField_1.UrgencyField();
        expect(field.supportsSorting()).toEqual(true);
    });
    // Helper function to create a task with a given priority
    function with_priority(priority) {
        return new TaskBuilder_1.TaskBuilder().priority(priority).build();
    }
    function with_priority_and_scheduled(priority, scheduled) {
        return new TaskBuilder_1.TaskBuilder().priority(priority).scheduledDate(scheduled).build();
    }
    it('sort by urgency', () => {
        // Arrange
        const sorter = new UrgencyField_1.UrgencyField().createNormalSorter();
        // Assert
        // Just some minimal tests to confirm that the urgency value is respected.
        // No need to replicate a large number of tests already in tests of Urgency.
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_priority(Priority_1.Priority.High), // Higher priority comes first
        with_priority(Priority_1.Priority.Medium));
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, with_priority(Priority_1.Priority.None), // Same priority compares equal
        with_priority(Priority_1.Priority.None));
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_priority_and_scheduled(Priority_1.Priority.Medium, '1999-01-12'), // If scheduled date has passed, urgency increases
        with_priority(Priority_1.Priority.Medium));
    });
    it('sort by urgency reverse', () => {
        // Single example just to prove reverse works.
        const sorter = new UrgencyField_1.UrgencyField().createReverseSorter();
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, with_priority(Priority_1.Priority.High), // Higher priority comes last
        with_priority(Priority_1.Priority.Medium));
    });
});
describe('grouping by urgency', () => {
    it('supports grouping methods correctly', () => {
        expect(new UrgencyField_1.UrgencyField()).toSupportGroupingWithProperty('urgency');
    });
    // Numbers taken from:
    // https://publish.obsidian.md/tasks/Advanced/Urgency
    it.each([
        ['- [ ] a ⏫', ['6.00']],
        ['- [ ] a 🔼', ['3.90']],
        ['- [ ] a', ['1.95']],
        ['- [ ] a 🔽', ['0.00']],
    ])('task "%s" should have groups: %s', (taskLine, groups) => {
        // Arrange
        const grouper = new UrgencyField_1.UrgencyField().createNormalGrouper();
        // Assert
        const tasks = [(0, TestHelpers_1.fromLine)({ line: taskLine })];
        expect({ grouper, tasks }).groupHeadingsToBe(groups);
    });
    describe('should sort groups for UrgencyField', () => {
        const taskLines = ['- [ ] a ⏫', '- [ ] a 🔼', '- [ ] a', '- [ ] a 🔽'];
        const tasks = taskLines.map((taskLine) => (0, TestHelpers_1.fromLine)({ line: taskLine }));
        it('highest urgency first with normal grouper', () => {
            const grouper = new UrgencyField_1.UrgencyField().createNormalGrouper();
            expect({ grouper, tasks }).groupHeadingsToBe(['0.00', '1.95', '3.90', '6.00'].reverse());
        });
        it('lowest urgency first with reverse grouper', () => {
            const grouper = new UrgencyField_1.UrgencyField().createReverseGrouper();
            expect({ grouper, tasks }).groupHeadingsToBe(['0.00', '1.95', '3.90', '6.00']);
        });
    });
});
//# sourceMappingURL=UrgencyField.test.js.map