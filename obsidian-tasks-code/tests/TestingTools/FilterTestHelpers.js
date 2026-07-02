"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testFilter = testFilter;
exports.testTaskFilter = testTaskFilter;
exports.testTaskFilterViaQuery = testTaskFilterViaQuery;
exports.shouldSupportFiltering = shouldSupportFiltering;
exports.booleanToEmoji = booleanToEmoji;
const Task_1 = require("../../src/Task/Task");
const Query_1 = require("../../src/Query/Query");
const TaskLocation_1 = require("../../src/Task/TaskLocation");
const SearchInfo_1 = require("../../src/Query/SearchInfo");
const TasksFileHelpers_1 = require("./TasksFileHelpers");
/**
 * Convenience function to test a Filter on a single Task
 *
 * @param filter - a FilterOrErrorMessage, which should have a valid Filter.
 * @param taskBuilder - a TaskBuilder, populated with the required values for the test. For example:
 *                          new TaskBuilder().startDate('2022-04-15')
 * @param expected true if the task should match the filter, and false otherwise.
 */
function testFilter(filter, taskBuilder, expected) {
    const task = taskBuilder.build();
    testTaskFilter(filter, task, expected);
}
/**
 * Convenience function to test a Filter on a single Task
 *
 * @param filter - a FilterOrErrorMessage, which should have a valid Filter.
 * @param task - the Task to filter.
 * @param expected true if the task should match the filter, and false otherwise.
 */
function testTaskFilter(filter, task, expected) {
    expect(filter.filterFunction).toBeDefined();
    expect(filter.error).toBeUndefined();
    expect(filter.filterFunction(task, SearchInfo_1.SearchInfo.fromAllTasks([task]))).toEqual(expected);
}
/**
 * Convenience function to test a Filter on a single Task
 *
 * This is to help with porting filter code out of Query and in to Field classes.
 * Unit tests can be first written using the Query class for filtering, and then
 * later updated to use testTaskFilter() instead
 *
 * @param filter - A string, such as 'priority is high'
 * @param task - the Task to filter
 * @param expected - true if the task should match the filter, and false otherwise.
 */
function testTaskFilterViaQuery(filter, task, expected) {
    // Arrange
    const query = new Query_1.Query(filter);
    const tasks = [task];
    // Act
    let filteredTasks = [...tasks];
    const searchInfo = SearchInfo_1.SearchInfo.fromAllTasks(tasks);
    query.filters.forEach((filter) => {
        filteredTasks = filteredTasks.filter((task) => filter.filterFunction(task, searchInfo));
    });
    const matched = filteredTasks.length === 1;
    // Assert
    expect(matched).toEqual(expected);
}
function shouldSupportFiltering(filters, allTaskLines, expectedResult) {
    // Arrange
    const query = new Query_1.Query(filters.join('\n'));
    const tasks = allTaskLines.map((taskLine) => Task_1.Task.fromLine({
        line: taskLine,
        taskLocation: TaskLocation_1.TaskLocation.fromUnknownPosition((0, TasksFileHelpers_1.createTestTasksFile)('')),
        fallbackDate: null, // For tests scheduled date needs to be set explicitly
    }));
    // Act
    let filteredTasks = [...tasks];
    const searchInfo = SearchInfo_1.SearchInfo.fromAllTasks(tasks);
    query.filters.forEach((filter) => {
        filteredTasks = filteredTasks.filter((task) => filter.filterFunction(task, searchInfo));
    });
    // Assert
    const filteredTaskLines = filteredTasks.map((task) => `- [ ] ${task.toString()}`);
    expect(filteredTaskLines).toMatchObject(expectedResult);
}
function booleanToEmoji(boolean) {
    return boolean ? '✅ true' : '❌ false';
}
//# sourceMappingURL=FilterTestHelpers.js.map