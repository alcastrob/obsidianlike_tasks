"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const CreatedDateField_1 = require("../../../src/Query/Filter/CreatedDateField");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const FilterTestHelpers_1 = require("../../TestingTools/FilterTestHelpers");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
window.moment = moment_1.default;
function testTaskFilterForTaskWithCreatedDate(filter, createdDate, expected) {
    const builder = new TaskBuilder_1.TaskBuilder();
    (0, FilterTestHelpers_1.testFilter)(filter, builder.createdDate(createdDate), expected);
}
describe('created date', () => {
    it('by created date (before)', () => {
        // Arrange
        const filter = new CreatedDateField_1.CreatedDateField().createFilterOrErrorMessage('created before 2022-04-20');
        // Act, Assert
        testTaskFilterForTaskWithCreatedDate(filter, null, false);
        testTaskFilterForTaskWithCreatedDate(filter, '2022-04-15', true);
        testTaskFilterForTaskWithCreatedDate(filter, '2022-04-20', false);
        testTaskFilterForTaskWithCreatedDate(filter, '2022-04-25', false);
    });
    it('created date is invalid', () => {
        // Arrange
        const filter = new CreatedDateField_1.CreatedDateField().createFilterOrErrorMessage('created date is invalid');
        // Act, Assert
        testTaskFilterForTaskWithCreatedDate(filter, null, false);
        testTaskFilterForTaskWithCreatedDate(filter, '2022-04-15', false);
        testTaskFilterForTaskWithCreatedDate(filter, '2022-02-30', true); // 30 February is not valid
        testTaskFilterForTaskWithCreatedDate(filter, '2022-00-01', true); // month 0 not valid
        testTaskFilterForTaskWithCreatedDate(filter, '2022-13-01', true); // month 13 not valid
    });
});
describe('explain created date queries', () => {
    it('should explain explicit date', () => {
        const filterOrMessage = new CreatedDateField_1.CreatedDateField().createFilterOrErrorMessage('created before 2023-01-02');
        expect(filterOrMessage).toHaveExplanation('created date is before 2023-01-02 (Monday 2nd January 2023)');
    });
    it('implicit "on" gets added to explanation', () => {
        const filterOrMessage = new CreatedDateField_1.CreatedDateField().createFilterOrErrorMessage('created 2023-01-02');
        expect(filterOrMessage).toHaveExplanation('created date is on 2023-01-02 (Monday 2nd January 2023)');
    });
});
describe('sorting by created', () => {
    const date1 = new TaskBuilder_1.TaskBuilder().createdDate('2021-01-12').build();
    const date2 = new TaskBuilder_1.TaskBuilder().createdDate('2022-12-23').build();
    it('supports Field sorting methods correctly', () => {
        const field = new CreatedDateField_1.CreatedDateField();
        expect(field.supportsSorting()).toEqual(true);
    });
    it('sort by created', () => {
        // Arrange
        const sorter = new CreatedDateField_1.CreatedDateField().createNormalSorter();
        // Assert
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, date1, date2);
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, date2, date1);
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, date2, date2);
    });
    it('sort by created reverse', () => {
        // Arrange
        const sorter = new CreatedDateField_1.CreatedDateField().createReverseSorter();
        // Assert
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, date1, date2);
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, date2, date1);
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, date2, date2);
    });
});
describe('grouping by created date', () => {
    it('supports Field grouping methods correctly', () => {
        expect(new CreatedDateField_1.CreatedDateField()).toSupportGroupingWithProperty('created');
    });
    it('group by created date', () => {
        // Arrange
        const grouper = new CreatedDateField_1.CreatedDateField().createNormalGrouper();
        const taskWithDate = new TaskBuilder_1.TaskBuilder().createdDate('1970-01-01').build();
        const taskWithoutDate = new TaskBuilder_1.TaskBuilder().build();
        // Assert
        expect({ grouper, tasks: [taskWithDate] }).groupHeadingsToBe(['1970-01-01 Thursday']);
        expect({ grouper, tasks: [taskWithoutDate] }).groupHeadingsToBe(['No created date']);
    });
    it('should sort groups for CreatedDateField', () => {
        const grouper = new CreatedDateField_1.CreatedDateField().createNormalGrouper();
        const tasks = SampleTasks_1.SampleTasks.withAllRepresentativeCreatedDates();
        expect({ grouper, tasks }).groupHeadingsToBe([
            '%%0%% Invalid created date',
            '2023-05-30 Tuesday',
            '2023-05-31 Wednesday',
            '2023-06-01 Thursday',
            '2023-06-02 Friday',
            'No created date',
        ]);
    });
});
//# sourceMappingURL=CreatedDateField.test.js.map