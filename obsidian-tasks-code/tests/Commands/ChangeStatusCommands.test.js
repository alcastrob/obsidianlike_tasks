"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const obsidian_1 = require("obsidian");
const ChangeStatusCommands_1 = require("../../src/Commands/ChangeStatusCommands");
const Status_1 = require("../../src/Statuses/Status");
const StatusRegistry_1 = require("../../src/Statuses/StatusRegistry");
const StatusConfiguration_1 = require("../../src/Statuses/StatusConfiguration");
const Settings_1 = require("../../src/Config/Settings");
jest.mock('obsidian', () => ({
    Notice: jest.fn(),
}));
window.moment = moment_1.default;
beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-27'));
});
afterEach(() => {
    jest.useRealTimers();
    (0, Settings_1.resetSettings)();
});
describe('setStatusOnLine', () => {
    it('should return refuse to act on a non-task line', () => {
        const result = (0, ChangeStatusCommands_1.setStatusOnLine)('This is not a task', 'file.md', Status_1.Status.DONE);
        expect(result).toBeUndefined();
    });
    it('should return refuse to act on an empty line', () => {
        const result = (0, ChangeStatusCommands_1.setStatusOnLine)('', 'file.md', Status_1.Status.DONE);
        expect(result).toBeUndefined();
    });
    it('should return an EditorInsertion for a valid task line', () => {
        const result = (0, ChangeStatusCommands_1.setStatusOnLine)('- [ ] A simple task', 'file.md', Status_1.Status.DONE);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('moveTo');
    });
    it('should set moveTo.line to 0 for a single-line result', () => {
        const result = (0, ChangeStatusCommands_1.setStatusOnLine)('- [ ] A simple task', 'file.md', Status_1.Status.DONE);
        expect(result).toBeDefined();
        expect(result.moveTo).toEqual({ line: 0 });
    });
    it('should return multiple lines with moveTo.line as last line index for a recurring task', () => {
        const result = (0, ChangeStatusCommands_1.setStatusOnLine)('- [ ] A recurring task 🔁 every day 📅 2022-09-04', 'file.md', Status_1.Status.DONE);
        expect(result).toBeDefined();
        const lines = result.text.split('\n');
        expect(lines.length).toBeGreaterThan(1);
        expect(result.moveTo).toEqual({ line: lines.length - 1 });
    });
    it('should honour user settings for recurrence', () => {
        (0, Settings_1.updateSettings)({ recurrenceOnNextLine: true });
        const result = (0, ChangeStatusCommands_1.setStatusOnLine)('- [ ] A recurring task 🔁 every day 📅 2022-09-04', 'file.md', Status_1.Status.DONE);
        expect(result).toBeDefined();
        expect(result?.text).toEqual([
            '- [x] A recurring task 🔁 every day 📅 2022-09-04 ✅ 2026-02-27',
            '- [ ] A recurring task 🔁 every day 📅 2022-09-05',
        ].join('\n'));
    });
});
describe('createSetStatusLineTransformer', () => {
    const MockedNotice = jest.mocked(obsidian_1.Notice);
    beforeEach(() => {
        MockedNotice.mockClear();
    });
    it('should change the status of a task line', () => {
        const transformer = (0, ChangeStatusCommands_1.createSetStatusLineTransformer)(Status_1.Status.DONE);
        const result = transformer('- [ ] A simple task', 'file.md');
        expect(result).toBeDefined();
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('moveTo');
    });
    it('should mark a task as done', () => {
        const transformer = (0, ChangeStatusCommands_1.createSetStatusLineTransformer)(Status_1.Status.DONE);
        const result = transformer('- [ ] A simple task', 'file.md');
        expect(result.text).toContain('- [x] A simple task');
    });
    it('should do nothing when the line is not a task', () => {
        const transformer = (0, ChangeStatusCommands_1.createSetStatusLineTransformer)(Status_1.Status.DONE);
        const result = transformer('This is not a task', 'file.md');
        expect(result).toBeUndefined();
    });
    it('should notify the user when the line is not a task', () => {
        const transformer = (0, ChangeStatusCommands_1.createSetStatusLineTransformer)(Status_1.Status.DONE);
        transformer('This is not a task', 'file.md');
        expect(MockedNotice).toHaveBeenCalledWith('Cannot set status: line is not a task or does not match global filter');
    });
    it('should not notify the user when changing a valid task', () => {
        const transformer = (0, ChangeStatusCommands_1.createSetStatusLineTransformer)(Status_1.Status.DONE);
        transformer('- [ ] A simple task', 'file.md');
        expect(MockedNotice).not.toHaveBeenCalled();
    });
});
describe('Change status commands', () => {
    let registry;
    beforeEach(() => {
        registry = new StatusRegistry_1.StatusRegistry();
        registry.clearStatuses();
    });
    it('should generate expected id and name', () => {
        registry.add(Status_1.Status.TODO);
        registry.add(Status_1.Status.IN_PROGRESS);
        const commands = (0, ChangeStatusCommands_1.createSetStatusCommands)(registry);
        expect(commands.length).toBe(2);
        expect(commands[0].id).toBe('set-status-symbol-to-space');
        expect(commands[0].name).toBe('Change status to: [ ] Todo');
        expect(commands[1].id).toBe('set-status-symbol-to-/');
        expect(commands[1].name).toBe('Change status to: [/] In Progress');
    });
    it('should only create commands for the first of any statuses with duplicate symbols', () => {
        registry.add(new StatusConfiguration_1.StatusConfiguration('A', 'Status 1', ' ', true, StatusConfiguration_1.StatusType.TODO));
        registry.add(new StatusConfiguration_1.StatusConfiguration('A', 'Status 2 - I should be ignored', ' ', true, StatusConfiguration_1.StatusType.TODO));
        const commands = (0, ChangeStatusCommands_1.createSetStatusCommands)(registry);
        expect(commands.length).toBe(1);
        expect(commands[0].name).toBe('Change status to: [A] Status 1');
    });
    it('should not create commands for Empty statuses', () => {
        // Users can create a new status, and then not populate it.
        // These are 'empty' statuses; the status symbol is an empty string.
        registry.add(Status_1.Status.EMPTY);
        const commands = (0, ChangeStatusCommands_1.createSetStatusCommands)(registry);
        expect(commands.length).toBe(0);
    });
});
//# sourceMappingURL=ChangeStatusCommands.test.js.map