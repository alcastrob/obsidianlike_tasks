"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
// begin-snippet: fix-window.moment-calls-in-tests
window.moment = moment_1.default;
// end-snippet
const CustomMatchersForSorting_1 = require("../CustomMatchers/CustomMatchersForSorting");
// These are lower-level tests that the Task-based ones above, for ease of test coverage.
describe('compareBy', () => {
    it('compares correctly by date', () => {
        const earlierDate = '2022-01-01';
        const laterDate = '2022-02-01';
        const invalidDate = '2022-02-30';
        (0, CustomMatchersForSorting_1.expectDateComparesBefore)(earlierDate, laterDate);
        (0, CustomMatchersForSorting_1.expectDateComparesEqual)(earlierDate, earlierDate);
        (0, CustomMatchersForSorting_1.expectDateComparesAfter)(laterDate, earlierDate);
        (0, CustomMatchersForSorting_1.expectDateComparesAfter)(null, earlierDate); // no date sorts after valid dates
        (0, CustomMatchersForSorting_1.expectDateComparesEqual)(null, null);
        (0, CustomMatchersForSorting_1.expectDateComparesBefore)(invalidDate, null); // invalid dates sort before no date
        (0, CustomMatchersForSorting_1.expectDateComparesEqual)(invalidDate, invalidDate);
        (0, CustomMatchersForSorting_1.expectDateComparesBefore)(invalidDate, earlierDate); // invalid dates sort before valid ones
        (0, CustomMatchersForSorting_1.expectDateComparesAfter)(laterDate, invalidDate); // invalid dates sort before valid ones
    });
});
//# sourceMappingURL=DateTools.test.js.map