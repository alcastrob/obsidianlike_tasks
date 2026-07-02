"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchInfo = void 0;
const QueryContext_1 = require("../Scripting/QueryContext");
/**
 * SearchInfo contains selected data passed in from the {@link Query} being executed.
 *
 * This is the Parameter Object pattern: it is a container for information that needs
 * to be passed down through multiple levels of code, without having to update
 * the function signatures of all the layers in between.
 */
class SearchInfo {
    constructor(tasksFile, allTasks) {
        this.tasksFile = tasksFile;
        this.allTasks = [...allTasks];
        this._queryContext = this.tasksFile ? (0, QueryContext_1.makeQueryContextWithTasks)(this.tasksFile, this.allTasks) : undefined;
    }
    static fromAllTasks(tasks) {
        return new SearchInfo(undefined, tasks);
    }
    get queryPath() {
        return this.tasksFile?.path ?? undefined;
    }
    /**
     * Construct a {@link QueryContext} from this, for use in the placeholder
     * facility and scripting code.
     *
     * @return A QueryContext, or undefined if the path to the query file is unknown.
     */
    queryContext() {
        return this._queryContext;
    }
}
exports.SearchInfo = SearchInfo;
//# sourceMappingURL=SearchInfo.js.map