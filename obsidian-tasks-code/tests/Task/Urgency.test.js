"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const Urgency_1 = require("../../src/Task/Urgency");
const DateTestHelpers_1 = require("../TestingTools/DateTestHelpers");
const TestHelpers_1 = require("../TestingTools/TestHelpers");
const Priority_1 = require("../../src/Task/Priority");
window.moment = moment_1.default;
function testUrgency(builder, expectedScore) {
    const task = builder.build();
    expect(Urgency_1.Urgency.calculate(task)).toBeCloseTo(expectedScore, 5); // 5 digits after decimal point
}
/**
 * Simulate the current date, then test the urgency for a task created by the builder
 * @param today
 * @param builder
 * @param expectedScore
 */
function testUrgencyOnDate(today, builder, expectedScore) {
    jest.setSystemTime(new Date(today));
    testUrgency(builder, expectedScore);
}
/**
 * Return a TaskBuilder to create a Task with Low Priority.
 *
 * Priority Low adds zero to the score, which means the
 * test for other parts of the priority calculation becomes clearer.
 */
function lowPriorityBuilder() {
    return new TaskBuilder_1.TaskBuilder().priority(Priority_1.Priority.Low);
}
// -----------------------------------------------------------------
// Time of day does not affect result
// begin-snippet: test-at-different-times
describe('urgency - test time-of-day impact on due-date score', () => {
    // Test to reproduce https://github.com/obsidian-tasks-group/obsidian-tasks/issues/2068
    beforeEach(() => {
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    const task = (0, TestHelpers_1.fromLine)({ line: '- [ ] #task 🔽 📅 2023-06-26', path: 'a/b/c.md', precedingHeader: null });
    it.each([
        // Force new line for each time
        ['00:00'],
        ['00:01'],
        ['06:00'],
        ['09:00'],
        ['11:59'],
        ['12:00'],
        ['12:01'],
        ['19:00'],
        ['23:59'],
    ])('with time  "%s"', (time) => {
        jest.setSystemTime(new Date('2023-06-26 ' + time));
        expect(Urgency_1.Urgency.calculate(task)).toEqual(8.8);
    });
});
// end-snippet
// -----------------------------------------------------------------
// Priority tests
describe('urgency - priority component', () => {
    it('should score correctly for priority', () => {
        const builder = new TaskBuilder_1.TaskBuilder();
        testUrgency(builder.priority(Priority_1.Priority.Highest), 9.0);
        testUrgency(builder.priority(Priority_1.Priority.High), 6.0);
        testUrgency(builder.priority(Priority_1.Priority.Medium), 3.9);
        testUrgency(builder.priority(Priority_1.Priority.None), 1.95);
        testUrgency(builder.priority(Priority_1.Priority.Low), 0.0);
        testUrgency(builder.priority(Priority_1.Priority.Lowest), -1.8);
    });
});
// -----------------------------------------------------------------
// Due Date tests
function testUrgencyForDueDate(daysToDate, expectedScore) {
    const today = '2022-10-31';
    const dueAsString = (0, DateTestHelpers_1.calculateRelativeDate)(today, daysToDate);
    testUrgencyOnDate(today, lowPriorityBuilder().dueDate(dueAsString), expectedScore);
}
beforeEach(() => {
    jest.useFakeTimers();
});
afterEach(() => {
    jest.useRealTimers();
});
describe('urgency - due date component', () => {
    it('More than 7 days overdue: 12.0', () => {
        testUrgencyForDueDate(-200, 12.0);
        testUrgencyForDueDate(-8, 12.0);
    });
    it('Due between 7 days ago and in 14 days: Range of 12.0 to 0.2', () => {
        testUrgencyForDueDate(-7, 12.0);
        testUrgencyForDueDate(0, 8.8);
        testUrgencyForDueDate(1, 8.34286);
        testUrgencyForDueDate(6, 6.05714);
        testUrgencyForDueDate(13, 2.85714);
        testUrgencyForDueDate(14, 2.4);
    });
    it('More than 14 days until due: 0.2', () => {
        testUrgencyForDueDate(15, 2.4);
        testUrgencyForDueDate(40, 2.4);
        testUrgencyForDueDate(200, 2.4);
    });
    it('not due: 0.0', () => {
        const lowPriority = lowPriorityBuilder();
        testUrgency(lowPriority.dueDate(null), 0.0);
    });
});
// -----------------------------------------------------------------
// Scheduled Date tests
function testUrgencyForScheduledDate(daysToDate, expectedScore) {
    const today = '2029-12-31';
    const scheduledAsString = (0, DateTestHelpers_1.calculateRelativeDate)(today, daysToDate);
    testUrgencyOnDate(today, lowPriorityBuilder().scheduledDate(scheduledAsString), expectedScore);
}
describe('urgency - scheduled date component', () => {
    const lowPriority = lowPriorityBuilder();
    it('scheduled Today or earlier: 5.0', () => {
        testUrgencyForScheduledDate(0, 5.0);
        testUrgencyForScheduledDate(-20, 5.0);
    });
    it('scheduled Tomorrow or later: 0.0', () => {
        testUrgencyForScheduledDate(1, 0.0);
        testUrgencyForScheduledDate(39, 0.0);
    });
    it('not scheduled: 0.0', () => {
        testUrgency(lowPriority.scheduledDate(null), 0.0);
    });
});
// -----------------------------------------------------------------
// Start Date tests
function testUrgencyForStartDate(daysToDate, expectedScore) {
    const today = '1997-03-27';
    const startAsString = (0, DateTestHelpers_1.calculateRelativeDate)(today, daysToDate);
    testUrgencyOnDate(today, lowPriorityBuilder().startDate(startAsString), expectedScore);
}
describe('urgency - start date component', () => {
    const lowPriority = lowPriorityBuilder();
    it('start Today or earlier: 0.0', () => {
        testUrgencyForStartDate(0, 0.0);
        testUrgencyForStartDate(-22, 0.0);
    });
    it('start Tomorrow or later: -3.0', () => {
        testUrgencyForStartDate(1, -3.0);
        testUrgencyForStartDate(67, -3.0);
    });
    it('not scheduled: 0.0', () => {
        testUrgency(lowPriority.startDate(null), 0.0);
    });
});
//# sourceMappingURL=Urgency.test.js.map