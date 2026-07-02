"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StatusNameField_1 = require("../../../src/Query/Filter/StatusNameField");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
// Abbreviated names so that the markdown text is aligned
const todoTask = (0, TestHelpers_1.fromLine)({ line: '- [ ] Xxx' });
const inprTask = (0, TestHelpers_1.fromLine)({ line: '- [/] Xxx' });
const doneTask = (0, TestHelpers_1.fromLine)({ line: '- [x] Xxx' });
const cancTask = (0, TestHelpers_1.fromLine)({ line: '- [-] Xxx' });
const unknTask = (0, TestHelpers_1.fromLine)({ line: '- [%] Xxx' });
describe('status.name', () => {
    it('value', () => {
        // Arrange
        const filter = new StatusNameField_1.StatusNameField();
        // Assert
        expect(filter.value(todoTask)).toStrictEqual('Todo');
        expect(filter.value(inprTask)).toStrictEqual('In Progress');
        expect(filter.value(doneTask)).toStrictEqual('Done');
        expect(filter.value(cancTask)).toStrictEqual('Cancelled');
        expect(filter.value(unknTask)).toStrictEqual('Unknown');
    });
    it('status.name includes', () => {
        // Arrange
        const filter = new StatusNameField_1.StatusNameField().createFilterOrErrorMessage('status.name includes todo');
        // Assert
        expect(filter).toBeValid();
        expect(filter).toMatchTaskFromLine('- [ ] Xxx');
        expect(filter).not.toMatchTaskFromLine('- [x] Xxx');
    });
    it('status-name is not valid', () => {
        // Arrange
        const filter = new StatusNameField_1.StatusNameField().createFilterOrErrorMessage('status-name includes todo');
        // Assert
        // Check that the '.' in status.name is interpreted exactly as a dot.
        expect(filter).not.toBeValid();
    });
});
describe('sorting by status.name', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new StatusNameField_1.StatusNameField();
        expect(field.supportsSorting()).toEqual(true);
    });
    it('should parse sort line correctly', () => {
        expect(new StatusNameField_1.StatusNameField().createSorterFromLine('sort by status.name reverse')).not.toBeNull();
        expect(new StatusNameField_1.StatusNameField().createSorterFromLine('sort by status-name reverse')).toBeNull();
    });
    it('sort by status.name', () => {
        // Arrange
        const sorter = new StatusNameField_1.StatusNameField().createNormalSorter();
        // Assert
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, cancTask, cancTask);
        // Reverse of Alphabetical order by status name
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, cancTask, doneTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, doneTask, inprTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, inprTask, todoTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, todoTask, unknTask);
    });
    it('sort by status.name reverse', () => {
        // Arrange
        const sorter = new StatusNameField_1.StatusNameField().createReverseSorter();
        // Assert
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, cancTask, cancTask);
        // Alphabetical order by status name
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, cancTask, doneTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, doneTask, inprTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, inprTask, todoTask);
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, todoTask, unknTask);
    });
});
describe('grouping by status.name', () => {
    it('supports Field grouping methods correctly', () => {
        expect(new StatusNameField_1.StatusNameField()).toSupportGroupingWithProperty('status.name');
    });
    it('group by status.name', () => {
        // Arrange
        const grouper = new StatusNameField_1.StatusNameField().createNormalGrouper();
        // // Assert
        expect({ grouper, tasks: [todoTask] }).groupHeadingsToBe(['Todo']);
        expect({ grouper, tasks: [inprTask] }).groupHeadingsToBe(['In Progress']);
    });
    it('should sort groups for StatusNameField', () => {
        const grouper = new StatusNameField_1.StatusNameField().createNormalGrouper();
        const tasks = SampleTasks_1.SampleTasks.withAllStatuses();
        expect({ grouper, tasks }).groupHeadingsToBe([
            'Cancelled',
            'Done',
            'EMPTY',
            'In Progress',
            'Non-Task',
            'On Hold',
            'Todo',
        ]);
    });
});
//# sourceMappingURL=StatusNameField.test.js.map