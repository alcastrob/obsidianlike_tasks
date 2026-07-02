"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDataLoader = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Utility class for loading and caching test data saved from Obsidian's cache.
 *
 * This class provides access to serialized Obsidian metadata and file content
 * from JSON files in the `tests/Obsidian/__test_data__` directory.
 *
 * Data is cached after first load to:
 *   - improve performance for repeated access,
 *   - (eventually) simplify the implementation of some of the mock functions in
 *     `tests/__mocks__/obsidian.ts`.
 */
class MockDataLoader {
    /**
     * Get test data for the specified mock data name.
     *
     * Data is loaded from the corresponding JSON file and cached for subsequent calls.
     * The same object instance is returned for multiple calls with the same name.
     *
     * @param testDataName - The name of the test data to load (corresponds to filename without extension)
     * @returns The simulated file data including cached metadata, file path, and content
     * @throws Error if the test data file is not found
     */
    static get(testDataName) {
        if (this.cache.has(testDataName)) {
            return this.cache.get(testDataName);
        }
        const filePath = this.path(testDataName);
        if (!fs_1.default.existsSync(filePath)) {
            throw new Error(`Test data not found: '${testDataName}'.`);
        }
        const data = JSON.parse(fs_1.default.readFileSync(filePath, 'utf8'));
        this.cache.set(testDataName, data);
        return data;
    }
    /**
     * Get the file system path to the JSON pickle file for the given test data name.
     *
     * @param testDataName - The name of the test data
     * @returns Absolute path to the corresponding JSON file in `__test_data__` directory
     */
    static path(testDataName) {
        return path_1.default.resolve(__dirname, `../Obsidian/__test_data__/${testDataName}.json`);
    }
    /**
     * Get the original Markdown file path in the test vault for the given test data name.
     *
     * @param _testDataName - The name of the test data (parameter prefixed with _ to indicate it's used in path construction)
     * @returns Path to the original Markdown file in the `Test Data/` directory
     */
    static markdownPath(_testDataName) {
        return `Test Data/${_testDataName}.md`;
    }
    /**
     * Find the {@link SimulatedFile} that contains the specified CachedMetadata.
     *
     * Searches through all cached {@link SimulatedFile} entries to find the one whose
     * cachedMetadata property is identical (by reference) to the provided value.
     *
     * @param cachedMetadata - The CachedMetadata object to search for
     * @returns The SimulatedFile containing the matching cachedMetadata
     * @throws Error if no matching SimulatedFile is found in the cache
     */
    static findCachedMetaData(cachedMetadata) {
        return this.findByPredicate((simulatedFile) => simulatedFile.cachedMetadata === cachedMetadata, 'CachedMetadata not found in any loaded SimulatedFile');
    }
    /**
     * Find the {@link SimulatedFile} that contains the specified FrontMatterCache.
     *
     * Searches through all cached {@link SimulatedFile} entries to find the one whose
     * cachedMetadata.frontmatter property is identical (by reference) to the provided value.
     * This is useful for reverse-lookup when you have a FrontMatterCache object and need
     * to find which file it came from.
     *
     * @param frontmatter - The FrontMatterCache object to search for (can be undefined)
     * @returns The SimulatedFile containing the matching frontmatter
     * @throws Error if no matching SimulatedFile is found in the cache
     */
    static findFrontmatter(frontmatter) {
        return this.findByPredicate((simulatedFile) => simulatedFile.cachedMetadata.frontmatter === frontmatter, 'FrontMatterCache not found in any loaded SimulatedFile. Did you supply TasksFile.frontmatter instead of TasksFile.cachedMetadata.frontmatter?');
    }
    /**
     * Find the {@link SimulatedFile} that matches the specified Markdown file path.
     *
     * Searches through all cached {@link SimulatedFile} entries to find the one whose
     * filePath property exactly matches the provided Markdown path. This enables
     * lookup of test data by the original file path from the test vault.
     *
     * @param markdownPath - The Markdown file path to search for (such as "Test Data/example.md")
     * @returns The SimulatedFile with the matching file path
     * @throws Error if no matching SimulatedFile is found in the cache
     */
    static findDataFromMarkdownPath(markdownPath) {
        return this.findByPredicate((simulatedFile) => simulatedFile.filePath === markdownPath, 'Markdown path not found in any loaded SimulatedFile');
    }
    /**
     * Helper method to find a SimulatedFile using a custom predicate function.
     *
     * @param predicate - Function that returns true when the desired SimulatedFile is found
     * @param errorMessage - Error message to throw if no matching SimulatedFile is found
     * @returns The first SimulatedFile that matches the predicate
     * @throws Error with the provided message if no match is found
     */
    static findByPredicate(predicate, errorMessage) {
        for (const simulatedFile of this.cache.values()) {
            if (predicate(simulatedFile)) {
                return simulatedFile;
            }
        }
        throw new Error(errorMessage);
    }
}
exports.MockDataLoader = MockDataLoader;
MockDataLoader.cache = new Map();
//# sourceMappingURL=MockDataLoader.js.map