"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const FilenameField_1 = require("../../../src/Query/Filter/FilenameField");
const CustomMatchersForSorting = __importStar(require("../../CustomMatchers/CustomMatchersForSorting"));
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
describe('filename', () => {
    it('should provide access to the file name with extension', () => {
        const pathField = new FilenameField_1.FilenameField();
        const builder = new TaskBuilder_1.TaskBuilder();
        expect(pathField.value(builder.path('').build())).toStrictEqual('');
        expect(pathField.value(builder.path('file in root.md').build())).toStrictEqual('file in root.md');
        expect(pathField.value(builder.path('directory name/file in sub-directory.md').build())).toStrictEqual('file in sub-directory.md');
    });
});
describe('filename', () => {
    // Note: We don't need to check all behaviours that are implemented in the base class.
    // These are minimal tests to confirm that the filters are correctly wired up,
    // to guard against possible future coding errors.
    it('by filename (includes)', () => {
        // Arrange
        const filter = new FilenameField_1.FilenameField().createFilterOrErrorMessage('filename includes search_text');
        // Assert
        expect(filter).toBeValid();
        expect(filter).not.toMatchTaskWithPath('');
        expect(filter).toMatchTaskWithPath('some/path/SeArch_Text.md');
        expect(filter).not.toMatchTaskWithPath('other/search_text/file.md'); // Ignores text in folder names
    });
    it('by filename (does not include)', () => {
        // Arrange
        const filter = new FilenameField_1.FilenameField().createFilterOrErrorMessage('filename does not include search_text');
        // Assert
        expect(filter).toBeValid();
        expect(filter).toMatchTaskWithPath('');
        expect(filter).toMatchTaskWithPath('other/search_text/file.md'); // Ignores text in folder names
        expect(filter).not.toMatchTaskWithPath('SoMe/PaTh/SeArcH_Text.md');
    });
    it('by filename (regex matches)', () => {
        // Arrange
        const filter = new FilenameField_1.FilenameField().createFilterOrErrorMessage(String.raw `filename regex matches /w.bble/`);
        // Assert
        expect(filter).toBeValid();
        expect(filter).toMatchTaskWithPath('some/path/wibble.md');
        expect(filter).not.toMatchTaskWithPath('some/wibble/filename.md');
    });
    it('by filename (regex does not match)', () => {
        // Arrange
        const filter = new FilenameField_1.FilenameField().createFilterOrErrorMessage(String.raw `filename regex does not match /w.bble/`);
        // Assert
        expect(filter).toBeValid();
        expect(filter).toMatchTaskWithPath('some/wobble/path name.md');
        expect(filter).not.toMatchTaskWithPath('some/path/wibble.md');
    });
});
describe('sorting by filename', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new FilenameField_1.FilenameField();
        expect(field.supportsSorting()).toEqual(true);
    });
    // Helper function to create a task with a given path
    function with_path(path) {
        return new TaskBuilder_1.TaskBuilder().path(path).build();
    }
    it('sort by filename', () => {
        // Arrange
        const sorter = new FilenameField_1.FilenameField().createNormalSorter();
        // Assert
        CustomMatchersForSorting.expectTaskComparesEqual(sorter, with_path('some path/filename.md'), // Only sorts file name - ignores folders (which differ)
        with_path('other path/filename.md'));
        // Beginning with numbers
        CustomMatchersForSorting.expectTaskComparesBefore(sorter, with_path('c/1.md'), with_path('c/9.md'));
        CustomMatchersForSorting.expectTaskComparesBefore(sorter, with_path('c/9.md'), with_path('c/11.md'));
    });
    it('sort by filename reverse', () => {
        // Single example just to prove reverse works.
        // (There's no need to repeat all the examples above)
        const sorter = new FilenameField_1.FilenameField().createReverseSorter();
        CustomMatchersForSorting.expectTaskComparesAfter(sorter, with_path('a/b.md'), with_path('c/d.md'));
    });
});
describe('grouping by filename', () => {
    it('supports grouping methods correctly', () => {
        expect(new FilenameField_1.FilenameField()).toSupportGroupingWithProperty('filename');
    });
    it.each([
        ['- [ ] a', 'a/b/c.md', ['[[c]]']],
        // underscores in links shall not be escaped
        ['- [ ] a', 'a/b/_c_.md', ['[[_c_]]']],
    ])('task "%s" with path "%s" should have groups: %s', (taskLine, path, groups) => {
        // Arrange
        const grouper = new FilenameField_1.FilenameField().createNormalGrouper();
        // Assert
        const tasks = [(0, TestHelpers_1.fromLine)({ line: taskLine, path: path })];
        expect({ grouper, tasks }).groupHeadingsToBe(groups);
    });
    it('should sort groups for FilenameField', () => {
        // Arrange
        const tasks = SampleTasks_1.SampleTasks.withAllRootsPathsHeadings();
        const grouper = new FilenameField_1.FilenameField().createNormalGrouper();
        // Assert
        expect({ grouper, tasks }).groupHeadingsToBe(['[[_c_]]', '[[a_b_c]]', '[[b]]', '[[c]]', 'Unknown Location']);
    });
});
//# sourceMappingURL=FilenameField.test.js.map