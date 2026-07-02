"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QueryComponentOrError_1 = require("../../src/Query/QueryComponentOrError");
describe('QueryComponentOrError', () => {
    it('should check validity', () => {
        expect(QueryComponentOrError_1.QueryComponentOrError.fromObject('instruction', 42).isValid()).toBe(true);
        expect(QueryComponentOrError_1.QueryComponentOrError.fromError('instruction', 'error message').isValid()).toBe(false);
    });
});
//# sourceMappingURL=QueryComponentOrError.test.js.map