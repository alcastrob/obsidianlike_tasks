"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PathField_1 = require("../../../src/Query/Filter/PathField");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const FilterTestHelpers_1 = require("../../TestingTools/FilterTestHelpers");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
function testTaskFilterForTaskWithPath(filter, path, expected) {
    const builder = new TaskBuilder_1.TaskBuilder();
    (0, FilterTestHelpers_1.testFilter)(filter, builder.path(path), expected);
}
describe('path', () => {
    it('by path (includes)', () => {
        // Arrange
        const filter = new PathField_1.PathField().createFilterOrErrorMessage('path includes some/path');
        // Assert
        testTaskFilterForTaskWithPath(filter, '', false);
        testTaskFilterForTaskWithPath(filter, '/some/path/file.md', true);
        testTaskFilterForTaskWithPath(filter, '/SoMe/PaTh/file.md', true);
        testTaskFilterForTaskWithPath(filter, '/other/path/file.md', false);
    });
    it('by path (does not include)', () => {
        // Arrange
        const filter = new PathField_1.PathField().createFilterOrErrorMessage('path does not include some/path');
        // Assert
        testTaskFilterForTaskWithPath(filter, '', true);
        testTaskFilterForTaskWithPath(filter, '/some/path/file.md', false);
        testTaskFilterForTaskWithPath(filter, '/other/path/file.md', true);
    });
    it('by path (regex matches)', () => {
        // Arrange
        const filter = new PathField_1.PathField().createFilterOrErrorMessage(String.raw `path regex matches /w.bble/`);
        // Assert
        expect(filter).toBeValid();
        expect(filter).toMatchTaskWithPath('some/path/wibble.md');
        expect(filter).toMatchTaskWithPath('some/path/wobble.md');
        expect(filter).not.toMatchTaskWithPath('');
        expect(filter).not.toMatchTaskWithPath('some/path/WobblE.md'); // confirm case-sensitive
        expect(filter).not.toMatchTaskWithPath('other/path/file.md');
    });
    it('by path (regex matches) with flags', () => {
        // Arrange
        const filter = new PathField_1.PathField().createFilterOrErrorMessage(String.raw `path regex matches /w.bble/i`);
        // Assert
        expect(filter).toBeValid();
        expect(filter).toMatchTaskWithPath('some/path/wibble.md');
        expect(filter).toMatchTaskWithPath('some/path/wobble.md');
        expect(filter).not.toMatchTaskWithPath('');
        expect(filter).toMatchTaskWithPath('some/path/WobblE.md'); // confirm case-insensitive (flag)
        expect(filter).not.toMatchTaskWithPath('other/path/file.md');
    });
    it('by path (regex does not match)', () => {
        // Arrange
        const filter = new PathField_1.PathField().createFilterOrErrorMessage(String.raw `path regex does not match /w.bble/`);
        // Assert
        expect(filter).toBeValid();
        expect(filter).not.toMatchTaskWithPath('some/path/wibble.md');
        expect(filter).not.toMatchTaskWithPath('some/path/wobble.md');
        expect(filter).toMatchTaskWithPath('');
        expect(filter).toMatchTaskWithPath('some/path/WobblE.md'); // confirm case-sensitive
        expect(filter).toMatchTaskWithPath('other/path/file.md');
    });
});
describe('should use whole path with un-escaped slashes in query', () => {
    const filterWithUnescapedSlashes = new PathField_1.PathField().createFilterOrErrorMessage(String.raw `path regex matches /a/b/c/d/`);
    it('should escape forward slashes in query automatically', () => {
        expect(filterWithUnescapedSlashes).toBeValid();
        expect(filterWithUnescapedSlashes).toHaveExplanation("using regex:     'a\\/b\\/c\\/d' with no flags");
    });
    it('should match the requested path', () => {
        expect(filterWithUnescapedSlashes).toMatchTaskWithPath('a/b/c/d/e.md');
        expect(filterWithUnescapedSlashes).not.toMatchTaskWithPath('a/b.md');
    });
});
describe('sorting by path', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new PathField_1.PathField();
        expect(field.supportsSorting()).toEqual(true);
    });
    // Helper function to create a task with a given path
    function with_path(path) {
        return (0, TestHelpers_1.fromLine)({ line: '- [ ] x', path: path });
    }
    it('sort by path', () => {
        // Arrange
        const sorter = new PathField_1.PathField().createNormalSorter();
        // Assert
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, with_path('a/b.md'), with_path('a/b.md'));
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_path('a/b.md'), with_path('c/d.md'));
        // Ignores case if strings differ
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_path('aaaa/bbbb.md'), with_path('CCCC/DDDD.md'));
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_path('AAAA/BBBB.md'), with_path('cccc/dddd.md'));
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_path('aaaa/bbbb.md'), with_path('AAAA/BBBB.md'));
        // Beginning with numbers
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_path('c/1.md'), with_path('c/9.md'));
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_path('c/9.md'), with_path('c/11.md'));
    });
    it('sort by path reverse', () => {
        // Single example just to prove reverse works.
        // (There's no need to repeat all the examples above)
        const sorter = new PathField_1.PathField().createReverseSorter();
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, with_path('a/b.md'), with_path('c/d.md'));
    });
});
describe('grouping by path', () => {
    it('supports grouping methods correctly', () => {
        expect(new PathField_1.PathField()).toSupportGroupingWithProperty('path');
    });
    it.each([
        // the file extension is removed
        ['- [ ] a', 'a/b/c.md', ['a/b/c']],
        // underscores in paths are escaped
        ['- [ ] a', '_a_/b/_c_.md', ['\\_a\\_/b/\\_c\\_']],
        // backslashes are escaped. (this artificial example is to test escaping)
        ['- [ ] a', 'a\\b\\c.md', ['a\\\\b\\\\c']],
    ])('task "%s" with path "%s" should have groups: %s', (taskLine, path, groups) => {
        // Arrange
        const grouper = new PathField_1.PathField().createNormalGrouper();
        // Assert
        const tasks = [(0, TestHelpers_1.fromLine)({ line: taskLine, path: path })];
        expect({ grouper, tasks }).groupHeadingsToBe(groups);
    });
    it('should sort groups for PathField', () => {
        // Arrange
        const tasks = SampleTasks_1.SampleTasks.withAllRootsPathsHeadings();
        const grouper = new PathField_1.PathField().createNormalGrouper();
        // Assert
        expect({ grouper, tasks }).groupHeadingsToBe([
            // Why there is no path for empty path?
            'a/b',
            'a/b/\\_c\\_',
            'a/b/c',
            'a/d/c',
            'a\\_b\\_c',
            'e/d/c',
        ]);
    });
});
//# sourceMappingURL=PathField.test.js.map