"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownQueryResultsRenderer = void 0;
const QueryResultsRendererBase_1 = require("./QueryResultsRendererBase");
/**
 * @example
 *   const markdownRenderer = new MarkdownQueryResultsRenderer(getters);
 *   await markdownRenderer.renderQuery(State.Warm, allTasks);
 *   const markdown = markdownRenderer.markdown;
 *
 */
class MarkdownQueryResultsRenderer extends QueryResultsRendererBase_1.QueryResultsRendererBase {
    constructor(source, tasksFile, query) {
        super(source, tasksFile, query);
        this.markdownLines = [];
        this.taskIndentationLevel = 0;
    }
    get markdown() {
        return this.markdownLines.join('\n');
    }
    beginRender() {
        this.markdownLines.length = 0;
        this.taskIndentationLevel = 0;
    }
    renderSearchResultsHeader(_queryResult) {
        return;
    }
    renderSearchResultsFooter(_queryResult) {
        return;
    }
    renderLoadingMessage() {
        return;
    }
    renderExplanation(explanation) {
        if (explanation) {
            this.markdownLines.push(explanation);
        }
    }
    renderErrorMessage(errorMessage) {
        this.markdownLines.push(errorMessage);
    }
    beginTaskList() {
        this.taskIndentationLevel += 1;
    }
    endTaskList() {
        this.taskIndentationLevel -= 1;
        const isOutermostList = this.taskIndentationLevel === 0;
        if (isOutermostList) {
            this.addEmptyLine();
        }
    }
    addEmptyLine() {
        this.markdownLines.push('');
    }
    beginListItem() {
        return;
    }
    addTask(task, _taskIndex) {
        this.markdownLines.push(this.formatTask(task));
        return Promise.resolve();
    }
    /**
     * This is a duplicate of Task.toFileLineString() because tasks rendered in search results
     * do not necessarily have the same indentation and list markers as the source task lines.
     *
     * @param task
     */
    formatTask(task) {
        return `${this.listItemIndentation()}- [${task.status.symbol}] ${task.toString()}`;
    }
    addListItem(listItem, _listItemIndex) {
        this.markdownLines.push(this.formatListItem(listItem));
        return Promise.resolve();
    }
    /**
     * This is based on ListItem.toFileLineString() because tasks rendered in search results
     * do not necessarily have the same indentation and list markers as the source lines.
     *
     * @param listItem
     */
    formatListItem(listItem) {
        const statusCharacterToString = listItem.statusCharacter ? `[${listItem.statusCharacter}] ` : '';
        return `${this.listItemIndentation()}- ${statusCharacterToString}${listItem.description}`;
    }
    listItemIndentation() {
        const indentationLevel = Math.max(0, this.taskIndentationLevel - 1);
        return '    '.repeat(indentationLevel);
    }
    addGroupHeading(group) {
        const headingPrefix = '#'.repeat(Math.min(4 + group.nestingLevel, 6));
        this.markdownLines.push(`${headingPrefix} ${group.displayName}`);
        this.addEmptyLine();
        return Promise.resolve();
    }
}
exports.MarkdownQueryResultsRenderer = MarkdownQueryResultsRenderer;
//# sourceMappingURL=MarkdownQueryResultsRenderer.js.map