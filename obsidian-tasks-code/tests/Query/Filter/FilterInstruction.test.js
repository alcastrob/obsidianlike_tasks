"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FilterInstruction_1 = require("../../../src/Query/Filter/FilterInstruction");
describe('FilterInstruction', () => {
    const filter = (_task) => true;
    const filterInstruction = new FilterInstruction_1.FilterInstruction('find me', filter);
    it('canCreateFilterForLine should be case-insensitive exact match', () => {
        expect(filterInstruction.canCreateFilterForLine('FIND ME')).toEqual(true);
        expect(filterInstruction.canCreateFilterForLine('xFIND ME')).toEqual(false);
        expect(filterInstruction.canCreateFilterForLine('FIND MEx')).toEqual(false);
    });
    it('createFilterOrErrorMessage should be case-insensitive', () => {
        const filterOrErrorMessage = filterInstruction.createFilterOrErrorMessage('FIND ME');
        expect(filterOrErrorMessage).toBeValid();
    });
    it('explanation should be case-insensitive', () => {
        const line = 'FIND ME';
        const filterOrErrorMessage = filterInstruction.createFilterOrErrorMessage(line);
        expect(filterOrErrorMessage).toHaveExplanation(line);
    });
});
//# sourceMappingURL=FilterInstruction.test.js.map