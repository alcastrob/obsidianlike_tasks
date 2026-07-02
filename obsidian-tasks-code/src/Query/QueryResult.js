"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryResult = void 0;
const TaskGroups_1 = require("./Group/TaskGroups");
const SearchInfo_1 = require("./SearchInfo");
function taskCountPluralised(tasksCount) {
    return `task${tasksCount !== 1 ? 's' : ''}`;
}
class QueryResult {
    constructor(groups, totalTasksCountBeforeLimit, tasksFile) {
        this.totalTasksCountBeforeLimit = 0;
        this._searchErrorMessage = undefined;
        this.taskGroups = groups;
        this.totalTasksCountBeforeLimit = totalTasksCountBeforeLimit;
        this._tasksFile = tasksFile;
    }
    get searchErrorMessage() {
        return this._searchErrorMessage;
    }
    set searchErrorMessage(value) {
        this._searchErrorMessage = value;
    }
    get totalTasksCount() {
        return this.taskGroups.totalTasksCount();
    }
    totalTasksCountDisplayText() {
        const tasksCount = this.totalTasksCount;
        const tasksCountBeforeLimit = this.totalTasksCountBeforeLimit;
        if (tasksCount === tasksCountBeforeLimit) {
            return `${tasksCount} ${taskCountPluralised(tasksCount)}`;
        }
        else {
            return `${tasksCount} of ${tasksCountBeforeLimit} ${taskCountPluralised(tasksCountBeforeLimit)}`;
        }
    }
    get groups() {
        return this.taskGroups.groups;
    }
    static fromError(message) {
        const result = new QueryResult(new TaskGroups_1.TaskGroups([], [], SearchInfo_1.SearchInfo.fromAllTasks([])), 0, undefined);
        result._searchErrorMessage = message;
        return result;
    }
    /**
     * This doesn't support nested results and list items.
     * TODO reimplement this with {@link MarkdownQueryResultsRenderer}
     *
     */
    asMarkdown() {
        let markdown = '';
        markdown += this.taskGroups.groups // force line break
            .map((group) => this.toString(group))
            .join('');
        return markdown;
    }
    toString(group) {
        let output = '\n';
        for (const heading of group.groupHeadings) {
            // These headings mimic the behaviour of QueryRenderer,
            // which uses 'h4', 'h5' and 'h6' for nested groups.
            const headingPrefix = '#'.repeat(Math.min(4 + heading.nestingLevel, 6));
            output += `${headingPrefix} ${heading.displayName}\n\n`;
        }
        output += this.tasksAsStringOfLines(group.tasks);
        return output;
    }
    tasksAsStringOfLines(tasks) {
        let output = '';
        for (const task of tasks) {
            output += this.toFileLineString(task) + '\n';
        }
        return output;
    }
    /**
     * This is a duplicate of Task.toFileLineString() because tasks rendered in search results
     * do not necessarily have the same indentation and list markers as the source task lines.
     *
     * @param task
     */
    toFileLineString(task) {
        return `- [${task.status.symbol}] ${task.toString()}`;
    }
    /**
     * This is known to not work reliably for filters that use query.allTasks and query.file.*
     *
     * @param filter
     */
    applyFilter(filter) {
        if (this._searchErrorMessage) {
            return QueryResult.fromError(this._searchErrorMessage);
        }
        const queryResultTasks = this.taskGroups.groups.flatMap((group) => group.tasks);
        const searchInfo = new SearchInfo_1.SearchInfo(this._tasksFile, queryResultTasks);
        const filterFunction = (task) => filter.filterFunction(task, searchInfo);
        const filteredTasks = [...new Set(queryResultTasks.filter(filterFunction))];
        return new QueryResult(new TaskGroups_1.TaskGroups(this.taskGroups.groupers, filteredTasks, searchInfo), this.totalTasksCountBeforeLimit, this._tasksFile);
    }
}
exports.QueryResult = QueryResult;
//# sourceMappingURL=QueryResult.js.map