"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const ScheduledDateField_1 = require("../../../src/Query/Filter/ScheduledDateField");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
window.moment = moment_1.default;
describe('explain scheduled date queries', () => {
    it('should explain explicit date', () => {
        const filterOrMessage = new ScheduledDateField_1.ScheduledDateField().createFilterOrErrorMessage('scheduled before 2023-01-02');
        expect(filterOrMessage).toHaveExplanation('scheduled date is before 2023-01-02 (Monday 2nd January 2023)');
    });
    it('implicit "on" gets added to explanation', () => {
        const filterOrMessage = new ScheduledDateField_1.ScheduledDateField().createFilterOrErrorMessage('scheduled 2023-01-02');
        expect(filterOrMessage).toHaveExplanation('scheduled date is on 2023-01-02 (Monday 2nd January 2023)');
    });
});
describe('sorting by scheduled', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new ScheduledDateField_1.ScheduledDateField();
        expect(field.supportsSorting()).toEqual(true);
    });
    // These are minimal tests just to confirm basic behaviour is set up for this field.
    // Thorough testing is done in DueDateField.test.ts.
    const date1 = new TaskBuilder_1.TaskBuilder().scheduledDate('2021-01-12').build();
    const date2 = new TaskBuilder_1.TaskBuilder().scheduledDate('2022-12-23').build();
    it('sort by scheduled', () => {
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(new ScheduledDateField_1.ScheduledDateField().createNormalSorter(), date1, date2);
    });
    it('sort by scheduled reverse', () => {
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(new ScheduledDateField_1.ScheduledDateField().createReverseSorter(), date1, date2);
    });
});
describe('grouping by scheduled date', () => {
    it('supports Field grouping methods correctly', () => {
        expect(new ScheduledDateField_1.ScheduledDateField()).toSupportGroupingWithProperty('scheduled');
    });
    it('group by scheduled date', () => {
        // Arrange
        const grouper = new ScheduledDateField_1.ScheduledDateField().createNormalGrouper();
        const taskWithDate = new TaskBuilder_1.TaskBuilder().scheduledDate('1970-01-01').build();
        const taskWithoutDate = new TaskBuilder_1.TaskBuilder().build();
        // Assert
        expect({ grouper, tasks: [taskWithDate] }).groupHeadingsToBe(['1970-01-01 Thursday']);
        expect({ grouper, tasks: [taskWithoutDate] }).groupHeadingsToBe(['No scheduled date']);
    });
    it('should sort groups for ScheduledDateField', () => {
        const grouper = new ScheduledDateField_1.ScheduledDateField().createNormalGrouper();
        const tasks = SampleTasks_1.SampleTasks.withAllRepresentativeScheduledDates();
        expect({ grouper, tasks }).groupHeadingsToBe([
            '%%0%% Invalid scheduled date',
            '2023-05-30 Tuesday',
            '2023-05-31 Wednesday',
            '2023-06-01 Thursday',
            '2023-06-02 Friday',
            'No scheduled date',
        ]);
    });
});
//# sourceMappingURL=ScheduledDateField.test.js.map