"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StatusRegistryReport_1 = require("../../src/Statuses/StatusRegistryReport");
const ApprovalTestHelpers_1 = require("../TestingTools/ApprovalTestHelpers");
const StatusesTestHelpers_1 = require("../TestingTools/StatusesTestHelpers");
describe('StatusRegistryReport', function () {
    it('should create a report', async () => {
        // Arrange
        const customStatusesData = [
            ['/', 'In Progress', 'x', 'IN_PROGRESS'],
            ['-', 'Cancelled', ' ', 'CANCELLED'],
            ['Q', 'Question', 'A', 'NON_TASK'],
            ['A', 'Answer', 'Q', 'NON_TASK'],
            ['', '', '', 'TODO'], // A new, unedited status
        ];
        const { statusSettings, statusRegistry } = (0, StatusesTestHelpers_1.createStatuses)(StatusesTestHelpers_1.coreStatusesData, customStatusesData);
        const reportName = 'Review and check your Statuses';
        // Act
        const version = 'x.y.z'; // lower-case, as the capitalised version would get edited at the next release.
        const report = (0, StatusRegistryReport_1.createStatusRegistryReport)(statusSettings, statusRegistry, reportName, version);
        // Assert
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(report, '.md');
    });
});
//# sourceMappingURL=StatusRegistryReport.test.js.map