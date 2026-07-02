"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JestApprovals_1 = require("approvals/lib/Providers/Jest/JestApprovals");
const MockDataHelpers_1 = require("../../TestingTools/MockDataHelpers");
const ApprovalTestHelpers_1 = require("../../TestingTools/ApprovalTestHelpers");
const VerifyMarkdown_1 = require("../../TestingTools/VerifyMarkdown");
const QueryFileDefaults_1 = require("../../../src/Query/QueryFileDefaults");
const MockDataLoader_1 = require("../../TestingTools/MockDataLoader");
function extractFrontmatter(testDataName) {
    const data = MockDataLoader_1.MockDataLoader.get(testDataName);
    const queryFile = (0, MockDataHelpers_1.getTasksFileFromMockData)(testDataName);
    const pos = queryFile.cachedMetadata.frontmatterPosition;
    return data.fileContents.slice(pos?.start.offset ?? 0, pos?.end.offset ?? 0);
}
describe('DocsSamplesForDefaults', () => {
    it('supported-properties-empty', () => {
        const testDataName = 'query_file_defaults_all_options_null';
        const frontmatter = extractFrontmatter(testDataName);
        // Make sure that any trailing spaces have been removed from the
        // properties in query_file_defaults_all_options_null.md, to avoid
        // fighting with spaces at end of line when the approved file from this
        // test is embedded in the user docs.
        expect(frontmatter).not.toContain(': ');
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(frontmatter, '.yaml');
    });
    it('supported-properties-full', () => {
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(extractFrontmatter('query_file_defaults_all_options_true'), '.yaml');
    });
    it('interpret_properties', () => {
        (0, ApprovalTestHelpers_1.verifyWithFileExtension)(extractFrontmatter('docs_sample_for_task_properties_reference'), '.yaml');
    });
    describe('demo-short-mode', () => {
        const testDataName = 'query_file_defaults_short_mode';
        it('yaml', () => {
            // Extract the frontmatter to a file, for docs
            (0, ApprovalTestHelpers_1.verifyWithFileExtension)(extractFrontmatter(testDataName), '.yaml');
        });
        it('instructions', () => {
            // Create the instruction from it, for docs
            const tasksFile = (0, MockDataHelpers_1.getTasksFileFromMockData)(testDataName);
            const generatedSource = new QueryFileDefaults_1.QueryFileDefaults().source(tasksFile);
            (0, JestApprovals_1.verify)(generatedSource);
        });
    });
    it('meta-bind-widgets-include', () => {
        (0, VerifyMarkdown_1.verifyMarkdownForDocs)(new QueryFileDefaults_1.QueryFileDefaults().metaBindPluginWidgets());
    });
    it('meta-bind-widgets-snippet', () => {
        (0, VerifyMarkdown_1.verifyMarkdown)(new QueryFileDefaults_1.QueryFileDefaults().metaBindPluginWidgets());
    });
    it('fake-types.json', () => {
        const queryFileDefaults = new QueryFileDefaults_1.QueryFileDefaults();
        const allPropertyNamesSorted = queryFileDefaults.allPropertyNamesSorted();
        // Generate an object representing QueryFileDefaults in Obsidian's types.json.
        const types = allPropertyNamesSorted.reduce((acc, propName) => {
            const propType = queryFileDefaults.propertyType(propName);
            if (propType !== undefined) {
                acc[propName] = propType;
            }
            return acc;
        }, {});
        const generatedObject = { types };
        (0, JestApprovals_1.verifyAsJson)(generatedObject);
    });
});
//# sourceMappingURL=DocsSamplesForDefaults.test.js.map