"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskGroupingTreeStorage = void 0;
/**
 * Storage used for the initial grouping together of tasks.
 *
 * The keys of the map are the names of the groups.
 * For example, one set of keys might be ['Folder Name/', 'File Name']
 * and the values would be all the matching Tasks from that file.
 *
 * This is an implementation detail of the task-grouping code, and does not need to
 * be understood in order to group tasks.
 */
class TaskGroupingTreeStorage extends Map {
}
exports.TaskGroupingTreeStorage = TaskGroupingTreeStorage;
//# sourceMappingURL=TaskGroupingTreeStorage.js.map