"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FolderField_1 = require("../../../src/Query/Filter/FolderField");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
describe('folder', () => {
    it('should provide access to the folder', () => {
        const field = new FolderField_1.FolderField();
        expect(field.value((0, TestHelpers_1.fromLine)({ line: '- [ ] do' }))).toStrictEqual('/');
        expect(field.value((0, TestHelpers_1.fromLine)({ line: '- [ ] do', path: 'outside/inside/file.md' }))).toStrictEqual('outside/inside/');
        expect(field.value((0, TestHelpers_1.fromLine)({ line: '- [ ] do', path: 'a_b/_c_d_/file.md' }))).toStrictEqual('a_b/_c_d_/');
    });
});
describe('folder', () => {
    // Note: We don't need to check all behaviours that are implemented in the base class.
    // These are minimal tests to confirm that the filters are correctly wired up,
    // to guard against possible future coding errors.
    it('filter by folder (includes)', () => {
        // Arrange
        const filter = new FolderField_1.FolderField().createFilterOrErrorMessage('folder includes search_text');
        // Assert
        expect(filter).toBeValid();
        expect(filter).not.toMatchTaskWithPath('');
        expect(filter).toMatchTaskWithPath('some/SeArch_Text/some file name.md');
        expect(filter).not.toMatchTaskWithPath('other/folder/search_text.md'); // Ignores text in file names
    });
});
describe('grouping by folder', () => {
    it('supports grouping methods correctly', () => {
        expect(new FolderField_1.FolderField()).toSupportGroupingWithProperty('folder');
    });
    it.each([
        ['- [ ] a', 'a/b/c.md', ['a/b/']],
        // underscores in folder names are escaped
        ['- [ ] a', 'a/_b_/c.md', ['a/\\_b\\_/']],
        // file in root of vault:
        ['- [ ] a', 'a.md', ['/']],
    ])('task "%s" with path "%s" should have groups: %s', (taskLine, path, groups) => {
        // Arrange
        const grouper = new FolderField_1.FolderField().createNormalGrouper();
        // Assert
        const tasks = [(0, TestHelpers_1.fromLine)({ line: taskLine, path: path })];
        expect({ grouper, tasks }).groupHeadingsToBe(groups);
    });
    it('should sort groups for FolderField', () => {
        // Arrange
        const tasks = SampleTasks_1.SampleTasks.withAllRootsPathsHeadings();
        const grouper = new FolderField_1.FolderField().createNormalGrouper();
        // Assert
        expect({ grouper, tasks }).groupHeadingsToBe(['/', 'a/', 'a/b/', 'a/d/', 'e/d/']);
    });
});
//# sourceMappingURL=FolderField.test.js.map