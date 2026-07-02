"use strict";
/**
 * @jest-environment jsdom
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const ScheduledDateField_1 = require("../../../src/Query/Filter/ScheduledDateField");
window.moment = moment_1.default;
beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-06-11 20:00'));
});
afterEach(() => {
    jest.useRealTimers();
});
describe('DateField', () => {
    it('should reject date search containing unexpanded template text', () => {
        // Thorough checks are done in TemplatingPluginTools tests.
        // Arrange
        const instruction = 'scheduled before <%+ tp.date.now("YYYY-MM-DD", 0, tp.file.title , "YYYY-MM-DD") %>';
        // Act
        const filter = new ScheduledDateField_1.ScheduledDateField().createFilterOrErrorMessage(instruction);
        // Assert
        expect(filter).not.toBeValid();
        expect(filter.error).toContain('Instruction contains unexpanded template text');
    });
    it('should honour original case, when explaining simple filters', () => {
        const filter = new ScheduledDateField_1.ScheduledDateField().createFilterOrErrorMessage('HAS SCHEDULED DATE');
        expect(filter).toHaveExplanation('HAS SCHEDULED DATE');
    });
});
//# sourceMappingURL=DateField.test.js.map