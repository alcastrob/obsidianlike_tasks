"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSupportGroupingWithProperty = toSupportGroupingWithProperty;
exports.groupHeadingsForTask = groupHeadingsForTask;
exports.groupHeadingsToBe = groupHeadingsToBe;
exports.toGroupTask = toGroupTask;
exports.toGroupTaskUsingSearchInfo = toGroupTaskUsingSearchInfo;
exports.toGroupTaskFromBuilder = toGroupTaskFromBuilder;
exports.toGroupTaskWithPath = toGroupTaskWithPath;
const jest_diff_1 = require("jest-diff");
const TaskGroups_1 = require("../../src/Query/Group/TaskGroups");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const SearchInfo_1 = require("../../src/Query/SearchInfo");
function toSupportGroupingWithProperty(field, property) {
    if (!field.supportsGrouping()) {
        return {
            message: () => `'${field.fieldName()}' field doesn't support grouping.`,
            pass: false,
        };
    }
    const fieldGrouper = field.createNormalGrouper();
    if (fieldGrouper.property !== property) {
        return {
            message: () => `'${field.fieldName()}' field grouper property set to '${fieldGrouper.property}', expected '${property}'.`,
            pass: false,
        };
    }
    return {
        message: () => `'${field.fieldName()}' field supports grouping, grouping property set to '${fieldGrouper.property}'.`,
        pass: true,
    };
}
/**
 * Collate all the headings obtained when grouping the tasks by the grouper
 * @param grouper
 * @param tasks
 * @param searchInfo
 */
function groupHeadingsForTask(grouper, tasks, searchInfo) {
    const groups = new TaskGroups_1.TaskGroups([grouper], tasks, searchInfo);
    const headings = [];
    groups.groups.forEach((taskGroup) => {
        taskGroup.groupHeadings.forEach((heading) => {
            headings.push(heading.displayName);
        });
    });
    return headings;
}
function groupHeadingsToBe({ grouper, tasks }, expectedGroupHeadings) {
    tasks.sort(() => Math.random() - 0.5);
    const groupHeadings = groupHeadingsForTask(grouper, tasks, SearchInfo_1.SearchInfo.fromAllTasks(tasks));
    const pass = groupHeadings.join() === expectedGroupHeadings.join();
    const message = () => pass
        ? `Group headings should not be\n${expectedGroupHeadings.join('\n')}`
        : `Group headings are not the same as expected: ${(0, jest_diff_1.diff)(expectedGroupHeadings, groupHeadings)}`;
    return {
        message,
        pass,
    };
}
/**
 * Test that applying the grouper to the task generates the expected group names.
 * @param grouper
 * @param task
 * @param expectedGroupNames
 */
function toGroupTask(grouper, task, expectedGroupNames) {
    const tasks = [task];
    const searchInfo = SearchInfo_1.SearchInfo.fromAllTasks(tasks);
    return toGroupTaskUsingSearchInfo(grouper, task, searchInfo, expectedGroupNames);
}
/**
 * Test that applying the grouper to the task, with the given SearchInfo, generates the expected group names.
 *
 * Unless the grouper needs access to the path to the query, use {@link toGroupTask} instead.
 *
 * @param grouper
 * @param task
 * @param searchInfo
 * @param expectedGroupNames
 */
function toGroupTaskUsingSearchInfo(grouper, task, searchInfo, expectedGroupNames) {
    if (grouper === undefined) {
        return {
            message: () => 'unexpected null grouper: check your instruction matches your filter class.',
            pass: false,
        };
    }
    expect(grouper.grouper(task, searchInfo)).toEqual(expectedGroupNames);
}
/**
 * Test that applying the grouper to the task created by the builder generates the expected group names.
 * @param grouper
 * @param taskBuilder
 * @param expectedGroupNames
 */
function toGroupTaskFromBuilder(grouper, taskBuilder, expectedGroupNames) {
    const task = taskBuilder.build();
    toGroupTask(grouper, task, expectedGroupNames);
}
/**
 * Test that applying the grouper to a task in the given file path generates the expected group names.
 * @param grouper
 * @param path
 * @param expectedGroupNames
 */
function toGroupTaskWithPath(grouper, path, expectedGroupNames) {
    const taskBuilder = new TaskBuilder_1.TaskBuilder().path(path);
    toGroupTaskFromBuilder(grouper, taskBuilder, expectedGroupNames);
}
//# sourceMappingURL=CustomMatchersForGrouping.js.map