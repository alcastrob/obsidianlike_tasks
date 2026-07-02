"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const StartDateField_1 = require("../../../src/Query/Filter/StartDateField");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
window.moment = moment_1.default;
describe('explain start date queries', () => {
    it('should explain explicit date', () => {
        const filterOrMessage = new StartDateField_1.StartDateField().createFilterOrErrorMessage('starts before 2023-01-02');
        expect(filterOrMessage).toHaveExplanation('start date is before 2023-01-02 (Monday 2nd January 2023) OR no start date');
    });
    it('should explain absolute date range', () => {
        const filterOrMessage = new StartDateField_1.StartDateField().createFilterOrErrorMessage('starts 2023-03-01 2023-03-03');
        // Full date range testing done in DueDateField
        // But StartDateField is so far the only Field with 'OR no start date' in explanation
        expect(filterOrMessage).toHaveExplanation(`start date is between:
  2023-03-01 (Wednesday 1st March 2023) and
  2023-03-03 (Friday 3rd March 2023) inclusive
  OR no start date`);
    });
    it('implicit "on" gets added to explanation, and it is clear that start date is optional', () => {
        const filterOrMessage = new StartDateField_1.StartDateField().createFilterOrErrorMessage('starts 2023-01-02');
        expect(filterOrMessage).toHaveExplanation('start date is on 2023-01-02 (Monday 2nd January 2023) OR no start date');
    });
});
describe('sorting by start', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new StartDateField_1.StartDateField();
        expect(field.supportsSorting()).toEqual(true);
    });
    // These are minimal tests just to confirm basic behaviour is set up for this field.
    // Thorough testing is done in DueDateField.test.ts.
    const date1 = new TaskBuilder_1.TaskBuilder().startDate('2021-01-12').build();
    const date2 = new TaskBuilder_1.TaskBuilder().startDate('2022-12-23').build();
    it('sort by start', () => {
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(new StartDateField_1.StartDateField().createNormalSorter(), date1, date2);
    });
    it('sort by start reverse', () => {
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(new StartDateField_1.StartDateField().createReverseSorter(), date1, date2);
    });
});
describe('grouping by start date', () => {
    it('supports Field grouping methods correctly', () => {
        expect(new StartDateField_1.StartDateField()).toSupportGroupingWithProperty('start');
    });
    it('group by start date', () => {
        // Arrange
        const grouper = new StartDateField_1.StartDateField().createNormalGrouper();
        const taskWithDate = new TaskBuilder_1.TaskBuilder().startDate('1970-01-01').build();
        const taskWithoutDate = new TaskBuilder_1.TaskBuilder().build();
        // Assert
        expect({ grouper, tasks: [taskWithDate] }).groupHeadingsToBe(['1970-01-01 Thursday']);
        expect({ grouper, tasks: [taskWithoutDate] }).groupHeadingsToBe(['No start date']);
    });
    it('should sort groups for StartDateField', () => {
        const grouper = new StartDateField_1.StartDateField().createNormalGrouper();
        const tasks = SampleTasks_1.SampleTasks.withAllRepresentativeStartDates();
        expect({ grouper, tasks }).groupHeadingsToBe([
            '%%0%% Invalid start date',
            '2023-05-30 Tuesday',
            '2023-05-31 Wednesday',
            '2023-06-01 Thursday',
            '2023-06-02 Friday',
            'No start date',
        ]);
    });
});
//# sourceMappingURL=StartDateField.test.js.map