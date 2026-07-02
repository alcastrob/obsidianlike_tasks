"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const ToggleDone_1 = require("../../src/Commands/ToggleDone");
const GlobalFilter_1 = require("../../src/Config/GlobalFilter");
const StatusRegistry_1 = require("../../src/Statuses/StatusRegistry");
const Status_1 = require("../../src/Statuses/Status");
const StatusConfiguration_1 = require("../../src/Statuses/StatusConfiguration");
window.moment = moment_1.default;
/**
 * Test that toggling the task on the given input line generates the correct
 * text content, and also gives the correct expected new cursor position.
 *
 * Cursor positions are indicated by a | (pipe) character for easy visualisation
 * of the cursor position.
 *
 * @param inputWithCursorMark
 * @param expectedWithCursorMark
 */
function testToggleLine(inputWithCursorMark, expectedWithCursorMark) {
    const cursorMarker = '|';
    const cursorMarkerRegex = /\|/g;
    const input = inputWithCursorMark.replace(cursorMarkerRegex, '');
    const expected = expectedWithCursorMark.replace(cursorMarkerRegex, '');
    // Check that the cursor marker appears exactly once in each input string:
    expect(input.length).toEqual(inputWithCursorMark.length - 1);
    expect(expected.length).toEqual(expectedWithCursorMark.length - 1);
    const cursorPosition = (s) => {
        // Split input string on cursor marker, and make array of lines
        const linesBeforeCursor = s.split(cursorMarker, 1)[0].split('\n');
        // Cursor was positioned at the end of the last line
        const line = linesBeforeCursor.length - 1;
        const ch = linesBeforeCursor[line].length;
        return { line, ch };
    };
    testToggleLineForOutOfRangeCursorPositions(input, cursorPosition(inputWithCursorMark), expected, cursorPosition(expectedWithCursorMark));
}
/**
 * Test that toggling the task on the given input line generates the correct
 * text content, and also gives the correct expected new cursor position.
 *
 * Cursor positions are given by indices, where 0 is the start of the line.
 *
 * Call this version to represent a cursor position outside of the allowed
 * range of character positions in the input or expected strings.
 *
 * @param input
 * @param initialCursorOffset
 * @param expected
 * @param expectedCursorOffset
 */
function testToggleLineForOutOfRangeCursorPositions(input, initialCursorOffset, expected, expectedCursorOffset) {
    const result = (0, ToggleDone_1.toggleLine)(input, 'x.md');
    expect(result.text).toStrictEqual(expected);
    const actualCursorOffset = (0, ToggleDone_1.getNewCursorPosition)(initialCursorOffset, result);
    expect(actualCursorOffset).toEqual(expectedCursorOffset);
}
describe('ToggleDone', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2022-09-04'));
    });
    afterEach(() => {
        jest.useRealTimers();
        GlobalFilter_1.GlobalFilter.getInstance().reset();
    });
    // The | (pipe) indicates the calculated position where the cursor should be displayed.
    // Note that prior to the #1103 fix, this position was sometimes ignored.
    // Most of the tests are run twice. The second time, they are tested with tasks that
    // do not match the global filter.
    it('should add checkbox to empty line, and lines without list items', () => {
        testToggleLine('|', '- [ ] |');
        testToggleLine('foo|bar', '- [ ] foobar|');
        GlobalFilter_1.GlobalFilter.getInstance().set('#task');
        testToggleLine('|', '- [ ] |');
        testToggleLine('foo|bar', '- [ ] foobar|');
    });
    it('should add checkbox to hyphen and space', () => {
        testToggleLine('|- ', '- [ ] |');
        testToggleLine('- |', '- [ ] |');
        testToggleLine('1. |foobar', '1. [ ] foobar|');
        GlobalFilter_1.GlobalFilter.getInstance().set('#task');
        testToggleLine('|- ', '- [ ] |');
        testToggleLine('- |', '- [ ] |');
        testToggleLine('1. |foobar', '1. [ ] foobar|');
    });
    it('should complete a task', () => {
        testToggleLine('|- [ ] ', '|- [x]  ✅ 2022-09-04');
        testToggleLine('- [ ] |', '- [x] | ✅ 2022-09-04');
        testToggleLine('- [ ] description|', '- [x] description| ✅ 2022-09-04');
        // Issue #449 - cursor jumped 13 characters to the right on completion
        testToggleLine('- [ ] I have a |proper description', '- [x] I have a |proper description ✅ 2022-09-04');
        GlobalFilter_1.GlobalFilter.getInstance().set('#task');
        // Done date is not added if task does not match global filter
        testToggleLine('|- [ ] ', '|- [x] ');
        testToggleLine('1. [ ] |', '1. [x] |');
        // Done date is added if task does not match global filter
        testToggleLine('- [ ] #task|', '- [x]  #tas|k ✅ 2022-09-04'); // Extra space added before #; cursor moves left
        testToggleLine('* [ ] #task description|', '* [x] #task description| ✅ 2022-09-04');
        // Issue #449 - cursor jumped 13 characters to the right on completion
        testToggleLine('- [ ] I have a |proper description', '- [x] I have a |proper description');
    });
    it('should un-complete a completed task', () => {
        testToggleLine('|- [x]  ✅ 2022-09-04', '|- [ ] ');
        testToggleLine('1. [x]  ✅ 2022-09-04|', '1. [ ] |');
        // Issue #449 - cursor jumped 13 characters to the left on un-completion
        testToggleLine('- [x] I have a proper description| ✅ 2022-09-04', '- [ ] I have a proper description|');
        GlobalFilter_1.GlobalFilter.getInstance().set('#task');
        // Done date is not removed if task does not match global filter
        testToggleLine('|- [x]  ✅ 2022-09-04', '|- [ ] ✅ 2022-09-04');
        testToggleLine('+ [x]  ✅ 2022-09-04|', '+ [ ] ✅ 2022-09-04|');
        // Done date is added if task matches the global filter
        testToggleLine('|- [x] #task ✅ 2022-09-04', '|- [ ]  #task'); // Extra space added before #
        testToggleLine('1. [x] #task description ✅ 2022-09-04|', '1. [ ] #task description|');
        // Issue #449 - cursor jumped 13 characters to the left on un-completion
        testToggleLine('- [x] I have a proper description| ✅ 2022-09-04', '- [ ] I have a proper description| ✅ 2022-09-04');
    });
    it('should complete a recurring task', () => {
        testToggleLine('- [ ] I am a recurring task| 🔁 every day 📅 2022-09-04', `- [ ] I am a recurring task 🔁 every day 📅 2022-09-05
- [x] I am a recurring task| 🔁 every day 📅 2022-09-04 ✅ 2022-09-04`);
        // With a trailing space at the end of the initial line, which is deleted
        // when the task lines are regenerated, the cursor does not move one character to the left:
        testToggleLine('- [ ] I am a recurring task| 🔁 every day 📅 2022-09-04 ', `- [ ] I am a recurring task 🔁 every day 📅 2022-09-05
- [x] I am a recurring task| 🔁 every day 📅 2022-09-04 ✅ 2022-09-04`);
        GlobalFilter_1.GlobalFilter.getInstance().set('#task');
        // Tasks do not recur, and no done-date added, if not matching global filter
        testToggleLine('- [ ] I am a recurring task| 🔁 every day 📅 2022-09-04', '- [x] I am a recurring task| 🔁 every day 📅 2022-09-04');
        // With a trailing space at the end of the initial line, which is deleted
        // when the task lines are regenerated, the cursor moves one character to the left:
        testToggleLine('- [ ] I am a recurring task| 🔁 every day 📅 2022-09-04 ', '- [x] I am a recurring task| 🔁 every day 📅 2022-09-04 ');
    });
    describe('on completion', () => {
        it('should delete a self-deleting task - cursor at start of line', () => {
            // Issue #3256 - traceback occurred.
            testToggleLine(
            // Force linebreak
            '|- [ ] #task Delete me 🏁 delete', '|');
        });
        it('should delete a self-deleting task - cursor at end of line', () => {
            // Issue #3256 - traceback occurred.
            testToggleLine(
            // Force linebreak
            '- [ ] #task Delete me 🏁 delete|', '|');
        });
        it('should discard completed recurring task - cursor at start of line', () => {
            testToggleLine('|- [ ] #task Delete my completed task 🔁 every day 🏁 delete ⏳ 2024-12-31', '|- [ ] #task Delete my completed task 🔁 every day 🏁 delete ⏳ 2025-01-01');
        });
        it('should discard completed recurring task - cursor at end of line', () => {
            testToggleLine('- [ ] #task Delete my completed task 🔁 every day 🏁 delete ⏳ 2024-12-31|', '- [ ] #task Delete my completed task 🔁 every day 🏁 delete ⏳ 2025-01-01|');
        });
    });
    describe('should honour next status character', () => {
        afterEach(() => {
            GlobalFilter_1.GlobalFilter.getInstance().reset();
        });
        // Arrange
        const statusRegistry = StatusRegistry_1.StatusRegistry.getInstance();
        statusRegistry.resetToDefaultStatuses();
        statusRegistry.add(new Status_1.Status(new StatusConfiguration_1.StatusConfiguration('P', 'Pro', 'C', false)));
        statusRegistry.add(new Status_1.Status(new StatusConfiguration_1.StatusConfiguration('C', 'Con', 'P', false)));
        it('when there is no global filter', () => {
            const line1 = '- [P] this is a task starting at Pro';
            // Assert
            const line2 = (0, ToggleDone_1.toggleLine)(line1, 'x.md').text;
            expect(line2).toStrictEqual('- [C] this is a task starting at Pro');
            const line3 = (0, ToggleDone_1.toggleLine)(line2, 'x.md').text;
            expect(line3).toStrictEqual('- [P] this is a task starting at Pro');
        });
        it('when there is a global filter and task with global filter is toggled', () => {
            GlobalFilter_1.GlobalFilter.getInstance().set('#task');
            const line1 = '- [C] #task this is a task starting at Con';
            // Assert
            const line2 = (0, ToggleDone_1.toggleLine)(line1, 'x.md').text;
            expect(line2).toStrictEqual('- [P] #task this is a task starting at Con');
            const line3 = (0, ToggleDone_1.toggleLine)(line2, 'x.md').text;
            expect(line3).toStrictEqual('- [C] #task this is a task starting at Con');
        });
        it('when there is a global filter and task without global filter is toggled', () => {
            GlobalFilter_1.GlobalFilter.getInstance().set('#task');
            const line1 = '- [P] this is a task starting at Pro, not matching the global filter';
            // Assert
            const line2 = (0, ToggleDone_1.toggleLine)(line1, 'x.md').text;
            expect(line2).toStrictEqual('- [C] this is a task starting at Pro, not matching the global filter');
            const line3 = (0, ToggleDone_1.toggleLine)(line2, 'x.md').text;
            expect(line3).toStrictEqual('- [P] this is a task starting at Pro, not matching the global filter');
        });
    });
    describe('should proceed through the statuses until a TODO status is reached', () => {
        it('should proceed through the statuses until a TODO status is reached when a task is completed', () => {
            // Arrange
            const statusRegistry = StatusRegistry_1.StatusRegistry.getInstance();
            statusRegistry.resetToDefaultStatuses();
            statusRegistry.set([
                new Status_1.Status(new StatusConfiguration_1.StatusConfiguration('x', 'Done', '-', false, StatusConfiguration_1.StatusType.DONE)),
                ...statusRegistry.registeredStatuses,
            ]);
            testToggleLine('- [ ] Recurring task should start with TODO| 🔁 every day 📅 2022-09-04 ', `- [ ] Recurring task should start with TODO 🔁 every day 📅 2022-09-05
- [x] Recurring task should start with TODO| 🔁 every day 📅 2022-09-04 ✅ 2022-09-04`);
        });
        it('should not get stuck in a loop when a task is completed', () => {
            // Arrange
            const statusRegistry = StatusRegistry_1.StatusRegistry.getInstance();
            statusRegistry.resetToDefaultStatuses();
            statusRegistry.set([
                new Status_1.Status(new StatusConfiguration_1.StatusConfiguration('1', '1', '2', false, StatusConfiguration_1.StatusType.IN_PROGRESS)),
                new Status_1.Status(new StatusConfiguration_1.StatusConfiguration('2', '2', '1', false, StatusConfiguration_1.StatusType.DONE)),
            ]);
            testToggleLine('- [1] Recurring task should start with TODO| 🔁 every day 📅 2022-09-04 ', `- [1] Recurring task should start with TODO 🔁 every day 📅 2022-09-05
- [2] Recurring task should start with TODO| 🔁 every day 📅 2022-09-04 ✅ 2022-09-04`);
        });
    });
});
//# sourceMappingURL=ToggleDone.test.js.map