"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const FilenameField_1 = require("../../../src/Query/Filter/FilenameField");
const Grouper_1 = require("../../../src/Query/Group/Grouper");
const PathField_1 = require("../../../src/Query/Filter/PathField");
const TagsField_1 = require("../../../src/Query/Filter/TagsField");
const FolderField_1 = require("../../../src/Query/Filter/FolderField");
const TaskGroups_1 = require("../../../src/Query/Group/TaskGroups");
const StatusTypeField_1 = require("../../../src/Query/Filter/StatusTypeField");
const HappensDateField_1 = require("../../../src/Query/Filter/HappensDateField");
const DueDateField_1 = require("../../../src/Query/Filter/DueDateField");
const SearchInfo_1 = require("../../../src/Query/SearchInfo");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const FunctionField_1 = require("../../../src/Query/Filter/FunctionField");
const TasksFileHelpers_1 = require("../../TestingTools/TasksFileHelpers");
window.moment = moment_1.default;
function makeTasksGroups(grouping, inputs) {
    return new TaskGroups_1.TaskGroups(grouping, inputs, SearchInfo_1.SearchInfo.fromAllTasks(inputs));
}
beforeEach(() => { });
afterEach(() => {
    jest.useRealTimers();
});
describe('Grouping tasks', () => {
    it('groups correctly by path', () => {
        // Arrange
        const a = (0, TestHelpers_1.fromLine)({ line: '- [ ] a', path: 'file2.md' });
        const b = (0, TestHelpers_1.fromLine)({ line: '- [ ] b', path: 'file1.md' });
        const c = (0, TestHelpers_1.fromLine)({ line: '- [ ] c', path: 'file1.md' });
        const inputs = [a, b, c];
        // Act
        const grouping = [new PathField_1.PathField().createNormalGrouper()];
        const groups = makeTasksGroups(grouping, inputs);
        // Assert
        expect(groups.groupers).toStrictEqual(grouping);
        expect(groups.toString()).toMatchInlineSnapshot(`
            "
            #### file1

            - [ ] b
            - [ ] c

            #### file2

            - [ ] a
            "
        `);
    });
    it('groups correctly by default grouping', () => {
        // Arrange
        const a = (0, TestHelpers_1.fromLine)({ line: '- [ ] a 📅 1970-01-01', path: '2.md' });
        const b = (0, TestHelpers_1.fromLine)({ line: '- [ ] b 📅 1970-01-02', path: '3.md' });
        const c = (0, TestHelpers_1.fromLine)({ line: '- [ ] c 📅 1970-01-02', path: '3.md' });
        const inputs = [a, b, c];
        // Act
        const grouping = [];
        const groups = makeTasksGroups(grouping, inputs);
        // Assert
        // No grouping specified, so no headings generated
        expect(groups.toString()).toMatchInlineSnapshot(`
            "
            - [ ] a 📅 1970-01-01
            - [ ] b 📅 1970-01-02
            - [ ] c 📅 1970-01-02
            "
        `);
    });
    it('groups empty task list correctly', () => {
        // Arrange
        const inputs = [];
        const grouping = [new PathField_1.PathField().createNormalGrouper()];
        // Act
        const groups = makeTasksGroups(grouping, inputs);
        // Assert
        expect(groups.groups.length).toEqual(1);
        expect(groups.groups[0].groups.length).toEqual(0);
        expect(groups.groups[0].tasks.length).toEqual(0);
    });
    it('should provide access to SearchInfo', () => {
        // Arrange
        const groupByQueryPath = (_task, searchInfo) => {
            return [searchInfo.tasksFile ? searchInfo.tasksFile.path : 'No SearchInfo'];
        };
        const grouper = new Grouper_1.Grouper('group by test', 'test', groupByQueryPath, false);
        const tasksFile = (0, TasksFileHelpers_1.createTestTasksFile)('somewhere/anything.md');
        const tasks = [new TaskBuilder_1.TaskBuilder().build()];
        const searchInfo = new SearchInfo_1.SearchInfo(tasksFile, tasks);
        // Act
        const groups = new TaskGroups_1.TaskGroups([grouper], tasks, searchInfo);
        // Assert
        expect(groups.groups.length).toEqual(1);
        expect(groups.groups[0].groups).toEqual([tasksFile.path]);
    });
    it('sorts group names correctly', () => {
        const a = (0, TestHelpers_1.fromLine)({
            line: '- [ ] third file path',
            path: 'd/e/f.md',
        });
        const b = (0, TestHelpers_1.fromLine)({
            line: '- [ ] second file path',
            path: 'b/c/d.md',
        });
        const c = (0, TestHelpers_1.fromLine)({
            line: '- [ ] first file path, alphabetically',
            path: 'a/b/c.md',
        });
        const inputs = [a, b, c];
        const grouping = [new PathField_1.PathField().createNormalGrouper()];
        const groups = makeTasksGroups(grouping, inputs);
        expect(groups.toString()).toMatchInlineSnapshot(`
            "
            #### a/b/c

            - [ ] first file path, alphabetically

            #### b/c/d

            - [ ] second file path

            #### d/e/f

            - [ ] third file path
            "
        `);
    });
    it('sorts group names beginning with numeric values correctly', () => {
        const a = (0, TestHelpers_1.fromLine)({
            line: '- [ ] first, as 9 is less then 10',
            path: '9 something.md',
        });
        const b = (0, TestHelpers_1.fromLine)({
            line: '- [ ] second, as 10 is more than 9',
            path: '10 something.md',
        });
        const inputs = [a, b];
        const grouping = [new FilenameField_1.FilenameField().createNormalGrouper()];
        const groups = makeTasksGroups(grouping, inputs);
        expect(groups.toString()).toMatchInlineSnapshot(`
            "
            #### [[9 something]]

            - [ ] first, as 9 is less then 10

            #### [[10 something]]

            - [ ] second, as 10 is more than 9
            "
        `);
    });
    it('sorts due date group headings in reverse', () => {
        // Arrange
        const a = (0, TestHelpers_1.fromLine)({ line: '- [ ] a 📅 2023-04-05', path: '2.md' });
        const b = (0, TestHelpers_1.fromLine)({ line: '- [ ] b 📅 2023-07-08', path: '3.md' });
        const inputs = [a, b];
        // Act
        const grouping = [new DueDateField_1.DueDateField().createGrouperFromLine('group by due reverse')];
        const groups = makeTasksGroups(grouping, inputs);
        // Assert
        // No grouping specified, so no headings generated
        expect(groups.toString()).toMatchInlineSnapshot(`
            "
            #### 2023-07-08 Saturday

            - [ ] b 📅 2023-07-08

            #### 2023-04-05 Wednesday

            - [ ] a 📅 2023-04-05
            "
        `);
    });
    it('sorts raw urgency value groups correctly', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2025-03-07'));
        const lines = [
            '- [ ] 0 📅 2025-02-28 🔺           ', // urgency: 21
            '- [ ] 1 📅 2025-03-07 ⏳ 2025-03-07', // urgency: 15.75
            '- [ ] 2 📅 2025-03-08 ⏳ 2025-03-07', // urgency: 15.292857142857141
            '- [ ] 3 📅 2025-03-09 ⏳ 2025-03-07', // urgency: 14.835714285714285
            '- [ ] 4 ⏫  🛫 2025-03-18          ', // urgency: 3
            '- [ ] 5 🔽                         ', // urgency: 0
        ];
        const tasks = (0, TestHelpers_1.fromLines)({ lines });
        // See issue https://github.com/obsidian-tasks-group/obsidian-tasks/issues/3371
        //      order of groups, when grouping by "function task.urgency" without specifying precision, is confusing
        // There is a problem with the sorting of groups whose floating-point values differ in precision,
        // when grouping by the raw urgency value
        const grouping = [new FunctionField_1.FunctionField().createGrouperFromLine('group by function task.urgency')];
        const groups = makeTasksGroups(grouping, tasks);
        const groupHeadings = groups.groups.map((group) => group.groups[0]);
        expect(groupHeadings).toEqual(['0', '3', '14.83571', '15.29286', '15.75000', '21']);
    });
    it('handles tasks matching multiple groups correctly', () => {
        const a = (0, TestHelpers_1.fromLine)({
            line: '- [ ] Task 1 #group1',
        });
        const b = (0, TestHelpers_1.fromLine)({
            line: '- [ ] Task 2 #group2 #group1',
        });
        const c = (0, TestHelpers_1.fromLine)({
            line: '- [ ] Task 3 #group2',
        });
        const inputs = [a, b, c];
        const grouping = [new TagsField_1.TagsField().createNormalGrouper()];
        const groups = makeTasksGroups(grouping, inputs);
        expect(groups.toString()).toMatchInlineSnapshot(`
            "
            #### #group1

            - [ ] Task 1 #group1
            - [ ] Task 2 #group2 #group1

            #### #group2

            - [ ] Task 2 #group2 #group1
            - [ ] Task 3 #group2
            "
        `);
    });
    it('should retain tasks with no group name', () => {
        const a = (0, TestHelpers_1.fromLine)({
            line: '- [ ] Task with a tag #group1',
        });
        const b = (0, TestHelpers_1.fromLine)({
            line: '- [ ] Task without a tag',
        });
        const inputs = [a, b];
        const groupByTags = (task) => task.tags;
        const grouper = new Grouper_1.Grouper('group by custom tag grouper', 'custom tag grouper', groupByTags, false);
        const groups = makeTasksGroups([grouper], inputs);
        expect(groups.totalTasksCount()).toEqual(2);
        // Force a recalculation of the task count, to ensure no
        // tasks were lost in the grouping:
        groups.recalculateTotalTaskCount();
        expect(groups.totalTasksCount()).toEqual(2);
        expect(groups.toString()).toMatchInlineSnapshot(`
            "
            - [ ] Task without a tag

            #### #group1

            - [ ] Task with a tag #group1
            "
        `);
    });
    it('should create nested headings if multiple groups used even if one is reversed', () => {
        // Arrange
        const t1 = (0, TestHelpers_1.fromLine)({
            line: '- [ ] Task 1 - but path is 2nd, alphabetically',
            path: 'folder_b/folder_c/file_c.md',
        });
        const t2 = (0, TestHelpers_1.fromLine)({
            line: '- [ ] Task 2 - but path is 2nd, alphabetically',
            path: 'folder_b/folder_c/file_d.md',
        });
        const t3 = (0, TestHelpers_1.fromLine)({
            line: '- [ ] Task 3 - but path is 1st, alphabetically',
            path: 'folder_a/folder_b/file_c.md',
        });
        const tasks = [t1, t2, t3];
        const grouping = [
            new FolderField_1.FolderField().createReverseGrouper(),
            new FilenameField_1.FilenameField().createNormalGrouper(),
        ];
        // Act
        const groups = makeTasksGroups(grouping, tasks);
        // Assert
        expect(groups.toString()).toMatchInlineSnapshot(`
            "
            #### folder\\_b/folder\\_c/

            ##### [[file_c]]

            - [ ] Task 1 - but path is 2nd, alphabetically

            ##### [[file_d]]

            - [ ] Task 2 - but path is 2nd, alphabetically

            #### folder\\_a/folder\\_b/

            ##### [[file_c]]

            - [ ] Task 3 - but path is 1st, alphabetically
            "
        `);
    });
    it('should create nested headings if multiple groups used - case 2', () => {
        const b = (0, TestHelpers_1.fromLine)({
            line: '- [ ] Task a - early date 📅 2022-09-19',
        });
        const a = (0, TestHelpers_1.fromLine)({
            line: '- [ ] Task b - later date ⏳ 2022-12-06',
        });
        const c = (0, TestHelpers_1.fromLine)({
            line: '- [ ] Task c - intermediate date ⏳ 2022-10-06',
        });
        const inputs = [a, b, c];
        const grouping = [
            new StatusTypeField_1.StatusTypeField().createNormalGrouper(), // Two group levels
            new HappensDateField_1.HappensDateField().createNormalGrouper(),
        ];
        const groups = makeTasksGroups(grouping, inputs);
        // This result is incorrect. The '2 TODO' heading is shown before
        // the last group instead of before the first one.
        expect(groups.toString()).toMatchInlineSnapshot(`
            "
            #### %%2%%TODO

            ##### 2022-09-19 Monday

            - [ ] Task a - early date 📅 2022-09-19

            ##### 2022-10-06 Thursday

            - [ ] Task c - intermediate date ⏳ 2022-10-06

            ##### 2022-12-06 Tuesday

            - [ ] Task b - later date ⏳ 2022-12-06
            "
        `);
    });
    it('should limit tasks in each group (no task overlapping across group)', () => {
        // Arrange
        const a = (0, TestHelpers_1.fromLine)({ line: '- [ ] a', path: 'tasks_under_the_limit.md' });
        const b = (0, TestHelpers_1.fromLine)({ line: '- [ ] b', path: 'tasks_equal_to_limit.md' });
        const c = (0, TestHelpers_1.fromLine)({ line: '- [ ] c', path: 'tasks_equal_to_limit.md' });
        const d = (0, TestHelpers_1.fromLine)({ line: '- [ ] d', path: 'tasks_over_the_limit.md' });
        const e = (0, TestHelpers_1.fromLine)({ line: '- [ ] e', path: 'tasks_over_the_limit.md' });
        const f = (0, TestHelpers_1.fromLine)({ line: '- [ ] f', path: 'tasks_over_the_limit.md' });
        const inputs = [a, b, c, d, e, f];
        // Act
        const grouping = [new PathField_1.PathField().createNormalGrouper()];
        const groups = makeTasksGroups(grouping, inputs);
        groups.applyTaskLimit(2);
        // Assert
        expect(groups.totalTasksCount()).toEqual(5);
        expect(groups.toString()).toMatchInlineSnapshot(`
            "
            #### tasks\\_equal\\_to\\_limit

            - [ ] b
            - [ ] c

            #### tasks\\_over\\_the\\_limit

            - [ ] d
            - [ ] e

            #### tasks\\_under\\_the\\_limit

            - [ ] a
            "
        `);
    });
    it('should limit tasks with tasks that overlap across multiple groups and correctly calculate unique tasks', () => {
        // Arrange
        const taskA = (0, TestHelpers_1.fromLine)({ line: '- [ ] task A #tag1 #tag2' });
        const taskB = (0, TestHelpers_1.fromLine)({ line: '- [ ] task B #tag1 #tag3' });
        const taskC = (0, TestHelpers_1.fromLine)({ line: '- [ ] task C #tag3 #tag2' });
        const taskD = (0, TestHelpers_1.fromLine)({ line: '- [ ] task D #tag1 #tag2' });
        const inputs = [taskA, taskB, taskC, taskD];
        // Act
        const grouping = [new TagsField_1.TagsField().createNormalGrouper()];
        const groups = makeTasksGroups(grouping, inputs);
        groups.applyTaskLimit(1);
        // Assert
        expect(groups.totalTasksCount()).toEqual(2);
        expect(groups.toString()).toMatchInlineSnapshot(`
            "
            #### #tag1

            - [ ] task A #tag1 #tag2

            #### #tag2

            - [ ] task A #tag1 #tag2

            #### #tag3

            - [ ] task B #tag1 #tag3
            "
        `);
    });
    it('should not limit tasks if no groups were specified', () => {
        // Arrange
        const taskA = (0, TestHelpers_1.fromLine)({ line: '- [ ] task A' });
        const taskB = (0, TestHelpers_1.fromLine)({ line: '- [ ] task B' });
        const taskC = (0, TestHelpers_1.fromLine)({ line: '- [ ] task C' });
        const taskD = (0, TestHelpers_1.fromLine)({ line: '- [ ] task D' });
        const inputs = [taskA, taskB, taskC, taskD];
        // Act
        const grouping = [];
        const groups = makeTasksGroups(grouping, inputs);
        groups.applyTaskLimit(1);
        // Assert
        expect(groups.totalTasksCount()).toEqual(4);
        expect(groups.toString()).toMatchInlineSnapshot(`
            "
            - [ ] task A
            - [ ] task B
            - [ ] task C
            - [ ] task D
            "
        `);
    });
});
//# sourceMappingURL=TaskGroups.test.js.map