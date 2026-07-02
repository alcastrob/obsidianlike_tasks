"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const FilterTestHelpers_1 = require("../../TestingTools/FilterTestHelpers");
const PriorityField_1 = require("../../../src/Query/Filter/PriorityField");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const Priority_1 = require("../../../src/Task/Priority");
function testTaskFilterForTaskWithPriority(filter, priority, expected) {
    const builder = new TaskBuilder_1.TaskBuilder();
    const filterOrError = new PriorityField_1.PriorityField().createFilterOrErrorMessage(filter);
    (0, FilterTestHelpers_1.testFilter)(filterOrError, builder.priority(priority), expected);
}
describe('priority is', () => {
    it('priority is highest', () => {
        const filter = 'priority is highest';
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Highest, true);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.High, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Medium, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.None, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Low, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Lowest, false);
    });
    it('priority is high', () => {
        const filter = 'priority is high';
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Highest, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.High, true);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Medium, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.None, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Low, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Lowest, false);
    });
    it('priority is medium', () => {
        const filter = 'priority is medium';
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Highest, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.High, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Medium, true);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.None, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Low, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Lowest, false);
    });
    it('priority is none', () => {
        const filter = 'priority is none';
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Highest, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.High, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Medium, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.None, true);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Low, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Lowest, false);
    });
    it('priority is low', () => {
        const filter = 'priority is low';
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Highest, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.High, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Medium, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.None, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Low, true);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Lowest, false);
    });
    it('priority is lowest', () => {
        const filter = 'priority is lowest';
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Highest, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.High, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Medium, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.None, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Low, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Lowest, true);
    });
});
describe('priority above', () => {
    it('priority above none', () => {
        const filter = 'priority above none';
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Lowest, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Low, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.None, false);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Medium, true);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.High, true);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Highest, true);
    });
});
describe('priority below', () => {
    it('priority below none', () => {
        const filter = 'priority below none';
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Lowest, true);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.Low, true);
        testTaskFilterForTaskWithPriority(filter, Priority_1.Priority.None, false);
    });
});
describe('priority is not', () => {
    it.each([
        ['lowest', Priority_1.Priority.Lowest, false],
        ['lowest', Priority_1.Priority.Low, true],
        ['low', Priority_1.Priority.Low, false],
        ['low', Priority_1.Priority.None, true],
        ['none', Priority_1.Priority.None, false],
        ['none', Priority_1.Priority.Medium, true],
        ['medium', Priority_1.Priority.None, true],
        ['medium', Priority_1.Priority.Medium, false],
        ['high', Priority_1.Priority.Medium, true],
        ['high', Priority_1.Priority.High, false],
        ['highest', Priority_1.Priority.Highest, false],
        ['highest', Priority_1.Priority.High, true],
    ])('priority is not %s (with %s)', (filter, input, expected) => {
        // TODO Use name of input priority instead of
        testTaskFilterForTaskWithPriority(`priority is not ${filter}`, input, expected);
    });
});
describe('priority parses various whitespace combinations', () => {
    // Not tested here: Query strips off trailing whitespace, so spaces at start
    // and end of the instruction do not need testing
    it.each(['priority  is low', 'priority is  low', 'priority is  above low', 'priority\tis\tabove\tlow'])('white space variation: "%s"', (filter) => {
        const filterOrError = new PriorityField_1.PriorityField().createFilterOrErrorMessage(filter);
        expect(filterOrError).toBeValid();
    });
});
describe('priority error cases', () => {
    it.each([
        'priority is no-such-priority',
        'priority is abovemedium',
        'priority is above medium-with-nonsense-at-end',
    ])('filter: "%s"', (input) => {
        const field = new PriorityField_1.PriorityField();
        const filter = field.createFilterOrErrorMessage(input);
        expect(filter.filterFunction).toBeUndefined();
        expect(filter.error).toBe('do not understand query filter (priority)');
    });
});
describe('explain priority', () => {
    it('simple case just repeats the supplied line', () => {
        const field = new PriorityField_1.PriorityField();
        const instruction = 'priority above NONE';
        const filterOrMessage = field.createFilterOrErrorMessage(instruction);
        expect(filterOrMessage).toHaveExplanation(instruction);
    });
    it('implicit "is" gets added to description', () => {
        const field = new PriorityField_1.PriorityField();
        const filterOrMessage = field.createFilterOrErrorMessage('priority high');
        expect(filterOrMessage).toHaveExplanation('priority is high');
    });
});
describe('sorting by priority', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new PriorityField_1.PriorityField();
        expect(field.supportsSorting()).toEqual(true);
    });
    // Helper function to create a task with a given priority
    function with_priority(priority) {
        return new TaskBuilder_1.TaskBuilder().priority(priority).build();
    }
    it('sort by priority', () => {
        // Arrange
        const sorter = new PriorityField_1.PriorityField().createNormalSorter();
        // Assert
        // This tests each adjacent pair of priority values, in descending order,
        // to prove that sorting of all combinations will be correct.
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_priority(Priority_1.Priority.Highest), with_priority(Priority_1.Priority.High));
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_priority(Priority_1.Priority.High), with_priority(Priority_1.Priority.Medium));
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_priority(Priority_1.Priority.Medium), with_priority(Priority_1.Priority.None));
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_priority(Priority_1.Priority.None), with_priority(Priority_1.Priority.Low));
        (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorter, with_priority(Priority_1.Priority.Low), with_priority(Priority_1.Priority.Lowest));
        (0, CustomMatchersForSorting_1.expectTaskComparesEqual)(sorter, with_priority(Priority_1.Priority.None), with_priority(Priority_1.Priority.None));
    });
    it('sort by priority reverse', () => {
        // Single example just to prove reverse works.
        // (There's no need to repeat all the examples above)
        const sorter = new PriorityField_1.PriorityField().createReverseSorter();
        (0, CustomMatchersForSorting_1.expectTaskComparesAfter)(sorter, with_priority(Priority_1.Priority.High), with_priority(Priority_1.Priority.Medium));
    });
});
describe('grouping by priority', () => {
    it('supports grouping methods correctly', () => {
        expect(new PriorityField_1.PriorityField()).toSupportGroupingWithProperty('priority');
    });
    it.each([
        ['- [ ] a 🔺', ['%%0%%Highest priority']],
        ['- [ ] a ⏫', ['%%1%%High priority']],
        ['- [ ] a 🔼', ['%%2%%Medium priority']],
        ['- [ ] a', ['%%3%%Normal priority']],
        ['- [ ] a 🔽', ['%%4%%Low priority']],
        ['- [ ] a ⏬', ['%%5%%Lowest priority']],
    ])('task "%s" should have groups: %s', (taskLine, groups) => {
        // Arrange
        const grouper = new PriorityField_1.PriorityField().createNormalGrouper();
        // Assert
        const tasks = [(0, TestHelpers_1.fromLine)({ line: taskLine })];
        expect({ grouper, tasks }).groupHeadingsToBe(groups);
    });
    it('should sort groups for PriorityField', () => {
        const grouper = new PriorityField_1.PriorityField().createNormalGrouper();
        const tasks = SampleTasks_1.SampleTasks.withAllPriorities();
        expect({ grouper, tasks }).groupHeadingsToBe([
            '%%0%%Highest priority',
            '%%1%%High priority',
            '%%2%%Medium priority',
            '%%3%%Normal priority',
            '%%4%%Low priority',
            '%%5%%Lowest priority',
        ]);
    });
});
//# sourceMappingURL=PriorityField.test.js.map