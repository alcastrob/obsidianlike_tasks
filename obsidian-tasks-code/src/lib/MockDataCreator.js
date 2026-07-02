"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockDataForTesting = getMockDataForTesting;
exports.saveMockDataForTesting = saveMockDataForTesting;
/**
 * This function can be used to save data that is used
 * when finding which line to toggle in a file.
 * @param originalTask
 * @param fileLines
 * @param listItemsCache
 *
 * @see saveMockDataForTesting
 */
function getMockDataForTesting(originalTask, fileLines, listItemsCache) {
    const allDataFromListItemCache = [];
    for (const listItemCache of listItemsCache) {
        const pos = listItemCache.position;
        const task = listItemCache.task;
        const dataFromListItemCache = {
            position: pos,
            task: task,
        };
        allDataFromListItemCache.push(dataFromListItemCache);
    }
    const mockTaskLocation = {
        path: originalTask.taskLocation.path,
        lineNumber: originalTask.taskLocation.lineNumber,
        sectionStart: originalTask.taskLocation.sectionStart,
        sectionIndex: originalTask.taskLocation.sectionIndex,
        precedingHeader: originalTask.taskLocation.precedingHeader,
    };
    return {
        taskData: {
            originalMarkdown: originalTask.originalMarkdown,
            taskLocation: mockTaskLocation,
        },
        fileData: {
            fileLines: fileLines,
        },
        cacheData: {
            listItemsCache: allDataFromListItemCache,
        },
    };
}
/**
 * Write the supplied data to the console, so it can be saved for use in testing.
 *
 * @param originalTask
 * @param fileLines
 * @param listItemsCache
 */
function saveMockDataForTesting(originalTask, fileLines, listItemsCache) {
    const everything = getMockDataForTesting(originalTask, fileLines, listItemsCache);
    console.error(`Inconsistent lines: SAVE THE OUTPUT
data:
${JSON.stringify(everything)}
`);
}
//# sourceMappingURL=MockDataCreator.js.map