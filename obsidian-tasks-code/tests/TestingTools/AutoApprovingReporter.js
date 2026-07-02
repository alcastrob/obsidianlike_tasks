"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoApprovingReporter = void 0;
const fs = require('fs');
/**
 * Use this if you want to **automatically approve** all changed Approval Tests approved files
 * and **review the differences in a git diff tool before committing**.
 * To activate this in several tests, uncomment the `new AutoApprovingReporter()` line in
 * {@link verifyMarkdown}.
 */
class AutoApprovingReporter {
    constructor() {
        this.name = 'AutoApprovingReporter';
    }
    canReportOn() {
        return true;
    }
    report(approvedFilePath, receivedFilePath) {
        fs.copyFile(receivedFilePath, approvedFilePath, function (err) {
            if (err)
                throw err;
            console.log(`File was copied to destination
source:      ${receivedFilePath}
destination: ${approvedFilePath}
`);
        });
    }
}
exports.AutoApprovingReporter = AutoApprovingReporter;
//# sourceMappingURL=AutoApprovingReporter.js.map