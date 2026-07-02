"use strict";
// begin-snippet: declare-moment-in-tests
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
// end-snippet
// Some test code to show how to use moment
describe('moment integration', () => {
    it('use moment in tests', () => {
        // begin-snippet: use-moment-in-tests
        const date = (0, moment_1.default)('2003-10-12');
        const now = (0, moment_1.default)();
        // end-snippet
        expect(date.isBefore(now)).toEqual(true);
    });
});
//# sourceMappingURL=MomentIntegration.test.js.map