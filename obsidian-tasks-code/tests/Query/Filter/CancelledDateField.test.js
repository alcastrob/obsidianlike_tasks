"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const CancelledDateField_1 = require("../../../src/Query/Filter/CancelledDateField");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const FilterTestHelpers_1 = require("../../TestingTools/FilterTestHelpers");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
window.moment = moment_1.default;
function testTaskFilterForTaskWithCancelledDate(filter, cancelledDate, expected) {
    const builder = new TaskBuilder_1.TaskBuilder();
    (0, FilterTestHelpers_1.testFilter)(filter, builder.cancelledDate(cancelledDate), expected);
}
describe('cancelled date', () => {
    it('by cancelled date presence', () => {
        // Arrange
        const filter = new CancelledDateField_1.CancelledDateField().createFilterOrErrorMessage('has cancelled date');
        // Act, Assert
        testTaskFilterForTaskWithCancelledDate(filter, null, false);
        testTaskFilterForTaskWithCancelledDate(filter, '2022-04-15', true);
    });
    it('by cancelled date absence', () => {
        // Arrange
        const filter = new CancelledDateField_1.CancelledDateField().createFilterOrErrorMessage('no cancelled date');
        // Act, Assert
        testTaskFilterForTaskWithCancelledDate(filter, null, true);
        testTaskFilterForTaskWithCancelledDate(filter, '2022-04-15', false);
    });
});
describe('explain cancelled date queries', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2022-01-15'));
    });
    afterAll(() => {
        jest.useRealTimers();
    });
    it('should explain date before', () => {
        const filterOrMessage = new CancelledDateField_1.CancelledDateField().createFilterOrErrorMessage('cancelled before 2023-01-02');
        expect(filterOrMessage).toHaveExplanation('cancelled date is before 2023-01-02 (Monday 2nd January 2023)');
    });
    it('should explain date with explicit on', () => {
        const filterOrMessage = new CancelledDateField_1.CancelledDateField().createFilterOrErrorMessage('cancelled on 2024-01-02');
        expect(filterOrMessage).toHaveExplanation('cancelled date is on 2024-01-02 (Tuesday 2nd January 2024)');
    });
    it('should explain date with implicit on', () => {
        const filterOrMessage = new CancelledDateField_1.CancelledDateField().createFilterOrErrorMessage('cancelled 2024-01-02');
        expect(filterOrMessage).toHaveExplanation('cancelled date is on 2024-01-02 (Tuesday 2nd January 2024)');
    });
    it('should show value of relative dates', () => {
        const filterOrMessage = new CancelledDateField_1.CancelledDateField().createFilterOrErrorMessage('cancelled after today');
        expect(filterOrMessage).toHaveExplanation('cancelled date is after 2022-01-15 (Saturday 15th January 2022)');
    });
});
describe('sorting by cancelled', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new CancelledDateField_1.CancelledDateField();
        expect(field.supportsSorting()).toEqual(true);
    });
    // These are minimal tests just to confirm basic behaviour is set up for this field.
    // Thorough testing is cancelled in DueDateField.test.ts.
    const date1 = new TaskBuilder_1.TaskBuilder().cancelledDate('2021-01-12').build();
    const date2 = new TaskBuilder_1.TaskBuilder().cancelledDate('2022-12-23').build();
    it('sort by cancelled', () => {
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(new CancelledDateField_1.CancelledDateField().createNormalSorter(), date1, date2);
    });
    it('sort by cancelled reverse', () => {
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(new CancelledDateField_1.CancelledDateField().createReverseSorter(), date1, date2);
    });
});
describe('grouping by cancelled date', () => {
    it('supports Field grouping methods correctly', () => {
        expect(new CancelledDateField_1.CancelledDateField()).toSupportGroupingWithProperty('cancelled');
    });
    it('group by cancelled date', () => {
        // Arrange
        const grouper = new CancelledDateField_1.CancelledDateField().createNormalGrouper();
        const taskWithDate = new TaskBuilder_1.TaskBuilder().cancelledDate('1970-01-01').build();
        const taskWithoutDate = new TaskBuilder_1.TaskBuilder().build();
        // Assert
        expect({ grouper, tasks: [taskWithDate] }).groupHeadingsToBe(['1970-01-01 Thursday']);
        expect({ grouper, tasks: [taskWithoutDate] }).groupHeadingsToBe(['No cancelled date']);
    });
    it('should sort groups for CancelledDateField', () => {
        const grouper = new CancelledDateField_1.CancelledDateField().createNormalGrouper();
        const tasks = SampleTasks_1.SampleTasks.withAllRepresentativeCancelledDates();
        expect({ grouper, tasks }).groupHeadingsToBe([
            '%%0%% Invalid cancelled date',
            '2023-05-30 Tuesday',
            '2023-05-31 Wednesday',
            '2023-06-01 Thursday',
            '2023-06-02 Friday',
            'No cancelled date',
        ]);
    });
});
//# sourceMappingURL=CancelledDateField.test.js.map