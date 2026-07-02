"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FilterTestHelpers_1 = require("../../TestingTools/FilterTestHelpers");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const IdField_1 = require("../../../src/Query/Filter/IdField");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const idField = new IdField_1.IdField();
// Helper function to create a task with a given id
function with_id(id) {
    return new TaskBuilder_1.TaskBuilder().id(id).build();
}
describe('id', () => {
    it('should supply field name', () => {
        expect(idField.fieldName()).toEqual('id');
    });
    it('by id presence', () => {
        // Arrange
        const line = 'has id';
        const filter = new IdField_1.IdField().createFilterOrErrorMessage(line);
        expect(idField.canCreateFilterForLine(line)).toEqual(true);
        // Act, Assert
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id(''), false);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id('abcdef'), true);
    });
    it('by id absence', () => {
        // Arrange
        const line = 'no id';
        const filter = new IdField_1.IdField().createFilterOrErrorMessage(line);
        expect(idField.canCreateFilterForLine(line)).toEqual(true);
        // Act, Assert
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id(''), true);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id('abcdef'), false);
    });
    it('by id (includes)', () => {
        // Arrange
        const filter = new IdField_1.IdField().createFilterOrErrorMessage('id includes DEF');
        // Assert
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id(''), false);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id('abcdef'), true);
    });
    it('by id (does not include)', () => {
        // Arrange
        const filter = new IdField_1.IdField().createFilterOrErrorMessage('id does not include def');
        // Assert
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id(''), true);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id('abcdef'), false);
    });
    it('by id (regex matches)', () => {
        // Arrange
        const filter = new IdField_1.IdField().createFilterOrErrorMessage(String.raw `id regex matches /\d/`);
        // Assert
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id(''), false);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id('a1'), true);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id('bc'), false);
    });
    it('by id (regex does not match)', () => {
        // Arrange
        const filter = new IdField_1.IdField().createFilterOrErrorMessage(String.raw `id regex does not match /\d/`);
        // Assert
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id(''), true);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id('a1'), false);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().id('bc'), true);
    });
});
describe('sorting by id', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new IdField_1.IdField();
        expect(field.supportsSorting()).toEqual(true);
    });
    it('sort by id', () => {
        // Arrange
        const sorter = new IdField_1.IdField().createNormalSorter();
        // Assert
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, with_id('mvplec'), with_id('mvplec'));
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_id('g7317o'), with_id('rot7gb'));
        // Beginning with numbers
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_id('1'), with_id('9'));
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_id('9'), with_id('11'));
    });
    it('sort by id reverse', () => {
        // Single example just to prove reverse works.
        // (There's no need to repeat all the examples above)
        const sorter = new IdField_1.IdField().createReverseSorter();
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, with_id('bbb'), with_id('ddd'));
    });
});
describe('grouping by id', () => {
    // Only minimal tests needed, as TextField is well covered by other tests
    it('supports grouping methods correctly', () => {
        expect(idField).toSupportGroupingWithProperty('id');
    });
    it('should group by id name', () => {
        const grouper = idField.createNormalGrouper();
        expect({ grouper, tasks: [with_id('')] }).groupHeadingsToBe([]);
        expect({ grouper, tasks: [with_id('rot7gb')] }).groupHeadingsToBe(['rot7gb']);
    });
});
//# sourceMappingURL=IdField.test.js.map