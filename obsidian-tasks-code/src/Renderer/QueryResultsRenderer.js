"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryResultsRenderer = void 0;
const obsidian_1 = require("obsidian");
const GlobalQuery_1 = require("../Config/GlobalQuery");
const PerformanceTracker_1 = require("../lib/PerformanceTracker");
const Cache_1 = require("../Obsidian/Cache");
const DescriptionField_1 = require("../Query/Filter/DescriptionField");
const Query_1 = require("../Query/Query");
const QueryRendererHelper_1 = require("../Query/QueryRendererHelper");
const HtmlQueryResultsRenderer_1 = require("./HtmlQueryResultsRenderer");
const MarkdownQueryResultsRenderer_1 = require("./MarkdownQueryResultsRenderer");
const TaskLineRenderer_1 = require("./TaskLineRenderer");
/**
 * The `QueryResultsRenderer` class is responsible for rendering the results
 * of a query applied to a set of tasks.
 *
 * It handles the construction of task groupings and the application of visual styles.
 */
class QueryResultsRenderer {
    constructor(className, source, tasksFile, renderMarkdown, obsidianComponent, obsidianApp, textRenderer, htmlQueryRendererParameters) {
        this._filterString = '';
        this.source = source;
        this._tasksFile = tasksFile;
        // Store empty query result for now
        this.queryResult = new Query_1.Query('').applyQueryToTasks([]);
        this.filteredQueryResult = this.queryResult;
        // The engine is chosen on the basis of the code block language. Currently,
        // there is only the main engine for the plugin, this allows others to be
        // added later.
        switch (className) {
            case 'block-language-tasks':
                this.query = this.makeQueryFromSourceAndTasksFile();
                this.queryType = 'tasks';
                break;
            default:
                this.query = this.makeQueryFromSourceAndTasksFile();
                this.queryType = 'tasks';
                break;
        }
        this.renderMarkdown = renderMarkdown;
        this.obsidianComponent = obsidianComponent;
        this.obsidianApp = obsidianApp;
        this.textRenderer = textRenderer;
        this.htmlQueryRendererParameters = htmlQueryRendererParameters;
    }
    get filterString() {
        return this._filterString;
    }
    makeQueryFromSourceAndTasksFile() {
        return (0, QueryRendererHelper_1.getQueryForQueryRenderer)(this.source, GlobalQuery_1.GlobalQuery.getInstance(), this.tasksFile);
    }
    get tasksFile() {
        return this._tasksFile;
    }
    /**
     * Reload the query with new file information, such as to update query placeholders.
     * @param newFile
     */
    setTasksFile(newFile) {
        this._tasksFile = newFile;
        this.rereadQueryFromFile();
    }
    /**
     * Reads the query from the source file and tasks file.
     *
     * This is for when some change in the vault invalidates the current
     * Query object, and so it needs to be reloaded.
     *
     * For example, the user edited their Tasks plugin settings in some
     * way that changes how the query is interpreted, such as changing a
     * 'presets' definition.
     */
    rereadQueryFromFile() {
        this.query = this.makeQueryFromSourceAndTasksFile();
    }
    get filePath() {
        return this.tasksFile.path;
    }
    async render(state, tasks, content) {
        this.performSearch(tasks);
        this.addToolbar(content);
        await this.renderQueryResult(state, this.filteredQueryResult, content);
    }
    performSearch(tasks) {
        const measureSearch = new PerformanceTracker_1.PerformanceTracker(`Search: ${this.query.queryId} - ${this.filePath}`);
        measureSearch.start();
        this.queryResult = this.query.applyQueryToTasks(tasks);
        this.filterResults();
        measureSearch.finish();
    }
    async renderQueryResult(state, queryResult, content) {
        const measureRender = new PerformanceTracker_1.PerformanceTracker(`Render: ${this.query.queryId} - ${this.filePath}`);
        measureRender.start();
        const htmlRenderer = new HtmlQueryResultsRenderer_1.HtmlQueryResultsRenderer(this.renderMarkdown, this.obsidianComponent, this.obsidianApp, this.textRenderer, this.htmlQueryRendererParameters, this.source, this.tasksFile, this.query);
        htmlRenderer.content = content;
        await htmlRenderer.renderQuery(state, queryResult);
        measureRender.finish();
    }
    addToolbar(content) {
        if (this.query.queryLayoutOptions.hideToolbar) {
            return;
        }
        const toolbar = (0, TaskLineRenderer_1.createAndAppendElement)('div', content);
        toolbar.classList.add('plugin-tasks-toolbar');
        this.addSearchBox(toolbar, content);
        this.addCopyButton(toolbar);
    }
    addSearchBox(toolbar, content) {
        const label = (0, TaskLineRenderer_1.createAndAppendElement)('label', toolbar);
        (0, obsidian_1.setIcon)(label, 'lucide-filter');
        const searchBox = (0, TaskLineRenderer_1.createAndAppendElement)('input', label);
        searchBox.value = this._filterString;
        searchBox.placeholder = 'Filter by description...';
        (0, obsidian_1.setTooltip)(searchBox, 'Filter results');
        const doSearch = async () => {
            const filterString = searchBox.value;
            await this.applySearchBoxFilterAndRerender(filterString, content);
        };
        searchBox.addEventListener('input', (0, obsidian_1.debounce)(doSearch, 500, true));
    }
    async applySearchBoxFilterAndRerender(filterString, content) {
        this._filterString = filterString;
        this.filterResults();
        // We want to retain the Toolbar, to not lose the cursor position in the search string.
        // But we need to delete any pre-existing headings, tasks and task count.
        // The following while loop relies on the Toolbar being the first element.
        while (content.firstElementChild !== content.lastElementChild) {
            const lastChild = content.lastChild;
            if (lastChild === null) {
                break;
            }
            lastChild.remove();
        }
        await this.renderQueryResult(Cache_1.State.Warm, this.filteredQueryResult, content);
    }
    filterResults() {
        const { filter, error } = new DescriptionField_1.DescriptionField().createFilterOrErrorMessage('description includes ' + this._filterString);
        if (error) {
            // If we can't create a filter, just silently show all the matching tasks
            this.filteredQueryResult = this.queryResult;
            return;
        }
        this.filteredQueryResult = this.queryResult.applyFilter(filter);
    }
    addCopyButton(toolbar) {
        const copyButton = (0, TaskLineRenderer_1.createAndAppendElement)('button', toolbar);
        (0, obsidian_1.setIcon)(copyButton, 'lucide-copy');
        (0, obsidian_1.setTooltip)(copyButton, 'Copy results');
        copyButton.addEventListener('click', async () => {
            const markdown = await this.resultsAsMarkdown();
            await navigator.clipboard.writeText(markdown);
            new obsidian_1.Notice('Results copied to clipboard');
        });
    }
    async resultsAsMarkdown() {
        const markdownRenderer = new MarkdownQueryResultsRenderer_1.MarkdownQueryResultsRenderer(this.source, this.tasksFile, this.query);
        await markdownRenderer.renderQuery(Cache_1.State.Warm, this.filteredQueryResult);
        return markdownRenderer.markdown;
    }
}
exports.QueryResultsRenderer = QueryResultsRenderer;
//# sourceMappingURL=QueryResultsRenderer.js.map