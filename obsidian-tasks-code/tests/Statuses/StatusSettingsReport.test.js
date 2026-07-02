"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StatusSettings_1 = require("../../src/Config/StatusSettings");
const StatusSettingsReport_1 = require("../../src/Statuses/StatusSettingsReport");
const ApprovalTestHelpers_1 = require("../TestingTools/ApprovalTestHelpers");
const StatusesTestHelpers_1 = require("../TestingTools/StatusesTestHelpers");
const GlobalFilter_1 = require("../../src/Config/GlobalFilter");
afterEach(() => {
    GlobalFilter_1.GlobalFilter.getInstance().reset();
});
describe('StatusSettingsReport', () => {
    it('should tabulate StatusSettings', () => {
        const statusSettings = new StatusSettings_1.StatusSettings();
        const markdown = (0, StatusSettingsReport_1.tabulateStatusSettings)(statusSettings);
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(markdown, '.md');
    });
    it('should include problems in table', () => {
        const customStatusesData = [
            ['/', 'In Progress', 'x', 'IN_PROGRESS'],
            ['/', 'In Progress DUPLICATE', 'x', 'IN_PROGRESS'],
            ['X', 'X - conventionally DONE, but this is CANCELLED', ' ', 'CANCELLED'],
            ['', '', '', 'TODO'], // A new, unedited status
            ['p', 'Unknown next symbol', 'q', 'TODO'],
            ['c', 'Followed by d', 'd', 'TODO'],
            ['n', 'Non-task', 'n', 'NON_TASK'],
            ['1', 'DONE followed by TODO', ' ', 'DONE'],
            ['2', 'DONE followed by IN_PROGRESS', '/', 'DONE'],
            ['3', 'DONE followed by DONE', 'x', 'DONE'],
            ['4', 'DONE followed by CANCELLED', 'X', 'DONE'],
            ['5', 'DONE followed by NON_TASK', 'n', 'DONE'],
        ];
        const { statusSettings } = (0, StatusesTestHelpers_1.createStatuses)(StatusesTestHelpers_1.coreStatusesData, customStatusesData);
        const markdown = (0, StatusSettingsReport_1.tabulateStatusSettings)(statusSettings);
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(markdown, '.md');
    });
    const customStatusesDataForSampleLines = [
        ['/', 'A slash', 'x', 'IN_PROGRESS'],
        ['/', 'In Progress DUPLICATE - SHOULD NOT BE IN SAMPLE TASK LINES', 'x', 'IN_PROGRESS'],
        ['', 'EMPTY STATUS SYMBOL - SHOULD NOT BE IN SAMPLE TASK LINES', '', 'TODO'],
        ['p', 'A p', 'q', 'TODO'],
    ];
    it('should create set of sample task lines, excluding duplicate and empty symbols', () => {
        const { statusSettings } = (0, StatusesTestHelpers_1.createStatuses)(StatusesTestHelpers_1.coreStatusesData, customStatusesDataForSampleLines);
        const taskLines = (0, StatusSettingsReport_1.sampleTaskLinesForValidStatuses)(statusSettings);
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(taskLines.join('\n'), '.md');
    });
    it('should create set of sample task lines include global filter', () => {
        GlobalFilter_1.GlobalFilter.getInstance().set('#task');
        const { statusSettings } = (0, StatusesTestHelpers_1.createStatuses)(StatusesTestHelpers_1.coreStatusesData, customStatusesDataForSampleLines);
        const taskLines = (0, StatusSettingsReport_1.sampleTaskLinesForValidStatuses)(statusSettings);
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(taskLines.join('\n'), '.md');
    });
});
//# sourceMappingURL=StatusSettingsReport.test.js.map