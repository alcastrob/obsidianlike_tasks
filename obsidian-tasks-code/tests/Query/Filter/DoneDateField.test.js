"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const DoneDateField_1 = require("../../../src/Query/Filter/DoneDateField");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const FilterTestHelpers_1 = require("../../TestingTools/FilterTestHelpers");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
window.moment = moment_1.default;
function testTaskFilterForTaskWithDoneDate(filter, doneDate, expected) {
    const builder = new TaskBuilder_1.TaskBuilder();
    (0, FilterTestHelpers_1.testFilter)(filter, builder.doneDate(doneDate), expected);
}
describe('done date', () => {
    it('by done date presence', () => {
        // Arrange
        const filter = new DoneDateField_1.DoneDateField().createFilterOrErrorMessage('has done date');
        // Act, Assert
        testTaskFilterForTaskWithDoneDate(filter, null, false);
        testTaskFilterForTaskWithDoneDate(filter, '2022-04-15', true);
    });
    it('by done date absence', () => {
        // Arrange
        const filter = new DoneDateField_1.DoneDateField().createFilterOrErrorMessage('no done date');
        // Act, Assert
        testTaskFilterForTaskWithDoneDate(filter, null, true);
        testTaskFilterForTaskWithDoneDate(filter, '2022-04-15', false);
    });
});
describe('explain done date queries', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2022-01-15'));
    });
    afterAll(() => {
        jest.useRealTimers();
    });
    it('should explain date before', () => {
        const filterOrMessage = new DoneDateField_1.DoneDateField().createFilterOrErrorMessage('done before 2023-01-02');
        expect(filterOrMessage).toHaveExplanation('done date is before 2023-01-02 (Monday 2nd January 2023)');
    });
    it('should explain date with explicit on', () => {
        const filterOrMessage = new DoneDateField_1.DoneDateField().createFilterOrErrorMessage('done on 2024-01-02');
        expect(filterOrMessage).toHaveExplanation('done date is on 2024-01-02 (Tuesday 2nd January 2024)');
    });
    it('should explain date with implicit on', () => {
        const filterOrMessage = new DoneDateField_1.DoneDateField().createFilterOrErrorMessage('done 2024-01-02');
        expect(filterOrMessage).toHaveExplanation('done date is on 2024-01-02 (Tuesday 2nd January 2024)');
    });
    it('should show value of relative dates', () => {
        const filterOrMessage = new DoneDateField_1.DoneDateField().createFilterOrErrorMessage('done after today');
        expect(filterOrMessage).toHaveExplanation('done date is after 2022-01-15 (Saturday 15th January 2022)');
    });
});
describe('sorting by done', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new DoneDateField_1.DoneDateField();
        expect(field.supportsSorting()).toEqual(true);
    });
    // These are minimal tests just to confirm basic behaviour is set up for this field.
    // Thorough testing is done in DueDateField.test.ts.
    const date1 = new TaskBuilder_1.TaskBuilder().doneDate('2021-01-12').build();
    const date2 = new TaskBuilder_1.TaskBuilder().doneDate('2022-12-23').build();
    it('sort by done', () => {
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(new DoneDateField_1.DoneDateField().createNormalSorter(), date1, date2);
    });
    it('sort by done reverse', () => {
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(new DoneDateField_1.DoneDateField().createReverseSorter(), date1, date2);
    });
});
describe('grouping by done date', () => {
    it('supports Field grouping methods correctly', () => {
        expect(new DoneDateField_1.DoneDateField()).toSupportGroupingWithProperty('done');
    });
    it('group by done date', () => {
        // Arrange
        const grouper = new DoneDateField_1.DoneDateField().createNormalGrouper();
        const taskWithDate = new TaskBuilder_1.TaskBuilder().doneDate('1970-01-01').build();
        const taskWithoutDate = new TaskBuilder_1.TaskBuilder().build();
        // Assert
        expect({ grouper, tasks: [taskWithDate] }).groupHeadingsToBe(['1970-01-01 Thursday']);
        expect({ grouper, tasks: [taskWithoutDate] }).groupHeadingsToBe(['No done date']);
    });
    it('should sort groups for DoneDateField', () => {
        const grouper = new DoneDateField_1.DoneDateField().createNormalGrouper();
        const tasks = SampleTasks_1.SampleTasks.withAllRepresentativeDoneDates();
        expect({ grouper, tasks }).groupHeadingsToBe([
            '%%0%% Invalid done date',
            '2023-05-30 Tuesday',
            '2023-05-31 Wednesday',
            '2023-06-01 Thursday',
            '2023-06-02 Friday',
            'No done date',
        ]);
    });
});
//# sourceMappingURL=DoneDateField.test.js.map