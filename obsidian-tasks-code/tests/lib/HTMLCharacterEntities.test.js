"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HTMLCharacterEntities_1 = require("../../src/lib/HTMLCharacterEntities");
describe('HTMLEntities', () => {
    it('should encode single characters', () => {
        expect((0, HTMLCharacterEntities_1.htmlEncodeCharacter)('a')).toEqual('a');
        expect((0, HTMLCharacterEntities_1.htmlEncodeCharacter)('<')).toEqual('&lt;');
        expect((0, HTMLCharacterEntities_1.htmlEncodeCharacter)('>')).toEqual('&gt;');
        expect((0, HTMLCharacterEntities_1.htmlEncodeCharacter)('&')).toEqual('&amp;');
        expect((0, HTMLCharacterEntities_1.htmlEncodeCharacter)('"')).toEqual('&quot;');
    });
    it('should encode multi-character strings', () => {
        const input = 'This & that in <b>bold</b>';
        const expected = 'This &amp; that in &lt;b&gt;bold&lt;/b&gt;';
        expect((0, HTMLCharacterEntities_1.htmlEncodeString)(input)).toEqual(expected);
    });
});
//# sourceMappingURL=HTMLCharacterEntities.test.js.map