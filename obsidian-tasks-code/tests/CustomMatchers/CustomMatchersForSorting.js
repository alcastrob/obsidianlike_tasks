"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectDateComparesBefore = expectDateComparesBefore;
exports.expectDateComparesEqual = expectDateComparesEqual;
exports.expectDateComparesAfter = expectDateComparesAfter;
exports.expectTaskComparesBefore = expectTaskComparesBefore;
exports.expectTaskComparesEqual = expectTaskComparesEqual;
exports.expectTaskComparesAfter = expectTaskComparesAfter;
const DateParser_1 = require("../../src/DateTime/DateParser");
const DateTools_1 = require("../../src/DateTime/DateTools");
const SearchInfo_1 = require("../../src/Query/SearchInfo");
const TasksFileHelpers_1 = require("../TestingTools/TasksFileHelpers");
expect.extend({
    toGiveCompareToResult(dates, expected) {
        expect(dates.length).toEqual(2);
        const dateA = dates[0];
        const dateB = dates[1];
        let a = null;
        if (dateA !== null)
            a = DateParser_1.DateParser.parseDate(dateA);
        let b = null;
        if (dateB !== null)
            b = DateParser_1.DateParser.parseDate(dateB);
        const actual = (0, DateTools_1.compareByDate)(a, b);
        const pass = actual === expected;
        const message = () => `${dateA} < ${dateB}: expected=${expected} actual=${actual}`;
        return { pass, message };
    },
    toCompareTasksWithResult({ sorting: sorting, tasks: tasks }, expected) {
        expect(tasks.length).toEqual(2);
        const taskA = tasks[0];
        const taskB = tasks[1];
        const actual = sorting.comparator(taskA, taskB, new SearchInfo_1.SearchInfo((0, TasksFileHelpers_1.createTestTasksFile)('dummy path.md'), tasks));
        let pass;
        let expectedDesription;
        switch (expected) {
            case -1:
                pass = actual < 0;
                expectedDesription = 'should be less than 0';
                break;
            case 0:
                pass = actual === 0;
                expectedDesription = 'should equal 0';
                break;
            case +1:
                pass = actual > 0;
                expectedDesription = 'should be more than 0';
                break;
        }
        const message = () => `
"${taskA.toFileLineString()}" <
"${taskB.toFileLineString()}"
  expect comparator result: "${expectedDesription}";
  actual comparator result: ${actual}`;
        return { pass, message };
    },
});
const equal = 0;
const after = 1; // This will actually pass if the comparator returns any value ABOVE 0;
const before = -1; // This will actually pass if the comparator returns any value BELOW 0;
// ---------------------------------------------------------------------
// Sorting Dates
// ---------------------------------------------------------------------
function expectDateComparesBefore(dateA, dateB) {
    testCompareByDateBothWays(dateA, dateB, before);
}
function expectDateComparesEqual(dateA, dateB) {
    testCompareByDateBothWays(dateA, dateB, equal);
}
function expectDateComparesAfter(dateA, dateB) {
    testCompareByDateBothWays(dateA, dateB, after);
}
function testCompareByDateBothWays(dateA, dateB, expected) {
    expect([dateA, dateB]).toGiveCompareToResult(expected);
    const reverseExpected = expected === equal ? equal : -expected;
    expect([dateB, dateA]).toGiveCompareToResult(reverseExpected);
}
// ---------------------------------------------------------------------
// Sorting Tasks
// ---------------------------------------------------------------------
function expectTaskComparesBefore(sorter, taskA, taskB) {
    testCompareTasksBothWays(sorter, taskA, taskB, before);
}
function expectTaskComparesEqual(sorter, taskA, taskB) {
    testCompareTasksBothWays(sorter, taskA, taskB, equal);
}
function expectTaskComparesAfter(sorter, taskA, taskB) {
    testCompareTasksBothWays(sorter, taskA, taskB, after);
}
function testCompareTasksBothWays(sorter, taskA, taskB, expected) {
    expect({ sorting: sorter, tasks: [taskA, taskB] }).toCompareTasksWithResult(expected);
    const reverseExpected = expected === equal ? equal : -expected;
    expect({ sorting: sorter, tasks: [taskB, taskA] }).toCompareTasksWithResult(reverseExpected);
}
//# sourceMappingURL=CustomMatchersForSorting.js.map