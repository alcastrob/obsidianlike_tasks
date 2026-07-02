"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
window.moment = moment_1.default;
const JestApprovals_1 = require("approvals/lib/Providers/Jest/JestApprovals");
const Sorter_1 = require("../../../src/Query/Sort/Sorter");
const Task_1 = require("../../../src/Task/Task");
const StatusField_1 = require("../../../src/Query/Filter/StatusField");
const DueDateField_1 = require("../../../src/Query/Filter/DueDateField");
const PathField_1 = require("../../../src/Query/Filter/PathField");
const SearchInfo_1 = require("../../../src/Query/SearchInfo");
const Sort_1 = require("../../../src/Query/Sort/Sort");
const StatusRegistry_1 = require("../../../src/Statuses/StatusRegistry");
const StatusConfiguration_1 = require("../../../src/Statuses/StatusConfiguration");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const SortingTestHelpers_1 = require("../../TestingTools/SortingTestHelpers");
const ApprovalTestHelpers_1 = require("../../TestingTools/ApprovalTestHelpers");
const longAgo = '2022-01-01';
const yesterday = '2022-01-14';
const today = '2022-01-15';
const tomorrow = '2022-01-16';
const farFuture = '2022-01-31';
const invalid = '2022-13-33';
beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(today));
});
afterAll(() => {
    jest.useRealTimers();
});
afterEach(() => {
    StatusRegistry_1.StatusRegistry.getInstance().resetToDefaultStatuses();
});
function verifySortedTasks(tasks) {
    const sortedTasks = Sort_1.Sort.by([], tasks, SearchInfo_1.SearchInfo.fromAllTasks(tasks));
    (0, JestApprovals_1.verify)((0, TestHelpers_1.toLines)(sortedTasks).join('\n'));
}
describe('Sort', () => {
    it('constructs Sorting both ways from Comparator function', () => {
        const comparator = (a, b) => {
            if (a.description.length < b.description.length) {
                return 1;
            }
            else if (a.description.length > b.description.length) {
                return -1;
            }
            else {
                return 0;
            }
        };
        const short = new TaskBuilder_1.TaskBuilder().description('short').build();
        const long = new TaskBuilder_1.TaskBuilder().description('longer description').build();
        const searchInfo = SearchInfo_1.SearchInfo.fromAllTasks([short, long]);
        // Normal way round
        {
            const sortByDescriptionLength = new Sorter_1.Sorter('sort by description length', 'junk', comparator, false);
            expect(sortByDescriptionLength.comparator(short, long, searchInfo)).toEqual(1);
            expect(sortByDescriptionLength.comparator(short, short, searchInfo)).toEqual(0);
            expect(sortByDescriptionLength.comparator(long, short, searchInfo)).toEqual(-1);
        }
        // Reversed
        {
            const sortByDescriptionLength = new Sorter_1.Sorter('sort by description length reverse', 'junk', comparator, true);
            expect(sortByDescriptionLength.comparator(short, long, searchInfo)).toEqual(-1);
            expect(sortByDescriptionLength.comparator(short, short, searchInfo)).toEqual(-0);
            expect(sortByDescriptionLength.comparator(long, short, searchInfo)).toEqual(1);
        }
    });
    it('sorts correctly by default order', () => {
        const one = (0, TestHelpers_1.fromLine)({ line: '- [ ] a 📅 1970-01-01', path: '3' });
        const two = (0, TestHelpers_1.fromLine)({ line: '- [ ] c 📅 1970-01-02', path: '3' });
        const three = (0, TestHelpers_1.fromLine)({ line: '- [ ] d 📅 1970-01-03', path: '2' });
        const four = (0, TestHelpers_1.fromLine)({ line: '- [x] d 📅 1970-01-02', path: '2' });
        const five = (0, TestHelpers_1.fromLine)({ line: '- [x] b 📅 1970-01-02', path: '3' });
        const six = (0, TestHelpers_1.fromLine)({ line: '- [x] d 📅 1970-01-03', path: '2' });
        const expectedOrder = [one, two, three, four, five, six];
        expect((0, SortingTestHelpers_1.sortBy)([], [six, five, one, four, two, three])).toEqual(expectedOrder);
    });
    // Just a couple of tests to verify the handling of
    // composite sorts, and reverse sort order.
    it('sorts correctly by due, path, status', () => {
        const one = (0, TestHelpers_1.fromLine)({ line: '- [ ] a 📅 1970-01-01', path: '1' });
        const two = (0, TestHelpers_1.fromLine)({ line: '- [ ] c 📅 1970-01-02', path: '1' });
        const three = (0, TestHelpers_1.fromLine)({ line: '- [ ] d 📅 1970-01-02', path: '2' });
        const four = (0, TestHelpers_1.fromLine)({ line: '- [x] b 📅 1970-01-02', path: '2' });
        const expectedOrder = [
            one, // Sort by due date first.
            two, // Same due as the rest, but lower path.
            three, // Same as b, but not done.
            four, // Done tasks are sorted after open tasks for status.
        ];
        expect((0, SortingTestHelpers_1.sortBy)([
            new DueDateField_1.DueDateField().createNormalSorter(),
            new PathField_1.PathField().createNormalSorter(),
            new StatusField_1.StatusField().createNormalSorter(),
        ], [one, four, two, three])).toEqual(expectedOrder);
    });
    it('sorts correctly by complex sorting incl. reverse', () => {
        const one = (0, TestHelpers_1.fromLine)({ line: '- [x] a 📅 1970-01-03', path: '3' });
        const two = (0, TestHelpers_1.fromLine)({ line: '- [x] c 📅 1970-01-02', path: '2' });
        const three = (0, TestHelpers_1.fromLine)({ line: '- [x] d 📅 1970-01-02', path: '3' });
        const four = (0, TestHelpers_1.fromLine)({ line: '- [ ] d 📅 1970-01-02', path: '2' });
        const five = (0, TestHelpers_1.fromLine)({ line: '- [ ] b 📅 1970-01-02', path: '3' });
        const six = (0, TestHelpers_1.fromLine)({ line: '- [ ] d 📅 1970-01-01', path: '2' });
        const expectedOrder = [one, two, three, four, five, six];
        expect((0, SortingTestHelpers_1.sortBy)([
            new StatusField_1.StatusField().createReverseSorter(),
            new DueDateField_1.DueDateField().createReverseSorter(),
            new PathField_1.PathField().createNormalSorter(),
        ], [six, five, one, four, three, two])).toEqual(expectedOrder);
    });
    it('save default sort order', () => {
        const sorters = Sort_1.Sort.defaultSorters();
        const defaultSortInstructions = sorters.map((sorter) => sorter.instruction).join('\n');
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(defaultSortInstructions, 'text');
    });
    it('visualise default sort order', () => {
        StatusRegistry_1.StatusRegistry.getInstance().add(new StatusConfiguration_1.StatusConfiguration('^', 'Non-task', ' ', false, StatusConfiguration_1.StatusType.NON_TASK));
        const extraTaskLines = `- [x] #task Done        🔺 📅 1970-01-02
- [/] #task In progress 🔺 📅 1970-01-02
- [-] #task Cancelled   🔺 📅 1970-01-02`;
        const extraTasks = (0, TestHelpers_1.fromLines)({ lines: extraTaskLines.split('\n') });
        const tasks = SampleTasks_1.SampleTasks.withAllRepresentativeDueDates()
            .concat(SampleTasks_1.SampleTasks.withAllRepresentativeStartDates())
            .concat(SampleTasks_1.SampleTasks.withAllRepresentativeScheduledDates())
            .concat(SampleTasks_1.SampleTasks.withAllPriorities())
            .concat(SampleTasks_1.SampleTasks.withAllStatusTypes())
            .concat(SampleTasks_1.SampleTasks.withAllRootsPathsHeadings())
            .concat(extraTasks);
        verifySortedTasks(tasks);
    });
    it('visualise date impact on default sort order', () => {
        const dates = [
            ['long ago', longAgo],
            ['yesterday', yesterday],
            ['today', today],
            ['tomorrow', tomorrow],
            ['far future', farFuture],
            ['', null],
            ['invalid', invalid],
        ];
        const tasks = [];
        function pad(date) {
            return date.padEnd(12);
        }
        function addDateIfSet(emoji, date) {
            let dateIfSet = '';
            if (date) {
                dateIfSet = ` ${emoji} ${date}`;
            }
            return dateIfSet;
        }
        for (const start of dates) {
            for (const scheduled of dates) {
                for (const due of dates) {
                    const description = `Start: ${pad(start[0])} Scheduled: ${pad(scheduled[0])} Due: ${pad(due[0])}`;
                    let line = `- [ ] ${description}`;
                    line += addDateIfSet('🛫', start[1]);
                    line += addDateIfSet('⏳', scheduled[1]);
                    line += addDateIfSet('📅', due[1]);
                    const task = (0, TestHelpers_1.fromLine)({ line });
                    const description2 = `${description} urgency = ${task.urgency.toFixed(5)}`;
                    const task2 = new Task_1.Task({ ...task, description: description2 });
                    tasks.push(task2);
                }
            }
        }
        verifySortedTasks(tasks);
    });
});
//# sourceMappingURL=Sort.test.js.map