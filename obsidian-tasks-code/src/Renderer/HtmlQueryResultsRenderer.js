"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlQueryResultsRenderer = void 0;
const Settings_1 = require("../Config/Settings");
const Postponer_1 = require("../DateTime/Postponer");
const QueryLayout_1 = require("../Layout/QueryLayout");
const TaskLayout_1 = require("../Layout/TaskLayout");
const PostponeMenu_1 = require("../ui/Menus/PostponeMenu");
const TaskEditingMenu_1 = require("../ui/Menus/TaskEditingMenu");
const QueryResultsRendererBase_1 = require("./QueryResultsRendererBase");
const TaskLineRenderer_1 = require("./TaskLineRenderer");
/**
 * HTML-specific implementation of {@link QueryResultsRendererBase} abstract class.
 *
 * @example
 *   this.htmlRenderer.content = content;
 *   await this.htmlRenderer.renderQuery(state, tasks);
 */
class HtmlQueryResultsRenderer extends QueryResultsRendererBase_1.QueryResultsRendererBase {
    constructor(renderMarkdown, obsidianComponent, obsidianApp, textRenderer, htmlQueryRendererParameters, source, tasksFile, query) {
        super(source, tasksFile, query);
        // document.createElement() creates dummy elements that must be overwritten later
        // with the values of elements that will be rendered
        this.content = document.createElement('div');
        this.ulElementStack = [];
        this.lastLIElement = document.createElement('li');
        this.renderMarkdown = renderMarkdown;
        this.obsidianComponent = obsidianComponent;
        this.obsidianApp = obsidianApp;
        this.htmlQueryRendererParameters = htmlQueryRendererParameters;
        this.taskLineRenderer = new TaskLineRenderer_1.TaskLineRenderer({
            textRenderer: textRenderer,
            obsidianApp: obsidianApp,
            obsidianComponent: obsidianComponent,
            taskLayoutOptions: query.taskLayoutOptions,
            queryLayoutOptions: query.queryLayoutOptions,
        });
    }
    beginRender() {
        return;
    }
    renderSearchResultsHeader(queryResult) {
        if ((0, Settings_1.getSettings)().searchResults.taskCountLocation === 'top') {
            this.addTaskCount(queryResult);
        }
    }
    renderSearchResultsFooter(queryResult) {
        if ((0, Settings_1.getSettings)().searchResults.taskCountLocation !== 'top') {
            this.addTaskCount(queryResult);
        }
    }
    renderErrorMessage(errorMessage) {
        const container = (0, TaskLineRenderer_1.createAndAppendElement)('div', this.content);
        const pre = (0, TaskLineRenderer_1.createAndAppendElement)('pre', container);
        pre.textContent = `Tasks query: ${errorMessage}`;
    }
    renderLoadingMessage() {
        this.content.textContent = 'Loading Tasks ...';
    }
    renderExplanation(explanation) {
        const explanationsBlock = (0, TaskLineRenderer_1.createAndAppendElement)('pre', this.content);
        explanationsBlock.classList.add('plugin-tasks-query-explanation');
        explanationsBlock.textContent = explanation;
    }
    beginTaskList() {
        const isFirstTaskListInContainer = this.ulElementStack.length === 0;
        const taskListContainer = isFirstTaskListInContainer ? this.content : this.lastLIElement;
        const taskList = (0, TaskLineRenderer_1.createAndAppendElement)('ul', taskListContainer);
        taskList.classList.add('contains-task-list', 'plugin-tasks-query-result', ...new TaskLayout_1.TaskLayout(this.query.taskLayoutOptions).generateHiddenClasses(), ...new QueryLayout_1.QueryLayout(this.query.queryLayoutOptions).getHiddenClasses());
        const groupingAttribute = this.getGroupingAttribute();
        if (groupingAttribute && groupingAttribute.length > 0) {
            taskList.dataset.taskGroupBy = groupingAttribute;
        }
        this.ulElementStack.push(taskList);
    }
    endTaskList() {
        this.ulElementStack.pop();
    }
    beginListItem() {
        const taskList = this.currentULElement();
        this.lastLIElement = (0, TaskLineRenderer_1.createAndAppendElement)('li', taskList);
    }
    async addListItem(listItem, listItemIndex) {
        await this.taskLineRenderer.renderListItem(this.lastLIElement, listItem, listItemIndex);
    }
    async addTask(task, taskIndex) {
        const isFilenameUnique = this.isFilenameUnique({ task }, this.htmlQueryRendererParameters.allMarkdownFiles());
        const listItem = this.lastLIElement;
        await this.taskLineRenderer.renderTaskLine({
            li: listItem,
            task,
            taskIndex,
            isTaskInQueryFile: this.filePath === task.path,
            isFilenameUnique,
        });
        // Remove all footnotes. They don't re-appear in another document.
        const footnotes = listItem.querySelectorAll('[data-footnote-id]');
        footnotes.forEach((footnote) => footnote.remove());
        const extrasSpan = (0, TaskLineRenderer_1.createAndAppendElement)('span', listItem);
        extrasSpan.classList.add('task-extras');
        if (!this.query.queryLayoutOptions.hideUrgency) {
            this.addUrgency(extrasSpan, task);
        }
        const shortMode = this.query.queryLayoutOptions.shortMode;
        if (!this.query.queryLayoutOptions.hideBacklinks) {
            this.addBacklinks(extrasSpan, task, shortMode, isFilenameUnique);
        }
        if (!this.query.queryLayoutOptions.hideEditButton) {
            this.addEditButton(extrasSpan, task);
        }
        if (!this.query.queryLayoutOptions.hidePostponeButton && (0, Postponer_1.shouldShowPostponeButton)(task)) {
            this.addPostponeButton(extrasSpan, task, shortMode);
        }
        this.currentULElement().appendChild(listItem);
    }
    addEditButton(listItem, task) {
        const editTaskPencil = (0, TaskLineRenderer_1.createAndAppendElement)('a', listItem);
        editTaskPencil.classList.add('tasks-edit');
        editTaskPencil.title = 'Edit task';
        editTaskPencil.href = '#';
        editTaskPencil.addEventListener('click', (event) => this.htmlQueryRendererParameters.editTaskPencilClickHandler(event, task, this.htmlQueryRendererParameters.allTasks()));
    }
    addUrgency(listItem, task) {
        const text = new Intl.NumberFormat().format(task.urgency);
        const span = (0, TaskLineRenderer_1.createAndAppendElement)('span', listItem);
        span.textContent = text;
        span.classList.add('tasks-urgency');
    }
    async addGroupHeading(group) {
        // Headings nested to 2 or more levels are all displayed with 'h6:
        let header = 'h6';
        if (group.nestingLevel === 0) {
            header = 'h4';
        }
        else if (group.nestingLevel === 1) {
            header = 'h5';
        }
        const headerEl = (0, TaskLineRenderer_1.createAndAppendElement)(header, this.content);
        headerEl.classList.add('tasks-group-heading');
        if (this.obsidianComponent === null) {
            headerEl.textContent = 'For test purposes: ' + group.displayName;
            return;
        }
        await this.renderMarkdown(this.obsidianApp, group.displayName, headerEl, this.tasksFile.path, this.obsidianComponent);
    }
    addBacklinks(listItem, task, shortMode, isFilenameUnique) {
        const backLink = (0, TaskLineRenderer_1.createAndAppendElement)('span', listItem);
        backLink.classList.add('tasks-backlink');
        if (!shortMode) {
            backLink.append(' (');
        }
        const link = (0, TaskLineRenderer_1.createAndAppendElement)('a', backLink);
        link.rel = 'noopener';
        link.target = '_blank';
        link.classList.add('internal-link');
        if (shortMode) {
            link.classList.add('internal-link-short-mode');
        }
        let linkText;
        if (shortMode) {
            linkText = ' 🔗';
        }
        else {
            linkText = task.getLinkText({ isFilenameUnique }) ?? '';
        }
        link.text = linkText;
        // Go to the line the task is defined at
        link.addEventListener('click', async (ev) => {
            await this.htmlQueryRendererParameters.backlinksClickHandler(ev, task);
        });
        link.addEventListener('mousedown', async (ev) => {
            await this.htmlQueryRendererParameters.backlinksMousedownHandler(ev, task);
        });
        if (!shortMode) {
            backLink.append(')');
        }
    }
    addPostponeButton(listItem, task, shortMode) {
        const amount = 1;
        const timeUnit = 'day';
        const buttonTooltipText = (0, Postponer_1.postponeButtonTitle)(task, amount, timeUnit);
        const button = (0, TaskLineRenderer_1.createAndAppendElement)('a', listItem);
        button.classList.add('tasks-postpone');
        if (shortMode) {
            button.classList.add('tasks-postpone-short-mode');
        }
        button.title = buttonTooltipText;
        button.addEventListener('click', async (ev) => {
            ev.preventDefault(); // suppress the default click behavior
            ev.stopPropagation(); // suppress further event propagation
            await PostponeMenu_1.PostponeMenu.postponeOnClickCallback(button, task, amount, timeUnit);
        });
        /** Open a context menu on right-click.
         */
        button.addEventListener('contextmenu', async (ev) => {
            (0, TaskEditingMenu_1.showMenu)(ev, new PostponeMenu_1.PostponeMenu(button, task));
        });
    }
    addTaskCount(queryResult) {
        if (!this.query.queryLayoutOptions.hideTaskCount) {
            const taskCount = (0, TaskLineRenderer_1.createAndAppendElement)('div', this.content);
            taskCount.classList.add('task-count');
            taskCount.textContent = queryResult.totalTasksCountDisplayText();
        }
    }
    isFilenameUnique({ task }, allMarkdownFiles) {
        // Will match the filename without extension (the file's "basename").
        const filenameMatch = task.path.match(/([^/]*)\..+$/i);
        if (filenameMatch === null) {
            return undefined;
        }
        const filename = filenameMatch[1];
        const allFilesWithSameName = allMarkdownFiles.filter((file) => {
            if (file.basename === filename) {
                // Found a file with the same name (it might actually be the same file, but we'll take that into account later.)
                return true;
            }
        });
        return allFilesWithSameName.length < 2;
    }
    getGroupingAttribute() {
        const groupingRules = [];
        for (const group of this.query.grouping) {
            groupingRules.push(group.property);
        }
        return groupingRules.join(',');
    }
    currentULElement() {
        return this.ulElementStack[this.ulElementStack.length - 1];
    }
}
exports.HtmlQueryResultsRenderer = HtmlQueryResultsRenderer;
//# sourceMappingURL=HtmlQueryResultsRenderer.js.map