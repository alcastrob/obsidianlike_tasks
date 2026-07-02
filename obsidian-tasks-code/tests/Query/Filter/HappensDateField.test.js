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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const HappensDateField_1 = require("../../../src/Query/Filter/HappensDateField");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
const FilterTestHelpers_1 = require("../../TestingTools/FilterTestHelpers");
const CustomMatchersForSorting = __importStar(require("../../CustomMatchers/CustomMatchersForSorting"));
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const SampleTasks_1 = require("../../TestingTools/SampleTasks");
window.moment = moment_1.default;
describe('happens date', () => {
    it('by happens date presence', () => {
        // Arrange
        const filter = new HappensDateField_1.HappensDateField().createFilterOrErrorMessage('has happens date');
        // Act, Assert
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().dueDate(null), false);
        // scheduled, start and due all contribute to happens:
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().scheduledDate('2022-04-15'), true);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().startDate('2022-04-15'), true);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().dueDate('2022-04-15'), true);
        // Done date is ignored by happens
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().doneDate('2022-04-15'), false);
    });
    it('by happens date absence', () => {
        // Arrange
        const filter = new HappensDateField_1.HappensDateField().createFilterOrErrorMessage('no happens date');
        // Act, Assert
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().dueDate(null), true);
        // scheduled, start and due all contribute to happens:
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().scheduledDate('2022-04-15'), false);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().startDate('2022-04-15'), false);
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().dueDate('2022-04-15'), false);
        // Done date is ignored by happens
        (0, FilterTestHelpers_1.testFilter)(filter, new TaskBuilder_1.TaskBuilder().doneDate('2022-04-15'), true);
    });
});
describe('accessing earliest happens date', () => {
    it('should return null if no dates set', () => {
        expect(new HappensDateField_1.HappensDateField().earliestDate(new TaskBuilder_1.TaskBuilder().build())).toBeNull();
    });
    function checkEarliestHappensDate(taskBuilder, expectedEarliestHappensDate) {
        const earliest = new HappensDateField_1.HappensDateField().earliestDate(taskBuilder.build());
        expect({
            earliest: earliest?.format('YYYY-MM-DD'),
        }).toMatchObject({
            earliest: expectedEarliestHappensDate,
        });
    }
    it('should return due if only date set', () => {
        checkEarliestHappensDate(new TaskBuilder_1.TaskBuilder().dueDate('1989-12-17'), '1989-12-17');
    });
    it('should return start if only date set', () => {
        checkEarliestHappensDate(new TaskBuilder_1.TaskBuilder().startDate('1989-12-17'), '1989-12-17');
    });
    it('should return scheduled if only date set', () => {
        checkEarliestHappensDate(new TaskBuilder_1.TaskBuilder().scheduledDate('1989-12-17'), '1989-12-17');
    });
    it('should return earliest if all dates set', () => {
        checkEarliestHappensDate(new TaskBuilder_1.TaskBuilder().dueDate('1989-12-17').startDate('1999-12-17').scheduledDate('2009-12-17'), '1989-12-17');
    });
    it('should give undated if all 3 dates are invalid', () => {
        const task = new TaskBuilder_1.TaskBuilder()
            .dueDate('1989-02-31')
            .startDate('1999-02-31')
            .scheduledDate('2009-02-31')
            .build();
        const earliest = new HappensDateField_1.HappensDateField().earliestDate(task);
        expect(earliest).toBeNull();
    });
});
describe('explain happens date queries', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2022-01-15'));
    });
    afterAll(() => {
        jest.useRealTimers();
    });
    it('should explain date before', () => {
        const filterOrMessage = new HappensDateField_1.HappensDateField().createFilterOrErrorMessage('happens before 2023-01-02');
        expect(filterOrMessage).toHaveExplanation('due, start or scheduled date is before 2023-01-02 (Monday 2nd January 2023)');
    });
    it('should explain date with explicit on', () => {
        const filterOrMessage = new HappensDateField_1.HappensDateField().createFilterOrErrorMessage('happens on 2024-01-02');
        expect(filterOrMessage).toHaveExplanation('due, start or scheduled date is on 2024-01-02 (Tuesday 2nd January 2024)');
    });
    it('should explain date with implicit on', () => {
        const filterOrMessage = new HappensDateField_1.HappensDateField().createFilterOrErrorMessage('happens 2024-01-02');
        expect(filterOrMessage).toHaveExplanation('due, start or scheduled date is on 2024-01-02 (Tuesday 2nd January 2024)');
    });
    it('should show value of relative dates', () => {
        const filterOrMessage = new HappensDateField_1.HappensDateField().createFilterOrErrorMessage('happens after today');
        expect(filterOrMessage).toHaveExplanation('due, start or scheduled date is after 2022-01-15 (Saturday 15th January 2022)');
    });
});
describe('sorting by happens', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new HappensDateField_1.HappensDateField();
        expect(field.supportsSorting()).toEqual(true);
    });
    const date1 = new TaskBuilder_1.TaskBuilder().startDate('2021-01-12').build();
    const date2 = new TaskBuilder_1.TaskBuilder().scheduledDate('2022-12-23').build();
    it('sort by happens', () => {
        CustomMatchersForSorting.expectTaskComparesBefore(new HappensDateField_1.HappensDateField().createNormalSorter(), date1, date2);
    });
    it('sort by happens reverse', () => {
        CustomMatchersForSorting.expectTaskComparesAfter(new HappensDateField_1.HappensDateField().createReverseSorter(), date1, date2);
    });
});
describe('grouping by happens date', () => {
    it('supports Field grouping methods correctly', () => {
        expect(new HappensDateField_1.HappensDateField()).toSupportGroupingWithProperty('happens');
    });
    it.each([
        ['- [ ] a', ['No happens date']],
        ['- [ ] due is only date 📅 1970-01-01', ['1970-01-01 Thursday']],
        ['- [ ] scheduled is only date ⏳ 1970-01-02', ['1970-01-02 Friday']],
        ['- [ ] start is only date 🛫 1970-01-03', ['1970-01-03 Saturday']],
        ['- [ ] due is earliest date 🛫 1970-01-03 ⏳ 1970-01-02 📅 1970-01-01', ['1970-01-01 Thursday']],
        ['- [ ] scheduled is earliest date 🛫 1970-01-03 ⏳ 1970-01-01 📅 1970-01-02', ['1970-01-01 Thursday']],
        ['- [ ] start is earliest date 🛫 1970-01-01 ⏳ 1970-01-02 📅 1970-01-03', ['1970-01-01 Thursday']],
    ])('group by happens date: task "%s" should have groups %s', (taskLine, expectedResult) => {
        // Arrange
        const grouper = new HappensDateField_1.HappensDateField().createNormalGrouper();
        // Assert
        const tasks = [(0, TestHelpers_1.fromLine)({ line: taskLine })];
        expect({ grouper, tasks }).groupHeadingsToBe(expectedResult);
    });
    it('should sort groups for HappensDateField', () => {
        const grouper = new HappensDateField_1.HappensDateField().createNormalGrouper();
        const tasks = [
            ...SampleTasks_1.SampleTasks.withAllRepresentativeDueDates(),
            ...SampleTasks_1.SampleTasks.withAllRepresentativeScheduledDates(),
            ...SampleTasks_1.SampleTasks.withAllRepresentativeStartDates(),
        ];
        // There is no heading '%%0%% Invalid happens date', because happens date ignores invalid dates.
        // Tasks with only invalid dates in the candidate 'happens' dates are treated as undated.
        expect({ grouper, tasks }).groupHeadingsToBe([
            '2023-05-30 Tuesday',
            '2023-05-31 Wednesday',
            '2023-06-01 Thursday',
            '2023-06-02 Friday',
            'No happens date',
        ]);
    });
});
//# sourceMappingURL=HappensDateField.test.js.map