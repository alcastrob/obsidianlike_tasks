"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Grouper_1 = require("../../../src/Query/Group/Grouper");
const Statement_1 = require("../../../src/Query/Statement");
describe('Grouper', () => {
    const grouperFunction = (task, _searchInfo) => {
        return [task.lineNumber.toString()];
    };
    it('should supply the original instruction', () => {
        const grouper = new Grouper_1.Grouper('group by lineNumber', 'lineNumber', grouperFunction, false);
        expect(grouper.instruction).toBe('group by lineNumber');
        expect(grouper.statement.rawInstruction).toBe('group by lineNumber');
    });
    it('should store a Statement object', () => {
        const instruction = 'group by lineNumber';
        const statement = new Statement_1.Statement(instruction, instruction);
        const grouper = new Grouper_1.Grouper('group by lineNumber', 'lineNumber', grouperFunction, false);
        grouper.setStatement(statement);
        expect(grouper.statement.rawInstruction).toBe('group by lineNumber');
    });
});
//# sourceMappingURL=Grouper.test.js.map