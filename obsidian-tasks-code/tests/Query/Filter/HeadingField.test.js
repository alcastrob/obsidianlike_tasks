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
const HeadingField_1 = require("../../../src/Query/Filter/HeadingField");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const FilterTestHelpers_1 = require("../../TestingTools/FilterTestHelpers");
const CustomMatchersForSorting = __importStar(require("../../CustomMatchers/CustomMatchersForSorting"));
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
function testTaskFilterForHeading(filter, precedingHeader, expected) {
    const builder = new TaskBuilder_1.TaskBuilder();
    (0, FilterTestHelpers_1.testFilter)(filter, builder.precedingHeader(precedingHeader), expected);
}
describe('heading', () => {
    it('by heading (includes)', () => {
        // Arrange
        const filter = new HeadingField_1.HeadingField().createFilterOrErrorMessage('heading includes Interesting Heading');
        // Act, Assert
        testTaskFilterForHeading(filter, null, false);
        testTaskFilterForHeading(filter, 'An InteResting HeaDing', true);
        testTaskFilterForHeading(filter, 'Other Heading', false);
    });
    it('by heading (does not include)', () => {
        // Arrange
        const filter = new HeadingField_1.HeadingField().createFilterOrErrorMessage('heading does not include Interesting Heading');
        // Act, Assert
        testTaskFilterForHeading(filter, null, true);
        testTaskFilterForHeading(filter, 'SoMe InteResting HeaDing', false);
        testTaskFilterForHeading(filter, 'Other Heading', true);
    });
    it('by heading (regex matches - case sensitive)', () => {
        // Arrange
        const filter = new HeadingField_1.HeadingField().createFilterOrErrorMessage(String.raw `heading regex matches /[Ii]nteresting Head.ng/`);
        // Act, Assert
        expect(filter).toBeValid();
        expect(filter).toMatchTaskWithHeading('Interesting Heading');
        expect(filter).not.toMatchTaskWithHeading(null);
        expect(filter).not.toMatchTaskWithHeading('SoMe InteResting HeaDing');
    });
    it('by heading (regex does not match - case in-sensitive)', () => {
        // Arrange
        const filter = new HeadingField_1.HeadingField().createFilterOrErrorMessage(String.raw `heading regex does not match /[Ii]nteresting Head.ng/i`);
        // Act, Assert
        expect(filter).toBeValid();
        expect(filter).toMatchTaskWithHeading(null);
        expect(filter).not.toMatchTaskWithHeading('Interesting Heading');
        expect(filter).not.toMatchTaskWithHeading('SoMe InteResting HeaDing');
    });
});
describe('sorting by heading', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new HeadingField_1.HeadingField();
        expect(field.supportsSorting()).toEqual(true);
    });
    // Helper function to create a task with a given path
    function with_heading(heading) {
        return new TaskBuilder_1.TaskBuilder().precedingHeader(heading).build();
    }
    it('sort by heading', () => {
        // Arrange
        const sorter = new HeadingField_1.HeadingField().createNormalSorter();
        // Assert
        CustomMatchersForSorting.expectTaskComparesBefore(sorter, with_heading('Heading 1'), with_heading('Heading 2'));
        CustomMatchersForSorting.expectTaskComparesBefore(sorter, with_heading(''), with_heading('Non-empty heading')); // Empty heading comes first
        // Beginning with numbers
        CustomMatchersForSorting.expectTaskComparesBefore(sorter, with_heading('1 Stuff'), with_heading('2 Stuff'));
        CustomMatchersForSorting.expectTaskComparesBefore(sorter, with_heading('9 Stuff'), with_heading('11 Stuff'));
    });
    it('sort by heading reverse', () => {
        // Single example just to prove reverse works.
        // (There's no need to repeat all the examples above)
        const sorter = new HeadingField_1.HeadingField().createReverseSorter();
        CustomMatchersForSorting.expectTaskComparesAfter(sorter, with_heading('Heading 1'), with_heading('Heading 2'));
    });
});
describe('grouping by heading', () => {
    it('supports grouping methods correctly', () => {
        expect(new HeadingField_1.HeadingField()).toSupportGroupingWithProperty('heading');
    });
    it.each([
        ['- [ ] xxx', null, ['(No heading)']],
        ['- [ ] xxx', '', ['(No heading)']],
        ['- [ ] xxx', 'heading', ['heading']],
        // underscores in headings are NOT escaped - will be rendered
        ['- [ ] xxx', 'heading _italic text_', ['heading _italic text_']],
    ])('task "%s" with header "%s" should have groups: %s', (taskLine, header, groups) => {
        // Arrange
        const grouper = new HeadingField_1.HeadingField().createNormalGrouper();
        // Assert
        const tasks = [(0, TestHelpers_1.fromLine)({ line: taskLine, precedingHeader: header })];
        expect({ grouper, tasks }).groupHeadingsToBe(groups);
    });
    it('should sort groups for HeadingField', () => {
        // Arrange
        const tasks = SampleTasks_1.SampleTasks.withAllRootsPathsHeadings();
        const grouper = new HeadingField_1.HeadingField().createNormalGrouper();
        // Assert
        expect({ grouper, tasks }).groupHeadingsToBe([
            '(No heading)',
            'a_b_c',
            'c',
            'heading',
            'heading _italic text_',
        ]);
    });
});
//# sourceMappingURL=HeadingField.test.js.map