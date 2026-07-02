"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Sorter_1 = require("../../../src/Query/Sort/Sorter");
const Statement_1 = require("../../../src/Query/Statement");
describe('Sorter', () => {
    const comparator = (a, b, _searchInfo) => {
        return a.lineNumber - b.lineNumber;
    };
    it('should supply the original instruction', () => {
        const sorter = new Sorter_1.Sorter('sort by lineNumber', 'lineNumber', comparator, false);
        expect(sorter.instruction).toBe('sort by lineNumber');
        expect(sorter.statement.rawInstruction).toBe('sort by lineNumber');
    });
    it('should store a Statement object', () => {
        const instruction = 'sort by lineNumber';
        const statement = new Statement_1.Statement(instruction, instruction);
        const sorter = new Sorter_1.Sorter('sort by lineNumber', 'lineNumber', comparator, false);
        sorter.setStatement(statement);
        expect(sorter.statement.rawInstruction).toBe('sort by lineNumber');
    });
});
//# sourceMappingURL=Sorter.test.js.map