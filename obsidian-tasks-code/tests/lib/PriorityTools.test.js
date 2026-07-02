"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PriorityTools_1 = require("../../src/lib/PriorityTools");
const Priority_1 = require("../../src/Task/Priority");
describe('priority naming', () => {
    it.each(Object.values(Priority_1.Priority))('should name priority value: "%i"', (priority) => {
        const name = PriorityTools_1.PriorityTools.priorityNameUsingNone(priority);
        expect(name).not.toEqual('ERROR'); // if this fails, code needs to be updated for a new priority
    });
    it('should name default priority correctly', () => {
        const none = Priority_1.Priority.None;
        expect(PriorityTools_1.PriorityTools.priorityNameUsingNone(none)).toEqual('None');
        expect(PriorityTools_1.PriorityTools.priorityNameUsingNormal(none)).toEqual('Normal');
    });
    it.each([
        // Normal cases
        ['highest', Priority_1.Priority.Highest],
        ['high', Priority_1.Priority.High],
        ['medium', Priority_1.Priority.Medium],
        ['none', Priority_1.Priority.None],
        ['normal', Priority_1.Priority.None],
        ['low', Priority_1.Priority.Low],
        ['lowest', Priority_1.Priority.Lowest],
        // Erroneous cases
        ['', Priority_1.Priority.None],
        ['invalid_priority_string!', Priority_1.Priority.None],
        // Priority search is case-insensitive
        ['Highest', Priority_1.Priority.Highest],
        ['highEst', Priority_1.Priority.Highest],
    ])('should get priority value for "%s"', (str, value) => {
        expect(PriorityTools_1.PriorityTools.priorityValue(str)).toEqual(value);
    });
});
//# sourceMappingURL=PriorityTools.test.js.map