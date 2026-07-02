"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readTasksFromSimulatedFile = readTasksFromSimulatedFile;
exports.readAllTasksFromAllSimulatedFiles = readAllTasksFromAllSimulatedFiles;
exports.getMockDataAndReadTasks = getMockDataAndReadTasks;
const logging_1 = require("../../src/lib/logging");
const FileParser_1 = require("../../src/Obsidian/FileParser");
const MockDataLoader_1 = require("../TestingTools/MockDataLoader");
const TasksFileHelpers_1 = require("../TestingTools/TasksFileHelpers");
const AllCacheSampleData_1 = require("./AllCacheSampleData");
/**
 * Read tasks from Obsidian-specific data read from a JSON file in `tests/Obsidian/__test_data__`.
 *
 * @param {MockDataName} filename - Read from a JSON file in `tests/Obsidian/__test_data__`
 * @return {Task[]} The parsed tasks extracted from the file content.
 *
 * Example use:
 * ```typescript
 *         const tasks = readTasksFromSimulatedFile('numbered_list_items_with_paren');
 * ```
 *
 * For more info, see https://publish.obsidian.md/tasks-contributing/Testing/Using+Obsidian+API+in+tests.
 * @see readAllTasksFromAllSimulatedFiles
 */
function readTasksFromSimulatedFile(filename) {
    const testData = MockDataLoader_1.MockDataLoader.get(filename);
    const logger = logging_1.logging.getLogger('testCache');
    const fileParser = new FileParser_1.FileParser((0, TasksFileHelpers_1.createTestTasksFile)(testData.filePath, testData.cachedMetadata), testData.fileContents, testData.cachedMetadata.listItems, logger, errorReporter);
    return fileParser.parseFileContent();
}
/**
 * Read all tasks from Obsidian-specific data read from all JSON files in `tests/Obsidian/__test_data__`.
 *
 * For more info, see https://publish.obsidian.md/tasks-contributing/Testing/Using+Obsidian+API+in+tests.
 * @see readTasksFromSimulatedFile
 */
function readAllTasksFromAllSimulatedFiles() {
    return AllCacheSampleData_1.AllMockDataNames.flatMap((testDataName) => {
        return readTasksFromSimulatedFile(testDataName);
    });
}
function errorReporter() {
    return;
}
/**
 * Convenience wrapper around {@link readTasksFromSimulatedFile}, also returning the {@link SimulatedFile}.
 * @param name
 */
function getMockDataAndReadTasks(name) {
    const data = MockDataLoader_1.MockDataLoader.get(name);
    const tasks = readTasksFromSimulatedFile(name);
    return { data, tasks };
}
//# sourceMappingURL=SimulatedFile.js.map