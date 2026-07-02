"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const one_task_json_1 = __importDefault(require("../Obsidian/__test_data__/one_task.json"));
const MockDataLoader_1 = require("./MockDataLoader");
describe('MockDataLoader', () => {
    it('should return data for a known file', () => {
        const readFromFile = MockDataLoader_1.MockDataLoader.get('one_task');
        expect(readFromFile).toStrictEqual(one_task_json_1.default);
    });
    it('should cache the results and return the same object subsequently', () => {
        const copy1 = MockDataLoader_1.MockDataLoader.get('code_block_in_task');
        const copy2 = MockDataLoader_1.MockDataLoader.get('code_block_in_task');
        expect(copy1).toBe(copy2);
    });
    it('should provide the path to the JSON file', () => {
        const path = MockDataLoader_1.MockDataLoader.path('code_block_in_task');
        const expectedSubPath = 'tests/Obsidian/__test_data__/code_block_in_task.json';
        expect(path).toContain(expectedSubPath);
        expect(path.endsWith(expectedSubPath)).toBe(true);
    });
    it('should provide path to the Markdown file in the test vault', () => {
        const path = MockDataLoader_1.MockDataLoader.markdownPath('query_using_properties');
        expect(path).toEqual('Test Data/query_using_properties.md');
    });
    it('should locate loaded SimulatedFile from its CachedMetadata', () => {
        const data1 = MockDataLoader_1.MockDataLoader.get('yaml_tags_has_multiple_values');
        const data2 = MockDataLoader_1.MockDataLoader.get('yaml_tags_with_two_values_on_two_lines');
        expect(MockDataLoader_1.MockDataLoader.findCachedMetaData(data1.cachedMetadata)).toBe(data1);
        expect(MockDataLoader_1.MockDataLoader.findCachedMetaData(data2.cachedMetadata)).toBe(data2);
    });
    it('should detect CachedMetadata not previously loaded, even if it is a clone of a loaded file', () => {
        // begin-snippet: MockDataLoader.get
        const data1 = MockDataLoader_1.MockDataLoader.get('one_task');
        // end-snippet
        // typescript:S7784 Prefer `structuredClone(…)` over `JSON.parse(JSON.stringify(…))` to create a deep clone.
        // But structuredClone() is not available in Jest.
        const clonedMetadata = JSON.parse(JSON.stringify(data1.cachedMetadata)); // NOSONAR
        expect(clonedMetadata).toStrictEqual(data1.cachedMetadata);
        const t = () => {
            MockDataLoader_1.MockDataLoader.findCachedMetaData(clonedMetadata);
        };
        expect(t).toThrow(Error);
        expect(t).toThrowError('CachedMetadata not found in any loaded SimulatedFile');
    });
    it('should locate loaded SimulatedFile from its Frontmatter', () => {
        const data1 = MockDataLoader_1.MockDataLoader.get('yaml_tags_has_multiple_values');
        const data2 = MockDataLoader_1.MockDataLoader.get('yaml_tags_with_two_values_on_two_lines');
        expect(MockDataLoader_1.MockDataLoader.findFrontmatter(data1.cachedMetadata.frontmatter)).toBe(data1);
        expect(MockDataLoader_1.MockDataLoader.findFrontmatter(data2.cachedMetadata.frontmatter)).toBe(data2);
    });
    it('should detect call of findFrontmatter() with unknown Frontmatter', () => {
        const t = () => {
            MockDataLoader_1.MockDataLoader.findFrontmatter({});
        };
        expect(t).toThrow(Error);
        expect(t).toThrowError('FrontMatterCache not found in any loaded SimulatedFile');
    });
    it('should locate loaded SimulatedFile from its path', () => {
        const data1 = MockDataLoader_1.MockDataLoader.get('callout');
        const data2 = MockDataLoader_1.MockDataLoader.get('no_yaml');
        expect(MockDataLoader_1.MockDataLoader.findDataFromMarkdownPath('Test Data/callout.md')).toBe(data1);
        expect(MockDataLoader_1.MockDataLoader.findDataFromMarkdownPath('Test Data/no_yaml.md')).toBe(data2);
    });
    it('should detect call of findDataFromMarkdownPath() with unknown path', () => {
        const t = () => {
            MockDataLoader_1.MockDataLoader.findDataFromMarkdownPath('Test Data/non-existent path.md');
        };
        expect(t).toThrow(Error);
        expect(t).toThrowError('Markdown path not found in any loaded SimulatedFile');
    });
});
//# sourceMappingURL=MockDataLoader.test.js.map