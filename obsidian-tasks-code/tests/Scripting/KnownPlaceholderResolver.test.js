"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const KnownPlaceholderResolver_1 = require("../../src/Scripting/KnownPlaceholderResolver");
const QueryContext_1 = require("../../src/Scripting/QueryContext");
const MockDataHelpers_1 = require("../TestingTools/MockDataHelpers");
describe('KnownPlaceholderResolver', () => {
    const tasksFile = (0, MockDataHelpers_1.getTasksFileFromMockData)('yaml_all_property_types_populated');
    const queryContext = (0, QueryContext_1.makeQueryContext)(tasksFile);
    function expectResolvedPlaceholderToBe(placeholder, expectedValue) {
        const resolution = (0, KnownPlaceholderResolver_1.resolveKnownPlaceholder)(placeholder, queryContext);
        expect(resolution.resolved).toEqual(true);
        if (resolution.resolved) {
            expect(resolution.value).toEqual(expectedValue);
        }
    }
    function expectPlaceholderNotToBeResolved(placeholder) {
        expect((0, KnownPlaceholderResolver_1.resolveKnownPlaceholder)(placeholder, queryContext)).toEqual({
            resolved: false,
        });
    }
    describe('query.file properties', () => {
        it('resolves query.file.path', () => {
            expectResolvedPlaceholderToBe('query.file.path', 'Test Data/yaml_all_property_types_populated.md');
        });
        it('resolves query.file.pathWithoutExtension', () => {
            expectResolvedPlaceholderToBe('query.file.pathWithoutExtension', 'Test Data/yaml_all_property_types_populated');
        });
        it('resolves query.file.root', () => {
            expectResolvedPlaceholderToBe('query.file.root', 'Test Data/');
        });
        it('resolves query.file.folder', () => {
            expectResolvedPlaceholderToBe('query.file.folder', 'Test Data/');
        });
        it('resolves query.file.filename', () => {
            expectResolvedPlaceholderToBe('query.file.filename', 'yaml_all_property_types_populated.md');
        });
        it('resolves query.file.filenameWithoutExtension', () => {
            expectResolvedPlaceholderToBe('query.file.filenameWithoutExtension', 'yaml_all_property_types_populated');
        });
        it('resolves query.file.outlinksInProperties', () => {
            expectResolvedPlaceholderToBe('query.file.outlinksInProperties', queryContext.query.file.outlinksInProperties);
        });
        it('resolves query.file.outlinksInBody', () => {
            expectResolvedPlaceholderToBe('query.file.outlinksInBody', queryContext.query.file.outlinksInBody);
        });
        it('resolves query.file.outlinks', () => {
            expectResolvedPlaceholderToBe('query.file.outlinks', queryContext.query.file.outlinks);
        });
    });
    describe('query.file property methods', () => {
        it('resolves query.file.hasProperty() with single quotes', () => {
            expectResolvedPlaceholderToBe("query.file.hasProperty('non_existent_property')", false);
        });
        it('resolves query.file.hasProperty() with double quotes', () => {
            expectResolvedPlaceholderToBe('query.file.hasProperty("sample_link_property")', true);
        });
        it('resolves query.file.property() with single quotes', () => {
            expectResolvedPlaceholderToBe("query.file.property('non_existent_property')", null);
        });
        it('resolves query.file.property() with double quotes', () => {
            expectResolvedPlaceholderToBe('query.file.property("sample_number_property")', 246);
        });
    });
    describe('unsupported expressions', () => {
        it('does not resolve arbitrary expressions', () => {
            expectPlaceholderNotToBeResolved('4 + 6');
        });
        it('does not resolve non-approved method calls', () => {
            expectPlaceholderNotToBeResolved('query.file.path.toUpperCase()');
        });
        it('does not resolve query.file.property() with an expression argument', () => {
            expectPlaceholderNotToBeResolved("query.file.property('task_' + 'instruction')");
        });
        it('does not resolve unknown query.file properties', () => {
            expectPlaceholderNotToBeResolved('query.file.noSuchProperty');
        });
        it('does not resolve non-query placeholders', () => {
            expectPlaceholderNotToBeResolved('preset.this_file');
        });
    });
    describe('formatting', () => {
        it('ignores whitespace around placeholder expression', () => {
            expectResolvedPlaceholderToBe(' query.file.path ', 'Test Data/yaml_all_property_types_populated.md');
        });
    });
});
//# sourceMappingURL=KnownPlaceholderResolver.test.js.map