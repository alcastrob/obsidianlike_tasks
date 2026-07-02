"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyStatusAndOnCompletionAction = applyStatusAndOnCompletionAction;
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const JestApprovals_1 = require("approvals/lib/Providers/Jest/JestApprovals");
const Status_1 = require("../../src/Statuses/Status");
const StatusConfiguration_1 = require("../../src/Statuses/StatusConfiguration");
const TestHelpers_1 = require("../TestingTools/TestHelpers");
const OnCompletion_1 = require("../../src/Task/OnCompletion");
window.moment = moment_1.default;
beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-11'));
});
afterEach(() => {
    jest.useRealTimers();
    // resetSettings();
});
function applyStatusAndOnCompletionAction(task, newStatus) {
    const tasks = task.handleNewStatus(newStatus);
    return (0, OnCompletion_1.handleOnCompletion)(task, tasks);
}
function makeTask(line) {
    return (0, TestHelpers_1.fromLine)({ line });
}
describe('OnCompletion - parsing', () => {
    function checkParseOnCompletionValue(input, expected) {
        expect((0, OnCompletion_1.parseOnCompletionValue)(input)).toEqual(expected);
    }
    const deletes = ['delete', 'DELETE', ' delete '];
    it.each(deletes)('should parse "%s" as OnCompletion.Delete', (input) => {
        checkParseOnCompletionValue(input, OnCompletion_1.OnCompletion.Delete);
    });
    const keeps = ['keep', 'KEEP', ' keep '];
    it.each(keeps)('should parse "%s" as OnCompletion.Keep', (input) => {
        checkParseOnCompletionValue(input, OnCompletion_1.OnCompletion.Keep);
    });
    const ignores = ['', 'unknown'];
    it.each(ignores)('should parse "%s" as OnCompletion.Ignore', (input) => {
        checkParseOnCompletionValue(input, OnCompletion_1.OnCompletion.Ignore);
    });
});
describe('OnCompletion - cases where all tasks are retained', () => {
    it('should not delete an already-done task', () => {
        // Arrange
        const line = '- [x] An already-DONE, non-recurring task 🏁 delete ✅ 2024-02-10';
        const task = makeTask(line);
        // Act
        const returnedTasks = applyStatusAndOnCompletionAction(task, Status_1.Status.DONE);
        // Assert
        expect(returnedTasks.length).toEqual(1);
        expect(returnedTasks[0].originalMarkdown).toEqual(line);
    });
    it('should just return trigger-less, non-recurring task', () => {
        // Arrange
        const task = makeTask('- [ ] A non-recurring task with no trigger 📅 2024-02-10');
        // Act
        const tasks = applyStatusAndOnCompletionAction(task, Status_1.Status.DONE);
        // Assert
        expect((0, TestHelpers_1.toMarkdown)(tasks)).toMatchInlineSnapshot('"- [x] A non-recurring task with no trigger 📅 2024-02-10 ✅ 2024-02-11"');
    });
    it('should just return trigger-less recurring task', () => {
        // Arrange
        const task = makeTask('- [ ] A recurring task with no trigger 🔁 every day 📅 2024-02-10');
        // Act
        const tasks = applyStatusAndOnCompletionAction(task, Status_1.Status.DONE);
        // Assert
        expect((0, TestHelpers_1.toMarkdown)(tasks)).toMatchInlineSnapshot(`
            "- [ ] A recurring task with no trigger 🔁 every day 📅 2024-02-11
            - [x] A recurring task with no trigger 🔁 every day 📅 2024-02-10 ✅ 2024-02-11"
        `);
    });
    it('should return the task when going from TODO to IN_PROGRESS', () => {
        // Arrange
        const task = makeTask('- [ ] A recurring task with "delete" Action 🔁 every day 🏁 delete 📅 2024-02-10');
        // Act
        const tasks = applyStatusAndOnCompletionAction(task, Status_1.Status.IN_PROGRESS);
        // Assert
        expect(tasks.length).toEqual(1);
        expect(tasks[0].status.type).toEqual(StatusConfiguration_1.StatusType.IN_PROGRESS);
    });
    it('should return the task when going from one DONE status to another DONE status', () => {
        // Arrange
        const done2 = new Status_1.Status(new StatusConfiguration_1.StatusConfiguration('X', 'DONE', ' ', true, StatusConfiguration_1.StatusType.DONE));
        const task = makeTask('- [x] A simple done task with 🏁 delete');
        // Act
        const tasks = applyStatusAndOnCompletionAction(task, done2);
        // Assert
        expect(tasks.length).toEqual(1);
        expect(tasks[0].status.symbol).toEqual('X');
        expect(tasks[0].status.type).toEqual(StatusConfiguration_1.StatusType.DONE);
    });
    it('should return a task featuring the On Completion flag trigger but an empty string Action', () => {
        // Arrange
        const task = makeTask('- [ ] A non-recurring task with');
        // Act
        const tasks = applyStatusAndOnCompletionAction(task, Status_1.Status.DONE);
        // Assert
        expect(tasks.length).toEqual(1);
    });
});
describe('OnCompletion - "keep" action', () => {
    it('should retain a task with "keep" Action upon completion', () => {
        // Arrange
        const task = makeTask('- [ ] A non-recurring task with "keep" Action 🏁 keep');
        // Act
        const tasks = applyStatusAndOnCompletionAction(task, Status_1.Status.DONE);
        // Assert
        expect(tasks.length).toEqual(1);
    });
});
describe('OnCompletion - "delete" action', () => {
    it('should retain only the next instance of a recurring task with "delete" Action upon completion', () => {
        // Arrange
        const task = makeTask('- [ ] A recurring task with "delete" Action 🔁 every day 🏁 delete 📅 2024-02-10');
        // Act
        const tasks = applyStatusAndOnCompletionAction(task, Status_1.Status.DONE);
        // Assert
        expect((0, TestHelpers_1.toMarkdown)(tasks)).toMatchInlineSnapshot('"- [ ] A recurring task with "delete" Action 🔁 every day 🏁 delete 📅 2024-02-11"');
    });
    it('should discard a task with "delete" Action upon completion', () => {
        // Arrange
        const task = makeTask('- [ ] A non-recurring task with "delete" Action 🏁 delete');
        // Act
        const tasks = applyStatusAndOnCompletionAction(task, Status_1.Status.DONE);
        // Assert
        expect(tasks.length).toEqual(0);
    });
});
function getCases() {
    return [
        // Non-recurring
        {
            nextStatus: Status_1.Status.DONE,
            line: '- [ ] A non-recurring task with no trigger 📅 2024-02-10',
        },
        {
            nextStatus: Status_1.Status.DONE,
            line: '- [ ] A non-recurring task with 🏁 delete',
        },
        {
            nextStatus: Status_1.Status.DONE,
            line: '- [ ] A non-recurring task with 🏁 delete 📅 2024-02-10',
        },
        {
            nextStatus: Status_1.Status.DONE,
            line: '- [ ] A non-recurring task with invalid OC trigger 🏁 INVALID_ACTION 📅 2024-02-10',
        },
        {
            nextStatus: Status_1.Status.DONE,
            line: '- [ ] A non-recurring task with 🏁',
        },
        // Recurring
        {
            nextStatus: Status_1.Status.DONE,
            line: '- [ ] A recurring task with no trigger 🔁 every day 📅 2024-02-10',
        },
        {
            nextStatus: Status_1.Status.DONE,
            line: '- [ ] A recurring task with 🏁 delete 🔁 every day 📅 2024-02-10',
        },
        {
            nextStatus: Status_1.Status.IN_PROGRESS,
            line: '- [ ] A recurring task with 🏁 delete 🔁 every day 📅 2024-02-10',
        },
        // Other
        {
            nextStatus: Status_1.Status.DONE,
            line: '- [x] An already-DONE task, changing to Same      DONE status 🏁 delete 📅 2024-02-10 ✅ 2024-02-10',
        },
        {
            nextStatus: new Status_1.Status(new StatusConfiguration_1.StatusConfiguration('X', 'new status', ' ', false, StatusConfiguration_1.StatusType.DONE)),
            line: '- [x] An already-DONE task, changing to Different DONE status 🏁 delete 📅 2024-02-10 ✅ 2024-02-10',
        },
        // Indented, within callout/code block
        {
            nextStatus: Status_1.Status.DONE,
            line: '    - [ ] An indented task with 🏁 delete',
        },
        {
            nextStatus: Status_1.Status.DONE,
            line: '> - [ ] A task within a block quote or callout and 🏁 delete',
        },
    ];
}
function action(toggleCase) {
    const newStatus = toggleCase.nextStatus;
    const task = (0, TestHelpers_1.fromLine)({ line: toggleCase.line, path: 'anything.md', precedingHeader: 'heading' });
    const step1 = task.handleNewStatus(newStatus);
    const step2 = applyStatusAndOnCompletionAction(task, newStatus);
    return `
initial task:
${task.toFileLineString()}

=> advances to status [${newStatus.symbol}] and type ${newStatus.type}:
${(0, TestHelpers_1.toMarkdown)(step1)}

=> which, after any on-completion action, results in:
${(0, TestHelpers_1.toMarkdown)(step2)}
----------------------------------------------
`;
}
describe('visualise completion-behaviour', () => {
    it('visualise', () => {
        // List of status and task
        const cases = getCases();
        (0, JestApprovals_1.verifyAll)('checking on completion', cases, (toggleCase) => action(toggleCase));
    });
});
//# sourceMappingURL=OnCompletion.test.js.map