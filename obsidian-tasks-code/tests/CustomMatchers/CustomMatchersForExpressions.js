"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toEvaluateAs = toEvaluateAs;
const jest_diff_1 = require("jest-diff");
const Expression_1 = require("../../src/Scripting/Expression");
// Based on https://stackoverflow.com/a/60229956/104370
function toEvaluateAs(instruction, expected) {
    const functionOrError = (0, Expression_1.parseExpression)([], instruction);
    expect(functionOrError.queryComponent).not.toBeUndefined();
    const received = (0, Expression_1.evaluateExpression)(functionOrError.queryComponent, []);
    const pass = received === expected;
    const expectedAsText = expected.toString();
    const receivedAsText = received ? received.toString() : 'null';
    const message = () => pass
        ? `Expression result should not be ${expectedAsText}`
        : `Expression result is not the same as expected: ${(0, jest_diff_1.diff)(expectedAsText, receivedAsText)}`;
    return {
        message,
        pass,
    };
}
//# sourceMappingURL=CustomMatchersForExpressions.js.map