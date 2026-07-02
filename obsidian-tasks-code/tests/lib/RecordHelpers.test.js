"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RecordHelpers_1 = require("../../src/lib/RecordHelpers");
describe('renameKeyInRecordPreservingOrder', () => {
    it('should rename a key without changing the order of other keys', () => {
        const input = {
            a: 'apple',
            b: 'banana',
            c: 'cherry',
        };
        const result = (0, RecordHelpers_1.renameKeyInRecordPreservingOrder)(input, 'b', 'blueberry');
        expect(result).toEqual({
            a: 'apple',
            blueberry: 'banana',
            c: 'cherry',
        });
        // Ensure key order is preserved
        expect(Object.keys(result)).toEqual(['a', 'blueberry', 'c']);
    });
});
//# sourceMappingURL=RecordHelpers.test.js.map