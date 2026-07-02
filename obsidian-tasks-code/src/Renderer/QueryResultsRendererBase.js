"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryResultsRendererBase = void 0;
const GlobalFilter_1 = require("../Config/GlobalFilter");
const GlobalQuery_1 = require("../Config/GlobalQuery");
const Cache_1 = require("../Obsidian/Cache");
const QueryRendererHelper_1 = require("../Query/QueryRendererHelper");
const Task_1 = require("../Task/Task");
class QueryResultsRendererBase {
    constructor(source, tasksFile, query) {
        this.addedListItems = new Set();
        this.source = source;
        this.tasksFile = tasksFile;
        this.query = query;
    }
    get filePath() {
        return this.tasksFile.path;
    }
    async renderQuery(state, queryResult) {
        this.beginRender();
        // Don't log anything here, for any state, as it generates huge amounts of
        // console messages in large vaults, if Obsidian was opened with any
        // notes with tasks code blocks in Reading or Live Preview mode.
        const query = this.query;
        const error = query.error;
        if (state === Cache_1.State.Warm && error === undefined) {
            await this.renderQuerySearchResults(queryResult);
        }
        else if (error) {
            this.renderErrorMessage(error);
        }
        else {
            this.renderLoadingMessage();
        }
    }
    async renderQuerySearchResults(queryResult) {
        this.explainQuery();
        if (queryResult.searchErrorMessage !== undefined) {
            // There was an error in the search, for example due to a problem custom function.
            this.renderErrorMessage(queryResult.searchErrorMessage);
            return;
        }
        await this.renderSearchResults(queryResult);
    }
    explainQuery() {
        if (this.query.queryLayoutOptions.explainQuery) {
            const explanation = (0, QueryRendererHelper_1.explainResults)(this.source, GlobalFilter_1.GlobalFilter.getInstance(), GlobalQuery_1.GlobalQuery.getInstance(), this.tasksFile);
            this.renderExplanation(explanation);
        }
    }
    async renderSearchResults(queryResult) {
        this.renderSearchResultsHeader(queryResult);
        await this.addAllTaskGroups(queryResult.taskGroups);
        const totalTasksCount = queryResult.totalTasksCount;
        this.query.debug(`[render] ${totalTasksCount} tasks displayed`);
        this.renderSearchResultsFooter(queryResult);
    }
    async addAllTaskGroups(tasksSortedLimitedGrouped) {
        for (const group of tasksSortedLimitedGrouped.groups) {
            // If there were no 'group by' instructions, group.groupHeadings
            // will be empty, and no headings will be added.
            await this.addGroupHeadings(group.groupHeadings);
            this.addedListItems.clear();
            await this.addTaskList(group.tasks);
        }
    }
    async addTaskList(listItems) {
        this.beginTaskList();
        try {
            if (this.query.queryLayoutOptions.hideTree) {
                await this.addFlatTaskList(listItems);
            }
            else {
                await this.addTreeTaskList(listItems);
            }
        }
        finally {
            this.endTaskList();
        }
    }
    /**
     * Old-style rendering of tasks:
     * - What is rendered:
     *     - Only task lines that match the query are rendered, as a flat list
     * - The order that lines are rendered:
     *     - Tasks are rendered in the order specified in 'sort by' instructions and default sort order.
     * @param listItems
     * @private
     */
    async addFlatTaskList(listItems) {
        for (const [listItemIndex, listItem] of listItems.entries()) {
            if (listItem instanceof Task_1.Task) {
                this.beginListItem();
                await this.addTask(listItem, listItemIndex);
            }
        }
    }
    /** New-style rendering of tasks:
     *  - What is rendered:
     *      - Task lines that match the query are rendered, as a tree.
     *      - Currently, all child tasks and list items of the found tasks are shown,
     *        including any child tasks that did not match the query.
     *  - The order that lines are rendered:
     *      - The top-level/outermost tasks are sorted in the order specified in 'sort by'
     *        instructions and default sort order.
     *      - Child tasks (and list items) are shown in their original order in their Markdown file.
     * @param listItems
     * @private
     */
    async addTreeTaskList(listItems) {
        for (const [listItemIndex, listItem] of listItems.entries()) {
            if (this.alreadyAdded(listItem)) {
                continue;
            }
            if (this.willBeAddedLater(listItem, listItems)) {
                continue;
            }
            this.beginListItem();
            if (listItem instanceof Task_1.Task) {
                await this.addTask(listItem, listItemIndex);
            }
            else {
                await this.addListItem(listItem, listItemIndex);
            }
            await this.addChildren(listItem.children);
            // The children of this item will be added thanks to recursion and the fact that we always render all children currently
            this.addedListItems.add(listItem);
            // We think this code may be needed in future, we have been unable to write a failing test for it
            // for (const childTask of listItem.children) {
            //     this.addedListItems.add(childTask);
            // }
        }
    }
    willBeAddedLater(listItem, listItems) {
        const closestParentTask = listItem.findClosestParentTask();
        if (!closestParentTask) {
            return false;
        }
        if (!this.addedListItems.has(closestParentTask)) {
            // This task is a direct or indirect child of another task that we are waiting to draw,
            // so don't draw it yet, it will be done recursively later.
            if (listItems.includes(closestParentTask)) {
                return true;
            }
        }
        return false;
    }
    alreadyAdded(listItem) {
        return this.addedListItems.has(listItem);
    }
    async addChildren(children) {
        if (children.length > 0) {
            await this.addTaskList(children);
        }
    }
    /**
     * Display headings for a group of tasks.
     * @param groupHeadings - The headings to display. This can be an empty array,
     *                        in which case no headings will be added.
     * @private
     */
    async addGroupHeadings(groupHeadings) {
        for (const heading of groupHeadings) {
            await this.addGroupHeading(heading);
        }
    }
}
exports.QueryResultsRendererBase = QueryResultsRendererBase;
//# sourceMappingURL=QueryResultsRendererBase.js.map