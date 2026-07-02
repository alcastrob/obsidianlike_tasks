"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SubstringMatcher_1 = require("../../../src/Query/Matchers/SubstringMatcher");
describe('SubstringMatcher', () => {
    it('should match simple text', () => {
        const matcher = new SubstringMatcher_1.SubstringMatcher('find me');
        expect(matcher.matches('find me')).toStrictEqual(true);
        expect(matcher.matches('prefix find me suffix')).toStrictEqual(true);
        expect(matcher.matches('FIND ME')).toStrictEqual(true);
    });
    it('should match any values in array of text', () => {
        const matcher = new SubstringMatcher_1.SubstringMatcher('find me');
        expect(matcher.matchesAnyOf(['wibble', 'stuff', 'FIND ME'])).toStrictEqual(true);
        expect(matcher.matchesAnyOf(['wibble', 'stuff', 'LOSE ME'])).not.toStrictEqual(true);
    });
});
//# sourceMappingURL=SubstringMatcher.test.js.map