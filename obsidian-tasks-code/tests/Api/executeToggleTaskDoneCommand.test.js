"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const Api_1 = require("../../src/Api");
// This needs to be mocked because the API imports TaskModal which extends Obsidian's Modal
// class which is not available during tests.
jest.mock('obsidian', () => ({
    Modal: class Mock {
    },
}));
window.moment = moment_1.default;
describe('APIv1 - executeToggleTaskDoneCommand', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2022-09-04'));
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    const api = (0, Api_1.tasksApiV1)({});
    // This is a simple smoke test to make sure executeToggleTaskDoneCommand is working. Its core
    // functionality is covered by other tests
    it('should complete a task', () => {
        expect(api.executeToggleTaskDoneCommand('- [ ] ', 'x.md')).toBe('- [x]  ✅ 2022-09-04');
        expect(api.executeToggleTaskDoneCommand('- [x] ✅ 2022-09-04', 'x.md')).toBe('- [ ] ');
    });
});
//# sourceMappingURL=executeToggleTaskDoneCommand.test.js.map