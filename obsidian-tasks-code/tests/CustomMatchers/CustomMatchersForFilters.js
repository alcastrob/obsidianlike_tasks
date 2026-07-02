"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBeValid = toBeValid;
exports.toHaveExplanation = toHaveExplanation;
exports.toMatchTaskWithSearchInfo = toMatchTaskWithSearchInfo;
exports.toMatchTaskInTaskList = toMatchTaskInTaskList;
exports.toMatchTask = toMatchTask;
exports.toMatchTaskFromLine = toMatchTaskFromLine;
exports.toMatchTaskWithDescription = toMatchTaskWithDescription;
exports.toMatchTaskWithHeading = toMatchTaskWithHeading;
exports.toMatchTaskWithPath = toMatchTaskWithPath;
exports.toMatchTaskWithStatus = toMatchTaskWithStatus;
const jest_diff_1 = require("jest-diff");
const TestHelpers_1 = require("../TestingTools/TestHelpers");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const Status_1 = require("../../src/Statuses/Status");
const SearchInfo_1 = require("../../src/Query/SearchInfo");
function toBeValid(filter) {
    if (filter.filterFunction === undefined) {
        return {
            message: () => `unexpected null filter: check your instruction matches your filter class.
       Line is "${filter.instruction}
       Error message is "${filter.error}".`,
            pass: false,
        };
    }
    if (filter.error !== undefined) {
        return {
            message: () => `unexpected error message in filter: check your instruction matches your filter class
       Line is "${filter.instruction}`,
            pass: false,
        };
    }
    return {
        message: () => `filter is unexpectedly valid:
       Line is "${filter.instruction}`,
        pass: true,
    };
}
function toHaveExplanation(filter, expectedExplanation) {
    expect(filter.filter).toBeDefined();
    const received = filter.filter?.explanation.asString();
    const matches = received === expectedExplanation;
    if (!matches) {
        return {
            message: () => `unexpected incorrect explanation for "${filter.instruction}":\n` + (0, jest_diff_1.diff)(expectedExplanation, received),
            pass: false,
        };
    }
    return {
        message: () => `explanation for "${filter.instruction}" should not be: "${received}"`,
        pass: true,
    };
}
/**
 * Use this test matcher for any filters that need access to any data from the search.
 * @param filter
 * @param task
 * @param searchInfo
 */
function toMatchTaskWithSearchInfo(filter, task, searchInfo) {
    const matches = filter.filterFunction(task, searchInfo);
    if (!matches) {
        return {
            message: () => `unexpected failure to match
task:        "${task.toFileLineString()}"
with filter: "${filter.instruction}"`,
            pass: false,
        };
    }
    return {
        message: () => `filter should not have matched
task:        "${task.toFileLineString()}"
with filter: "${filter.instruction}"`,
        pass: true,
    };
}
function toMatchTaskInTaskList(filter, task, allTasks) {
    // Make sure that the task being filtered is actually in allTasks,
    // to guard against tests passing for the wrong reason:
    expect(allTasks.includes(task)).toEqual(true);
    return toMatchTaskWithSearchInfo(filter, task, SearchInfo_1.SearchInfo.fromAllTasks(allTasks));
}
function toMatchTask(filter, task) {
    return toMatchTaskWithSearchInfo(filter, task, SearchInfo_1.SearchInfo.fromAllTasks([task]));
}
function toMatchTaskFromLine(filter, line) {
    const task = (0, TestHelpers_1.fromLine)({
        line: line,
    });
    return toMatchTask(filter, task);
}
function toMatchTaskWithDescription(filter, description) {
    const builder = new TaskBuilder_1.TaskBuilder();
    const task = builder.description(description).build();
    return toMatchTask(filter, task);
}
function toMatchTaskWithHeading(filter, heading) {
    const builder = new TaskBuilder_1.TaskBuilder();
    const task = builder.precedingHeader(heading).build();
    return toMatchTask(filter, task);
}
function toMatchTaskWithPath(filter, path) {
    // Validate the path supplied. Obsidian vault paths do not begin with a '/',
    // so check for any unrealistic examples in tests:
    expect(path[0]).not.toBe('/');
    const builder = new TaskBuilder_1.TaskBuilder();
    const task = builder.path(path).build();
    return toMatchTask(filter, task);
}
function toMatchTaskWithStatus(filter, statusConfiguration) {
    const builder = new TaskBuilder_1.TaskBuilder();
    const task = builder.status(new Status_1.Status(statusConfiguration)).build();
    return toMatchTask(filter, task);
}
//# sourceMappingURL=CustomMatchersForFilters.js.map