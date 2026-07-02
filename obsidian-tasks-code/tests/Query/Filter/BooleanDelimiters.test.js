"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BooleanDelimiters_1 = require("../../../src/Query/Filter/BooleanDelimiters");
function shouldDelimitWithParentheses(line) {
    const delimiters = BooleanDelimiters_1.BooleanDelimiters.fromInstructionLine(line);
    expect(delimiters.openFilterChars).toEqual('(');
    expect(delimiters.closeFilterChars).toEqual(')');
    expect(delimiters.openAndCloseFilterChars).toEqual('()');
}
function shouldDelimitWithSquareBrackets(line) {
    const delimiters = BooleanDelimiters_1.BooleanDelimiters.fromInstructionLine(line);
    expect(delimiters.openFilterChars).toEqual('[');
    expect(delimiters.closeFilterChars).toEqual(']');
    expect(delimiters.openAndCloseFilterChars).toEqual('[]');
}
function shouldDelimitWithCurlyBraces(line) {
    const delimiters = BooleanDelimiters_1.BooleanDelimiters.fromInstructionLine(line);
    expect(delimiters.openFilterChars).toEqual('{');
    expect(delimiters.closeFilterChars).toEqual('}');
    expect(delimiters.openAndCloseFilterChars).toEqual('{}');
}
function shouldDelimitWithDoubleQuotes(line) {
    const delimiters = BooleanDelimiters_1.BooleanDelimiters.fromInstructionLine(line);
    expect(delimiters.openFilterChars).toEqual('"');
    expect(delimiters.closeFilterChars).toEqual('"');
    expect(delimiters.openAndCloseFilterChars).toEqual('"');
}
function shouldThrow(line) {
    const t = () => {
        BooleanDelimiters_1.BooleanDelimiters.fromInstructionLine(line);
    };
    expect(t).toThrow(Error);
    expect(t).toThrowError('All filters in a Boolean instruction must be inside one of these pairs of delimiter characters: (...) or [...] or {...} or "...". Combinations of those delimiters are no longer supported.');
}
describe('BooleanDelimiters', () => {
    it('construction - all delimiters', () => {
        const delimiters = BooleanDelimiters_1.BooleanDelimiters.allSupportedDelimiters();
        expect(delimiters.openFilterChars).toEqual('([{"');
        expect(delimiters.openFilter).toEqual('[\\(\\[\\{"]');
        expect(delimiters.closeFilterChars).toEqual(')]}"');
        expect(delimiters.closeFilter).toEqual('[\\)\\]\\}"]');
        expect(delimiters.openAndCloseFilterChars).toEqual('()[]{}"');
    });
    describe('construct from line with binary operators', () => {
        it('should recognise () delimiters', () => {
            shouldDelimitWithParentheses('(not done) OR (done)');
        });
        it('should recognise "" delimiters', () => {
            shouldDelimitWithDoubleQuotes('"not done" OR "done"');
        });
        it('should recognise [] delimiters', () => {
            shouldDelimitWithSquareBrackets('[not done] OR [done]');
        });
        it('should recognise {} delimiters', () => {
            shouldDelimitWithCurlyBraces('{not done} OR {done}');
        });
        it('does not recognise inconsistent delimiters in middle of line', () => {
            shouldDelimitWithParentheses('(not done) OR "done" OR (done)');
        });
        it('should reject line with mixed delimiters', () => {
            shouldThrow('(not done) OR "done"');
        });
        it('should reject line with unknown delimiters', () => {
            shouldThrow('<not done> OR <done>');
        });
    });
    describe('construct from line starting with NOT', () => {
        it('should recognise () delimiters', () => {
            shouldDelimitWithParentheses('NOT (not done)');
        });
        it('should recognise "" delimiters', () => {
            shouldDelimitWithDoubleQuotes('NOT "not done"');
        });
        it('should reject line with mixed delimiters', () => {
            shouldThrow('NOT (not done"');
        });
        it('should reject line with unknown delimiters', () => {
            shouldThrow('NOT <not done>');
        });
    });
    describe('error cases', () => {
        it('should throw if line is too short', () => {
            shouldThrow('');
            shouldThrow('x');
        });
    });
});
//# sourceMappingURL=BooleanDelimiters.test.js.map