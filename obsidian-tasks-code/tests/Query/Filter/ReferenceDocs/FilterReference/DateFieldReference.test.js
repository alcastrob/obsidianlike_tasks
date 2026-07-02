"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const moment_1 = __importDefault(require("moment"));
const ApprovalTestHelpers_1 = require("../../../../TestingTools/ApprovalTestHelpers");
window.moment = moment_1.default;
describe('explain', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-04-19'));
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    it.each([
        'filters-date-examples', // Alphabetical order by filename
        'last-this-next-week-month-quarter-year',
        'last-this-next-weekday',
    ])('date reference %s', (queryFileBasename) => {
        // Arrange
        const inputFile = `tests/Query/Filter/ReferenceDocs/FilterReference/${queryFileBasename}.input.query`;
        const instructions = (0, fs_1.readFileSync)(inputFile, 'utf-8');
        // Act, Assert
        (0, ApprovalTestHelpers_1.verifyQueryExplanation)(instructions);
    });
});
//# sourceMappingURL=DateFieldReference.test.js.map