"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RegExpTools_1 = require("../../src/lib/RegExpTools");
describe('regular expression equality', () => {
    it('should recognise identical regular expressions', () => {
        expect((0, RegExpTools_1.checkRegExpsIdentical)(/ABC/i, /ABC/i)).toEqual(true);
    });
    it('should detect differences in case-insensitive flag', () => {
        const t = () => {
            (0, RegExpTools_1.checkRegExpsIdentical)(/ABC/, /ABC/i);
        };
        expect(t).toThrow(Error);
    });
    it('should detect differences in global flag', () => {
        const t = () => {
            (0, RegExpTools_1.checkRegExpsIdentical)(/ABC/, /ABC/g);
        };
        expect(t).toThrow(Error);
    });
});
//# sourceMappingURL=RegExpTools.test.js.map