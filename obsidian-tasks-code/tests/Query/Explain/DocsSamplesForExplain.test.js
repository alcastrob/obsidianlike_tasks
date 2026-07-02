"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const Options_1 = require("approvals/lib/Core/Options");
const GlobalFilter_1 = require("../../../src/Config/GlobalFilter");
const GlobalQuery_1 = require("../../../src/Config/GlobalQuery");
const ApprovalTestHelpers_1 = require("../../TestingTools/ApprovalTestHelpers");
const Settings_1 = require("../../../src/Config/Settings");
const VerifyMarkdown_1 = require("../../TestingTools/VerifyMarkdown");
const MockDataHelpers_1 = require("../../TestingTools/MockDataHelpers");
const MockDataLoader_1 = require("../../TestingTools/MockDataLoader");
window.moment = moment_1.default;
function checkExplainPresentAndVerify(blockQuery) {
    expect(blockQuery.includes('explain')).toEqual(true);
    (0, ApprovalTestHelpers_1.verifyQuery)(blockQuery);
}
describe('explain', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2022-10-21'));
    });
    afterAll(() => {
        jest.useRealTimers();
    });
    afterEach(Settings_1.resetSettings);
    it('expands dates', () => {
        // Arrange
        const instructions = `
starts after 2 years ago
scheduled after 1 week ago
due before tomorrow
explain`;
        // Act, Assert
        checkExplainPresentAndVerify(instructions);
        (0, ApprovalTestHelpers_1.verifyTaskBlockExplanation)(instructions, new GlobalFilter_1.GlobalFilter(), new GlobalQuery_1.GlobalQuery());
    });
    it('boolean combinations', () => {
        // Arrange
        const instructions = `
explain
not done
(due before tomorrow) AND (is recurring)`;
        // Act, Assert
        checkExplainPresentAndVerify(instructions);
        (0, ApprovalTestHelpers_1.verifyTaskBlockExplanation)(instructions, new GlobalFilter_1.GlobalFilter(), new GlobalQuery_1.GlobalQuery());
    });
    it('nested boolean combinations', () => {
        // Arrange
        const instructions = `
explain
(                                                                                       \\
    (description includes 1) AND (description includes 2) AND (description includes 3)  \\
) OR (                                                                                  \\
    (description includes 5) AND (description includes 6) AND (description includes 7)  \\
)                                                                                       \\
AND NOT (description includes 7)
`;
        // Act, Assert
        checkExplainPresentAndVerify(instructions);
        (0, ApprovalTestHelpers_1.verifyTaskBlockExplanation)(instructions, new GlobalFilter_1.GlobalFilter(), new GlobalQuery_1.GlobalQuery());
    });
    it('regular expression', () => {
        // Arrange
        const instructions = `
explain
path regex matches /^Root/Sub-Folder/Sample File\\.md/i`;
        // Act, Assert
        checkExplainPresentAndVerify(instructions);
        (0, ApprovalTestHelpers_1.verifyTaskBlockExplanation)(instructions, new GlobalFilter_1.GlobalFilter(), new GlobalQuery_1.GlobalQuery());
    });
    const globalQueryLine = `limit 50
heading includes tasks`;
    it('example global query', () => {
        // Act, Assert
        (0, ApprovalTestHelpers_1.verifyQuery)(globalQueryLine);
    });
    it('explains task block with global query active', () => {
        // Arrange
        const globalQuery = new GlobalQuery_1.GlobalQuery(globalQueryLine);
        const blockQuery = `
not done
due next week
explain`;
        // Act, Assert
        checkExplainPresentAndVerify(blockQuery);
        (0, ApprovalTestHelpers_1.verifyTaskBlockExplanation)(blockQuery, new GlobalFilter_1.GlobalFilter(), globalQuery);
    });
    describe('query file defaults', () => {
        const testDataName = 'docs_sample_for_explain_query_file_defaults';
        const data = MockDataLoader_1.MockDataLoader.get(testDataName);
        const tasksFile = (0, MockDataHelpers_1.getTasksFileFromMockData)(testDataName);
        it('file content', () => {
            const markdown = '````text' + '\n' + data.fileContents + '````';
            (0, VerifyMarkdown_1.verifyMarkdownForDocs)(markdown);
        });
        it('explanation', () => {
            // Arrange
            const blockQuery = 'explain';
            // Act, Assert
            checkExplainPresentAndVerify(blockQuery);
            (0, ApprovalTestHelpers_1.verifyTaskBlockExplanation)(blockQuery, new GlobalFilter_1.GlobalFilter(), new GlobalQuery_1.GlobalQuery(), new Options_1.Options(), tasksFile);
        });
    });
    it('placeholders', () => {
        // Arrange
        const instructions = `
explain
path includes {{query.file.path}}
path includes {{query.file.pathWithoutExtension}}
root includes {{query.file.root}}
folder includes {{query.file.folder}}
filename includes {{query.file.filename}}
filename includes {{query.file.filenameWithoutExtension}}

description includes Some Cryptic String {{! Inline comments are removed before search }}
`;
        // Act, Assert
        checkExplainPresentAndVerify(instructions);
        (0, ApprovalTestHelpers_1.verifyTaskBlockExplanation)(instructions, new GlobalFilter_1.GlobalFilter(), new GlobalQuery_1.GlobalQuery());
    });
    it('placeholders error', () => {
        // Arrange
        const instructions = `
# query.file.fileName is invalid, because of the capital N.
# query.file.filename is the correct property name.
filename includes {{query.file.fileName}}`;
        // Act, Assert
        (0, ApprovalTestHelpers_1.verifyQuery)(instructions); // This does not have an explain, so does not call checkExplainPresentAndVerify()
        (0, ApprovalTestHelpers_1.verifyTaskBlockExplanation)(instructions, new GlobalFilter_1.GlobalFilter(), new GlobalQuery_1.GlobalQuery());
    });
    it('line continuation - single slash', () => {
        // Arrange
        const instructions = `
(priority is highest) OR       \\
    (priority is lowest)
explain
`;
        // Act, Assert
        checkExplainPresentAndVerify(instructions);
        (0, ApprovalTestHelpers_1.verifyTaskBlockExplanation)(instructions, new GlobalFilter_1.GlobalFilter(), new GlobalQuery_1.GlobalQuery());
    });
    it('line continuation - double slash', () => {
        // Arrange
        const instructions = `
# Search for a single backslash:
description includes \\\\
explain
`;
        // Act, Assert
        checkExplainPresentAndVerify(instructions);
        (0, ApprovalTestHelpers_1.verifyTaskBlockExplanation)(instructions, new GlobalFilter_1.GlobalFilter(), new GlobalQuery_1.GlobalQuery());
    });
});
//# sourceMappingURL=DocsSamplesForExplain.test.js.map