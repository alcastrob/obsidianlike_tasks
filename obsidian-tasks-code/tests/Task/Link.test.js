"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Link_1 = require("../../src/Task/Link");
const AllCacheSampleData_1 = require("../Obsidian/AllCacheSampleData");
const ScriptingTestHelpers_1 = require("../Scripting/ScriptingTestHelpers");
const MockDataHelpers_1 = require("../TestingTools/MockDataHelpers");
const VerifyMarkdown_1 = require("../TestingTools/VerifyMarkdown");
const LinkResolver_1 = require("../../src/Task/LinkResolver");
const obsidian_1 = require("../__mocks__/obsidian");
const MockDataLoader_1 = require("../TestingTools/MockDataLoader");
const TasksFileHelpers_1 = require("../TestingTools/TasksFileHelpers");
function getLink(testDataName, index) {
    const data = MockDataLoader_1.MockDataLoader.get(testDataName);
    expect(data.cachedMetadata.links).toBeDefined();
    const rawLink = data.cachedMetadata.links[index];
    const destinationPath = (0, obsidian_1.getFirstLinkpathDestFromData)(data, rawLink);
    const resolver = LinkResolver_1.LinkResolver.getInstance();
    resolver.setGetFirstLinkpathDestFn(() => destinationPath);
    return new Link_1.Link(rawLink, data.filePath);
}
describe('linkClass', () => {
    it('should construct a Link object', () => {
        const link = getLink('links_everywhere', 0);
        expect(link).toBeDefined();
        expect(link.originalMarkdown).toEqual('[[link_in_file_body]]');
        expect(link.destination).toEqual('link_in_file_body');
        expect(link.displayText).toEqual('link_in_file_body');
        expect(link.markdown).toEqual(link.originalMarkdown);
        expect(link.linksTo('link_in_file_body')).toEqual(true);
        expect(link.linksTo('link_in_file_body.md')).toEqual(true);
    });
    describe('getLink() configures Link.destinationPath automatically', () => {
        it('should set the full path for a resolved link', () => {
            const link = getLink('link_in_heading', 0);
            expect(link.destinationPath).toEqual('Test Data/multiple_headings.md');
        });
        it('should not set the full path for a broken/unresolved link', () => {
            const link = getLink('link_is_broken', 0);
            expect(link.destinationPath).toEqual(null);
        });
    });
    describe('return markdown to navigate to a link', () => {
        // These links are useful
        it('should return the filename if simple [[filename]]', () => {
            const link = getLink('link_in_task_wikilink', 0);
            expect(link.originalMarkdown).toEqual('[[link_in_task_wikilink]]');
            expect(link.markdown).toEqual('[[link_in_task_wikilink]]');
        });
        // For more test examples, see QueryResultsRenderer.test.ts
        it('should return a working link to [[#heading]]', () => {
            const link = getLink('internal_heading_links', 0);
            expect(link.originalMarkdown).toEqual('[[#Basic Internal Links]]');
            expect(link.markdown).toEqual('[[Test Data/internal_heading_links.md#Basic Internal Links|Basic Internal Links]]');
        });
        // ================================
        // WIKILINK TESTS
        // ================================
        // Tests checking against __internal_heading_links__
        it('should return the filename of the containing note if the link is internal [[#heading]]', () => {
            const link = getLink('internal_heading_links', 0);
            expect(link.originalMarkdown).toEqual('[[#Basic Internal Links]]');
            expect(link.markdown).toEqual('[[Test Data/internal_heading_links.md#Basic Internal Links|Basic Internal Links]]');
        });
        it('should return the filename of the containing note if the link is internal and has an alias [[#heading|display text]]', () => {
            const link = getLink('internal_heading_links', 6);
            expect(link.originalMarkdown).toEqual('[[#Header Links With File Reference]]');
            expect(link.markdown).toEqual('[[Test Data/internal_heading_links.md#Header Links With File Reference|Header Links With File Reference]]');
        });
        // Tests checking against __link_in_task_wikilink__
        it('should return the filename if simple [[filename]]', () => {
            const link = getLink('link_in_task_wikilink', 0);
            expect(link.originalMarkdown).toEqual('[[link_in_task_wikilink]]');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        it('should return the filename if link has a path [[path/filename]]', () => {
            const link = getLink('link_in_task_wikilink', 2);
            expect(link.originalMarkdown).toEqual('[[Test Data/link_in_task_wikilink]]');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        it('should return the filename if link has a path and a heading link [[path/filename#heading]]', () => {
            const link = getLink('link_in_task_wikilink', 3);
            expect(link.originalMarkdown).toEqual('[[Test Data/link_in_task_wikilink#heading_link]]');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        it('should return the filename if link has an alias [[filename|alias]]', () => {
            const link = getLink('link_in_task_wikilink', 4);
            expect(link.originalMarkdown).toEqual('[[link_in_task_wikilink|alias]]');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        it('should return the filename if link has a path and an alias [[path/path/filename|alias]]', () => {
            const link = getLink('link_in_task_wikilink', 5);
            expect(link.originalMarkdown).toEqual('[[Test Data/link_in_task_wikilink|alias]]');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        // # is a valid character in a filename or a path but Obsidian does not support it in links
        it('should return the filename if path contains a # [[pa#th/path/filename]]', () => {
            const link = getLink('link_in_task_wikilink', 6);
            expect(link.originalMarkdown).toEqual('[[pa#th/path/link_in_task_wikilink]]');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        // When grouping a Wikilink link expect [[file.md]] to be grouped with [[file]].
        it('should return a filename with no file extension if suffixed with .md [[link_in_task_wikilink.md]]', () => {
            const link = getLink('link_in_task_wikilink', 7);
            expect(link.originalMarkdown).toEqual('[[link_in_task_wikilink.md]]');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        it('should return a filename with corresponding file extension if not markdown [[a_pdf_file.pdf]]', () => {
            const link = getLink('link_in_task_wikilink', 8);
            expect(link.originalMarkdown).toEqual('[[a_pdf_file.pdf]]');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        // Empty Wikilink Tests
        // [[]] is not detected by the obsidian parser as a link
        it('should provide no special functionality for [[|]]; returns "|")', () => {
            const link = getLink('link_in_task_wikilink', 9);
            expect(link.originalMarkdown).toEqual('[[|]]');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        it('should provide no special functionality for [[|alias]]; returns "|alias".)', () => {
            const link = getLink('link_in_task_wikilink', 10);
            expect(link.originalMarkdown).toEqual('[[|alias]]');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        it('should provide no special functionality for [[|#alias]]; returns "|".)', () => {
            const link = getLink('link_in_task_wikilink', 11);
            expect(link.originalMarkdown).toEqual('[[|#alias]]');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        // ================================
        // MARKDOWN LINK TESTS
        // ================================
        // Tests checking against __link_in_task_markdown_link__
        it('should return the filename if the link is internal [display name](#heading)', () => {
            const link = getLink('link_in_task_markdown_link', 8);
            expect(link.originalMarkdown).toEqual('[heading](#heading)');
            expect(link.markdown).toEqual('[[Test Data/link_in_task_markdown_link.md#heading|heading]]');
        });
        it('should return the filename when a simple markdown link [display name](filename)', () => {
            const link = getLink('link_in_task_markdown_link', 2);
            expect(link.originalMarkdown).toEqual('[link_in_task_markdown_link](link_in_task_markdown_link.md)');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        it('should return the filename if link has a path [link_in_task_markdown_link](path/filename.md)', () => {
            const link = getLink('link_in_task_markdown_link', 3);
            expect(link.originalMarkdown).toEqual('[link_in_task_markdown_link](Test%20Data/link_in_task_markdown_link.md)');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        it('should return the filename if link has a path and a heading link [heading_link](path/filename.md#heading)', () => {
            const link = getLink('link_in_task_markdown_link', 4);
            expect(link.originalMarkdown).toEqual('[heading_link](Test%20Data/link_in_task_markdown_link.md#heading)');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        it('should return the filename if link has an alias [alias](filename.md)', () => {
            const link = getLink('link_in_task_markdown_link', 5);
            expect(link.originalMarkdown).toEqual('[alias](link_in_task_markdown_link.md)');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        it('should return the filename if link has a path and an alias [alias](path/path/filename.md)', () => {
            const link = getLink('link_in_task_markdown_link', 6);
            expect(link.originalMarkdown).toEqual('[alias](Test%20Data/link_in_task_markdown_link.md)');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        // # is a valid character in a filename or a path but Obsidian does not support it in links
        it('should return the string before the # [link_in_task_markdown_link](pa#th/path/filename.md)', () => {
            const link = getLink('link_in_task_markdown_link', 7);
            expect(link.originalMarkdown).toEqual('[link_in_task_markdown_link](pa#th/path/link_in_task_markdown_link.md)');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        // When grouping a Wikilink link expect [[file.md]] to be grouped with [[file]].
        it('should return a filename when no .md extension if the .md exists in markdown link [alias](filename)', () => {
            const link = getLink('link_in_task_markdown_link', 9);
            expect(link.originalMarkdown).toEqual('[link_in_task_markdown_link](link_in_task_markdown_link)');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        it('should return a filename with corresponding file extension if not markdown [a_pdf_file](a_pdf_file.pdf)', () => {
            const link = getLink('link_in_task_markdown_link', 10);
            expect(link.originalMarkdown).toEqual('[a_pdf_file](a_pdf_file.pdf)');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        it('should handle spaces in the path, filename, and heading link [heading link](path/filename with spaces.md#heading link)', () => {
            const link = getLink('link_in_task_markdown_link', 11);
            expect(link.originalMarkdown).toEqual('[spaces everywhere](Manual%20Testing/Smoke%20Testing%20the%20Tasks%20Plugin#How%20the%20tests%20work)');
            expect(link.markdown).toEqual(link.originalMarkdown);
        });
        // Empty Markdown Link Tests
        // []() and [alias]() are not detected by the obsidian parser as a link
    });
    describe('linksTo() tests', () => {
        it('matches filenames', () => {
            const link = getLink('links_everywhere', 0);
            expect(link.linksTo('link_in_file_body')).toEqual(true);
            expect(link.linksTo('link_in_file_body.md')).toEqual(true);
            expect(link.linksTo('somewhere_else')).toEqual(false);
            expect(link.linksTo('link_in_file_body_but_different')).toEqual(false);
            expect(link.linksTo('link_in_file_')).toEqual(false);
        });
        it('matches without folders', () => {
            const linkToAFile = getLink('link_in_task_wikilink', 0);
            expect(linkToAFile.originalMarkdown).toMatchInlineSnapshot('"[[link_in_task_wikilink]]"');
            expect(linkToAFile.linksTo('link_in_task_wikilink')).toEqual(true);
        });
        it('matches with folders', () => {
            const linkToAFolder = getLink('link_in_task_wikilink', 2);
            expect(linkToAFolder.originalMarkdown).toMatchInlineSnapshot('"[[Test Data/link_in_task_wikilink]]"');
            expect(linkToAFolder.linksTo('link_in_task_wikilink')).toEqual(true);
            expect(linkToAFolder.linksTo('Test Data/link_in_task_wikilink')).toEqual(true);
            expect(linkToAFolder.linksTo('Test Data/link_in_task_wikilink.md')).toEqual(true);
        });
        it('matches TasksFile - only exact paths match', () => {
            const linkToAFolder = getLink('link_in_task_wikilink', 2);
            expect(linkToAFolder.originalMarkdown).toMatchInlineSnapshot('"[[Test Data/link_in_task_wikilink]]"');
            expect(linkToAFolder.linksTo((0, TasksFileHelpers_1.createTestTasksFile)('Test Data/link_in_task_wikilink.md'))).toEqual(true);
            expect(linkToAFolder.linksTo((0, TasksFileHelpers_1.createTestTasksFile)('link_in_task_wikilink.md'))).toEqual(false);
            expect(linkToAFolder.linksTo((0, TasksFileHelpers_1.createTestTasksFile)('Wrong Test Data/link_in_task_wikilink.md'))).toEqual(false);
            expect(linkToAFolder.linksTo((0, TasksFileHelpers_1.createTestTasksFile)('something_obviously_different.md'))).toEqual(false);
        });
    });
});
describe('visualise links', () => {
    beforeAll(() => {
        LinkResolver_1.LinkResolver.getInstance().setGetFirstLinkpathDestFn(obsidian_1.getFirstLinkpathDest);
    });
    afterAll(() => {
        LinkResolver_1.LinkResolver.getInstance().resetGetFirstLinkpathDestFn();
    });
    function createRow(field, value) {
        // We use NBSP - non-breaking spaces - so that the approved file content
        // is correctly aligned when viewed in Obsidian:
        return (0, ScriptingTestHelpers_1.addBackticks)(field.padEnd(26, ' ')) + ': ' + (0, ScriptingTestHelpers_1.addBackticks)((0, ScriptingTestHelpers_1.formatToRepresentType)(value)) + '\n';
    }
    function visualiseLinks(outlinks, testDataName) {
        let output = '';
        if (outlinks.length === 0) {
            return output;
        }
        output += `## ${MockDataLoader_1.MockDataLoader.markdownPath(testDataName)}\n\n`;
        outlinks.forEach((link) => {
            output += createRow('link.originalMarkdown', link.originalMarkdown);
            output += createRow('link.markdown', link.markdown);
            output += createRow('link.destination', link.destination);
            output += createRow('link.destinationPath', link.destinationPath ?? 'null');
            output += createRow('link.displayText', link.displayText);
            output += '\n';
        });
        return output;
    }
    it('note bodies', () => {
        let output = '';
        AllCacheSampleData_1.AllMockDataNames.forEach((file) => {
            const tasksFile = (0, MockDataHelpers_1.getTasksFileFromMockData)(file);
            output += visualiseLinks(tasksFile.outlinksInBody, file);
        });
        (0, VerifyMarkdown_1.verifyMarkdown)(output);
    });
    it('properties', () => {
        // begin-snippet: AllMockDataNames
        let output = '';
        AllCacheSampleData_1.AllMockDataNames.forEach((file) => {
            const tasksFile = (0, MockDataHelpers_1.getTasksFileFromMockData)(file);
            output += visualiseLinks(tasksFile.outlinksInProperties, file);
        });
        (0, VerifyMarkdown_1.verifyMarkdown)(output);
        // end-snippet
    });
    it('outlinks', () => {
        let output = '';
        AllCacheSampleData_1.AllMockDataNames.forEach((file) => {
            const tasksFile = (0, MockDataHelpers_1.getTasksFileFromMockData)(file);
            output += visualiseLinks(tasksFile.outlinks, file);
        });
        (0, VerifyMarkdown_1.verifyMarkdown)(output);
    });
});
//# sourceMappingURL=Link.test.js.map