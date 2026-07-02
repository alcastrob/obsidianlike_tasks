"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CombinationApprovalsAsync_1 = require("./CombinationApprovalsAsync");
describe('CombinationApprovalsAsync', () => {
    (0, CombinationApprovalsAsync_1.verifyAllCombinations2Async)('verify2', 'title', async (a, b) => {
        // @ts-expect-error: TS2365: Operator '+' cannot be applied to types 'T1' and 'T2'.
        return `(${a} + ${b}) => ${a + b}`;
    }, [0, 1], [2, 3]);
    (0, CombinationApprovalsAsync_1.verifyAllCombinations3Async)('verify3', 'title', async (a, b, c) => {
        // @ts-expect-error: TS2365: Operator '+' cannot be applied to types 'T1' and 'T2' and 'T3'.
        return `(${a} + ${b} + ${c}) => ${a + b + c}`;
    }, [0, 1], [2, 3], [4, 5]);
    (0, CombinationApprovalsAsync_1.verifyAllCombinations4Async)('verify4', 'title', async (a, b, c, d) => {
        // @ts-expect-error: TS2365: Operator '+' cannot be applied to types 'T1' and 'T2' and 'T3' + .....
        const total = a + b + c + d;
        return `(${a} + ${b} + ${c} + ${d}) => ${total}`;
    }, [0, 1], [2, 3], [4, 5], [6, 7]);
    (0, CombinationApprovalsAsync_1.verifyAllCombinations5Async)('verify5', 'title', async (a, b, c, d, e) => {
        // @ts-expect-error: TS2365: Operator '+' cannot be applied to types 'T1' and 'T2' and 'T3' + .....
        const total = a + b + c + d + e;
        return `(${a} + ${b} + ${c} + ${d} + ${e}) => ${total}`;
    }, [0, 1], [2, 3], [4, 5], [6, 7], [8, 9]);
    (0, CombinationApprovalsAsync_1.verifyAllCombinations6Async)('verify6', 'title', async (a, b, c, d, e, f) => {
        // @ts-expect-error: TS2365: Operator '+' cannot be applied to types 'T1' and 'T2' and 'T3' + .....
        const total = a + b + c + d + e + f;
        return `(${a} + ${b} + ${c} + ${d} + ${e} + ${f}) => ${total}`;
    }, [0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11]);
    (0, CombinationApprovalsAsync_1.verifyAllCombinations7Async)('verify7', 'title', async (a, b, c, d, e, f, g) => {
        // @ts-expect-error: TS2365: Operator '+' cannot be applied to types 'T1' and 'T2' and 'T3' + .....
        const total = a + b + c + d + e + f + g;
        return `(${a} + ${b} + ${c} + ${d} + ${e} + ${f} + ${g}) => ${total}`;
    }, [0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11], [12, 13]);
    (0, CombinationApprovalsAsync_1.verifyAllCombinations8Async)('verify8', 'title', async (a, b, c, d, e, f, g, h) => {
        // @ts-expect-error: TS2365: Operator '+' cannot be applied to types 'T1' and 'T2' and 'T3' + .....
        const total = a + b + c + d + e + f + g + h;
        return `(${a} + ${b} + ${c} + ${d} + ${e} + ${f} + ${g} + ${h}) => ${total}`;
    }, [0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11], [12, 13], [14, 15]);
    (0, CombinationApprovalsAsync_1.verifyAllCombinations9Async)('verify9', 'title', async (a, b, c, d, e, f, g, h, i) => {
        // @ts-expect-error: TS2365: Operator '+' cannot be applied to types 'T1' and 'T2' and 'T3' + .....
        const total = a + b + c + d + e + f + g + h + i;
        return `(${a} + ${b} + ${c} + ${d} + ${e} + ${f} + ${g} + ${h} + ${i}) => ${total}`;
    }, [0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11], [12, 13], [14, 15], [16, 17]);
});
// begin-snippet: async-combination-approvals
describe('demonstrate async combination approvals', () => {
    // Note that we do not have an 'it' section here.
    // verifyAllCombinations3Async() creates the 'it' block.
    (0, CombinationApprovalsAsync_1.verifyAllCombinations3Async)('documentation example', 'sample outputs', async (a, b, c) => {
        return `(${a}, ${b}, ${c}) => ${a} '${b}' ${c}`;
    }, [0, 1], ['hello', 'world'], [true, false]);
});
// end-snippet
//# sourceMappingURL=CombinationApprovalsAsync.test.js.map