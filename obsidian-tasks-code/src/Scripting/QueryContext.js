"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeQueryContext = makeQueryContext;
exports.makeQueryContextWithTasks = makeQueryContextWithTasks;
const Settings_1 = require("../Config/Settings");
/**
 * Create a {@link QueryContext} to represent a query in note at the given path in the {@link TasksFile}.
 *
 * Use this function if you do not have the array of {@link Task} objects in that.
 * @param tasksFile
 *
 * @see SearchInfo.queryContext
 * @see makeQueryContextWithTasks
 */
function makeQueryContext(tasksFile) {
    return makeQueryContextWithTasks(tasksFile, []);
}
/**
 * Create a {@link QueryContext} to represent a query in note at the given path in the {@link TasksFile},
 * and the tasks in the vault.
 *
 * Use this function if you do have the array of {@link Task} objects in that.
 * @param tasksFile
 * @param allTasks
 *
 * @see SearchInfo.queryContext
 * @see makeQueryContext
 */
function makeQueryContextWithTasks(tasksFile, allTasks) {
    return {
        query: {
            file: tasksFile,
            allTasks: allTasks,
            searchCache: {}, // Added for caching
        },
        preset: { ...(0, Settings_1.getSettings)().presets },
    };
}
//# sourceMappingURL=QueryContext.js.map