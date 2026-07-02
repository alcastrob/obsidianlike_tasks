"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryRenderer = void 0;
const obsidian_1 = require("obsidian");
const obsidian_2 = require("obsidian");
const GlobalQuery_1 = require("../Config/GlobalQuery");
const QueryRendererHelper_1 = require("../Query/QueryRendererHelper");
const File_1 = require("../Obsidian/File");
const TaskModal_1 = require("../Obsidian/TaskModal");
const TasksFile_1 = require("../Scripting/TasksFile");
const DateFallback_1 = require("../DateTime/DateFallback");
const QueryResultsRenderer_1 = require("./QueryResultsRenderer");
const TaskLineRenderer_1 = require("./TaskLineRenderer");
/**
 * `QueryRenderer` is responsible for rendering queries in Markdown code blocks
 * annotated with the 'tasks' processor.
 *
 * It manages the initialization of query rendering related tasks, processing metadata,
 * and adding rendered content to the DOM.
 */
class QueryRenderer {
    constructor({ plugin, events }) {
        this.addQueryRenderChild = this._addQueryRenderChild.bind(this);
        this.app = plugin.app;
        this.plugin = plugin;
        this.events = events;
        plugin.registerMarkdownCodeBlockProcessor('tasks', (source, el, ctx) => {
            plugin.app.workspace.onLayoutReady(async () => {
                await this.addQueryRenderChild(source, el, ctx);
            });
        });
    }
    async _addQueryRenderChild(source, element, context) {
        // Issues with this first implementation of accessing properties in query files:
        //  - If the file was created in the last second or two, any CachedMetadata is probably
        //    not yet available, so empty.
        //  - Multi-line properties are supported, but they cannot contain
        //    continuation lines.
        const app = this.app;
        const filePath = context.sourcePath;
        const tasksFile = QueryRenderer.getTasksFile(app, filePath);
        const queryRenderChild = new QueryRenderChild({
            app: app,
            plugin: this.plugin,
            events: this.events,
            container: element,
            source,
            tasksFile,
        });
        context.addChild(queryRenderChild);
        queryRenderChild.load();
    }
    static getTasksFile(app, filePath) {
        const tFile = app.vault.getFileByPath(filePath);
        let fileCache = null;
        if (tFile) {
            fileCache = app.metadataCache.getFileCache(tFile);
        }
        return new TasksFile_1.TasksFile(filePath, fileCache ?? {});
    }
}
exports.QueryRenderer = QueryRenderer;
/**
 * A class that extends {@link MarkdownRenderChild} to render query results dynamically in Obsidian.
 *
 * This class listens to various Obsidian events such as metadata updates, cache changes, and
 * file renames, and re-renders query results when relevant data changes. It supports dynamic
 * updates, including reloading query results at midnight to ensure accurate relative date queries.
 *
 * The generation of HTML to render task lines is done by {@link QueryResultsRenderer}.
 */
class QueryRenderChild extends obsidian_1.MarkdownRenderChild {
    constructor({ app, plugin, events, container, source, tasksFile, }) {
        super(container);
        this.isCacheChangedSinceLastRedraw = false;
        this.observer = null;
        this.isRendering = false;
        this.app = app;
        this.plugin = plugin;
        this.events = events;
        this.queryResultsRenderer = new QueryResultsRenderer_1.QueryResultsRenderer(this.containerEl.className, source, tasksFile, (app, markdown, el, sourcePath, component) => obsidian_1.MarkdownRenderer.render(app, markdown, el, sourcePath, component), this, this.app, TaskLineRenderer_1.TaskLineRenderer.obsidianMarkdownRenderer, {
            allTasks: () => this.plugin.getTasks(),
            allMarkdownFiles: () => this.app.vault.getMarkdownFiles(),
            backlinksClickHandler: createBacklinksClickHandler(this.app),
            backlinksMousedownHandler: createBacklinksMousedownHandler(this.app),
            editTaskPencilClickHandler: createEditTaskPencilClickHandler(this.app, async () => await this.plugin.saveSettings()),
        });
        this.queryResultsRenderer.query.debug('[render] QueryRenderChild.constructor() entered');
        this.debouncedRenderFn = (0, obsidian_1.debounce)((params) => this.render(params), 300, true);
    }
    onload() {
        this.queryResultsRenderer.query.debug('[render] QueryRenderChild.onload() entered');
        // Process the current cache state:
        this.events.triggerRequestCacheUpdate(this.render.bind(this));
        // Listen to future changes:
        this.renderEventRef = this.events.onCacheUpdate(this.render.bind(this));
        this.reloadSearchResultsEventRef = this.events.onReloadOpenSearchResults(this.rereadQueryFromFile.bind(this));
        this.reloadQueryAtMidnight();
        this.registerEvent(this.app.metadataCache.on('changed', (sourceFile, _data, fileCache) => {
            const filePath = sourceFile.path;
            if (filePath !== this.queryResultsRenderer.filePath) {
                // We get notified of edits to all files, and are only interested in the
                // file where our query is.
                return;
            }
            this.handleMetadataOrFilePathChange(filePath, fileCache);
        }));
        this.registerEvent(this.app.vault.on('rename', (tFile, oldPath) => {
            if (oldPath !== this.queryResultsRenderer.filePath) {
                return;
            }
            let fileCache = null;
            if (tFile && tFile instanceof obsidian_1.TFile) {
                fileCache = this.app.metadataCache.getFileCache(tFile);
            }
            this.handleMetadataOrFilePathChange(tFile.path, fileCache);
        }));
        this.setupVisibilityObserver();
    }
    setupVisibilityObserver() {
        if (this.observer) {
            return;
        }
        this.observer = new IntersectionObserver(([entry]) => {
            if (!this.containerEl.isShown()) {
                return;
            }
            // entry describes a single visibility change for the specific element we are observing.
            // It is safe to assume `entry.target === this.containerEl` here.
            if (!entry.isIntersecting) {
                return;
            }
            this.queryResultsRenderer.query.debug(`[render][observer] Became visible, isCacheChangedSinceLastRedraw:${this.isCacheChangedSinceLastRedraw}`);
            if (this.isCacheChangedSinceLastRedraw) {
                this.queryResultsRenderer.query.debug('[render][observer] ... updating search results');
                this.render({ tasks: this.plugin.getTasks(), state: this.plugin.getState() })
                    .then()
                    .catch((e) => console.error(e));
            }
        });
        this.observer.observe(this.containerEl);
    }
    handleMetadataOrFilePathChange(filePath, fileCache) {
        const oldTasksFile = this.queryResultsRenderer.tasksFile;
        const newTasksFile = new TasksFile_1.TasksFile(filePath, fileCache ?? {});
        // Has anything changed which might change the query results?
        const differentPath = oldTasksFile.path !== newTasksFile.path;
        const differentFrontmatter = !oldTasksFile.rawFrontmatterIdenticalTo(newTasksFile);
        const queryNeedsReloading = differentPath || differentFrontmatter;
        if (queryNeedsReloading) {
            this.queryResultsRenderer.setTasksFile(newTasksFile);
            this.events.triggerRequestCacheUpdate(this.render.bind(this));
        }
    }
    onunload() {
        this.queryResultsRenderer.query.debug('[render] QueryRenderChild.onunload() entered');
        if (this.renderEventRef !== undefined) {
            this.events.off(this.renderEventRef);
        }
        if (this.reloadSearchResultsEventRef !== undefined) {
            this.events.off(this.reloadSearchResultsEventRef);
        }
        if (this.queryReloadTimeout !== undefined) {
            clearTimeout(this.queryReloadTimeout);
        }
        // Cancel any pending debounced renders
        this.debouncedRenderFn.cancel();
        this.observer?.disconnect();
        this.observer = null;
    }
    /**
     * Reloads the query after midnight to update results from relative date queries.
     *
     * For example, the query `due today` changes every day. This makes sure that all query results
     * are re-rendered after midnight every day to ensure up-to-date results without having to
     * reload obsidian. Creating a new query object from the source re-applies the relative dates
     * to "now".
     */
    reloadQueryAtMidnight() {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const now = new Date();
        const millisecondsToMidnight = midnight.getTime() - now.getTime();
        this.queryReloadTimeout = setTimeout(() => {
            this.queryResultsRenderer.query = (0, QueryRendererHelper_1.getQueryForQueryRenderer)(this.queryResultsRenderer.source, GlobalQuery_1.GlobalQuery.getInstance(), this.queryResultsRenderer.tasksFile);
            // Process the current cache state:
            this.events.triggerRequestCacheUpdate(this.render.bind(this));
            this.reloadQueryAtMidnight();
        }, millisecondsToMidnight + 1000); // Add buffer to be sure to run after midnight.
    }
    debouncedRender(params) {
        this.debouncedRenderFn(params);
    }
    async render({ tasks, state }) {
        // We got here because the Cache reported a change in at least one task in the vault.
        // So note that any results we have already drawn are now out-of-date:
        this.isCacheChangedSinceLastRedraw = true;
        requestAnimationFrame(async () => {
            if (this.isRendering) {
                return;
            }
            this.isRendering = true;
            // We have to wrap the rendering inside requestAnimationFrame() to ensure
            // that we get correct values for isConnected and isShown().
            if (!this.containerEl.isConnected) {
                // Example reasons why we might not be "connected":
                // - This Tasks query block is contained within another plugin's code block,
                //   such as a Tabs plugin. The file is closed and that plugin has not correctly
                //   tidied up, so we have not been deleted.
                this.queryResultsRenderer.query.debug('[render] Ignoring redraw request, as code block is not connected.');
                this.isRendering = false;
                return;
            }
            if (!this.containerEl.isShown()) {
                // Example reasons why we might not be "shown":
                // - We are in a collapsed callout.
                // - We are in a note which is obscured by another note.
                // - We are in a Tabs plugin, in a tab which is not at the front.
                // - The user has not yet scrolled to this code block's position in the file.
                this.queryResultsRenderer.query.debug('[render] Ignoring redraw request, as code block is not shown.');
                this.isRendering = false;
                return;
            }
            await this.renderResults(state, tasks);
            // Our results are now up-to-date:
            this.isCacheChangedSinceLastRedraw = false;
            this.isRendering = false;
        });
    }
    async renderResults(state, tasks) {
        const content = (0, TaskLineRenderer_1.createAndAppendElement)('div', this.containerEl);
        await this.queryResultsRenderer.render(state, tasks, content);
        this.containerEl.firstChild?.replaceWith(content);
    }
    rereadQueryFromFile() {
        this.queryResultsRenderer.rereadQueryFromFile();
        this.isCacheChangedSinceLastRedraw = true;
        this.debouncedRender({ tasks: this.plugin.getTasks(), state: this.plugin.getState() });
    }
}
function createEditTaskPencilClickHandler(app, onSaveSettings) {
    return function editTaskPencilClickHandler(event, task, allTasks) {
        event.preventDefault();
        const onSubmit = async (updatedTasks) => {
            await (0, File_1.replaceTaskWithTasks)({
                originalTask: task,
                newTasks: DateFallback_1.DateFallback.removeInferredStatusIfNeeded(task, updatedTasks),
            });
        };
        // Need to create a new instance every time, as cursor/task can change.
        const taskModal = new TaskModal_1.TaskModal({
            app,
            task,
            onSaveSettings,
            onSubmit,
            allTasks,
        });
        taskModal.open();
    };
}
function createBacklinksClickHandler(app) {
    return async function backlinksClickHandler(ev, task) {
        const result = await (0, File_1.getTaskLineAndFile)(task, app.vault);
        if (result) {
            const [line, file] = result;
            const leaf = app.workspace.getLeaf(obsidian_2.Keymap.isModEvent(ev));
            // When the corresponding task has been found,
            // suppress the default behavior of the mouse click event
            // (which would interfere e.g. if the query is rendered inside a callout).
            ev.preventDefault();
            // Instead of the default behavior, open the file with the required line highlighted.
            await leaf.openFile(file, { eState: { line } });
        }
    };
}
function createBacklinksMousedownHandler(app) {
    return async function backlinksMousedownHandler(ev, task) {
        // Open in a new tab on middle-click.
        // This distinction is not available in the 'click' event, so we handle the 'mousedown' event
        // solely for this.
        // (for regular left-click we prefer the 'click' event, and not to just do everything here, because
        // the 'click' event is more generic for touch devices etc.)
        if (ev.button === 1) {
            ev.preventDefault();
            const result = await (0, File_1.getTaskLineAndFile)(task, app.vault);
            if (result) {
                const [line, file] = result;
                const leaf = app.workspace.getLeaf('tab');
                await leaf.openFile(file, { eState: { line: line } });
            }
        }
    };
}
//# sourceMappingURL=QueryRenderer.js.map