"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toEqualMoment = toEqualMoment;
const jest_diff_1 = require("jest-diff");
// Based on https://stackoverflow.com/a/60229956/104370
function toEqualMoment(received, expected) {
    const pass = expected.isSame(received);
    const expectedAsText = expected.toISOString();
    const receivedAsText = received ? received.toISOString() : 'null';
    const message = () => pass
        ? `Received moment should not be ${expectedAsText}`
        : `Received moment is not the same as expected: ${(0, jest_diff_1.diff)(expectedAsText, receivedAsText)}`;
    return {
        message,
        pass,
    };
}
//# sourceMappingURL=CustomMatchersForDates.js.map