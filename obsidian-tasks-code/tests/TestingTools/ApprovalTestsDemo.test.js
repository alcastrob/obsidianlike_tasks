"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JestApprovals_1 = require("approvals/lib/Providers/Jest/JestApprovals");
describe('ApprovalTests', () => {
    // begin-snippet: approval-test-as-text
    test('SimpleVerify', () => {
        (0, JestApprovals_1.verify)('Hello From Approvals');
    });
    // end-snippet
    // begin-snippet: approval-test-as-json
    test('JsonVerify', () => {
        const data = { name: 'fred', age: 30 };
        (0, JestApprovals_1.verifyAsJson)(data);
    });
    // end-snippet
});
//# sourceMappingURL=ApprovalTestsDemo.test.js.map