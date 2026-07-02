"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskRegularExpressions_1 = require("../../src/Task/TaskRegularExpressions");
describe('List Markers', () => {
    it.each([
        // split list
        '-',
        '*',
        '+',
        '0.',
        '1.',
        '12345.',
        '0)',
        '1)',
        '12345)',
    ])('should be a valid list marker: "%s"', (candidate) => {
        expect(TaskRegularExpressions_1.TaskRegularExpressions.listMarkerRegex.exec(candidate)).not.toBeNull();
    });
    it.each([
        // split list
        '%',
        '.',
        ')',
    ])('should NOT be a valid list marker: "%s"', (candidate) => {
        expect(TaskRegularExpressions_1.TaskRegularExpressions.listMarkerRegex.exec(candidate)).toBeNull();
    });
});
//# sourceMappingURL=TaskRegularExpressions.test.js.map