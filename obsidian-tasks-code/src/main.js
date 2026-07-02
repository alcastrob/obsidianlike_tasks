"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
const i18n_1 = require("./i18n/i18n");
const Cache_1 = require("./Obsidian/Cache");
const Commands_1 = require("./Commands");
const GlobalQuery_1 = require("./Config/GlobalQuery");
const TasksEvents_1 = require("./Obsidian/TasksEvents");
const File_1 = require("./Obsidian/File");
const InlineRenderer_1 = require("./Obsidian/InlineRenderer");
const LivePreviewExtension_1 = require("./Obsidian/LivePreviewExtension");
const QueryRenderer_1 = require("./Renderer/QueryRenderer");
const Settings_1 = require("./Config/Settings");
const SettingsTab_1 = require("./Config/SettingsTab");
const StatusRegistry_1 = require("./Statuses/StatusRegistry");
const logging_1 = require("./lib/logging");
const EditorSuggestorPopup_1 = require("./Suggestor/EditorSuggestorPopup");
const StatusSettings_1 = require("./Config/StatusSettings");
const Api_1 = require("./Api");
const GlobalFilter_1 = require("./Config/GlobalFilter");
const QueryFileDefaults_1 = require("./Query/QueryFileDefaults");
const LinkResolver_1 = require("./Task/LinkResolver");
const ObsidianLocalStorageProvider_1 = require("./Config/ObsidianLocalStorageProvider");
const EnableJsInTasksQueries_1 = require("./Config/EnableJsInTasksQueries");
class TasksPlugin extends obsidian_1.Plugin {
    get apiV1() {
        return (0, Api_1.tasksApiV1)(this);
    }
    async onload() {
        await (0, i18n_1.initializeI18n)();
        logging_1.logging.registerConsoleLogger();
        (0, logging_1.log)('info', i18n_1.i18n.t('main.loadingPlugin', { name: this.manifest.name, version: this.manifest.version }));
        await this.loadSettings();
        EnableJsInTasksQueries_1.EnableJsInTasksQueries.initialise(new ObsidianLocalStorageProvider_1.ObsidianLocalStorageProvider(this.app));
        // Configure logging.
        const { loggingOptions } = (0, Settings_1.getSettings)();
        logging_1.logging.configure(loggingOptions);
        // Configure LinkResolver.getInstance().resolve(), to ensure that links know where Obsidian will resolve them to:
        LinkResolver_1.LinkResolver.getInstance().setGetFirstLinkpathDestFn((link, sourcePath) => {
            const linkpath = (0, obsidian_1.getLinkpath)(link.link);
            const tFile = this.app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath);
            return tFile ? tFile.path : null;
        });
        const events = new TasksEvents_1.TasksEvents({ obsidianEvents: this.app.workspace });
        this.addSettingTab(new SettingsTab_1.SettingsTab({ plugin: this, events }));
        (0, File_1.initializeFile)({
            metadataCache: this.app.metadataCache,
            vault: this.app.vault,
            workspace: this.app.workspace,
        });
        // Load configured status types.
        await this.loadTaskStatuses();
        this.cache = new Cache_1.Cache({
            metadataCache: this.app.metadataCache,
            vault: this.app.vault,
            workspace: this.app.workspace,
            events,
        });
        this.inlineRenderer = new InlineRenderer_1.InlineRenderer({ plugin: this, app: this.app });
        this.queryRenderer = new QueryRenderer_1.QueryRenderer({ plugin: this, events });
        // Update types.json.
        this.setObsidianPropertiesTypes();
        this.registerEditorExtension((0, LivePreviewExtension_1.newLivePreviewExtension)(this));
        this.registerEditorSuggest(new EditorSuggestorPopup_1.EditorSuggestor(this.app, (0, Settings_1.getSettings)(), this));
        new Commands_1.Commands({ plugin: this });
    }
    async loadTaskStatuses() {
        const { statusSettings } = (0, Settings_1.getSettings)();
        StatusSettings_1.StatusSettings.applyToStatusRegistry(statusSettings, StatusRegistry_1.StatusRegistry.getInstance());
    }
    onunload() {
        (0, logging_1.log)('info', i18n_1.i18n.t('main.unloadingPlugin', { name: this.manifest.name, version: this.manifest.version }));
        this.cache?.unload();
    }
    async loadSettings() {
        let newSettings = await this.loadData();
        (0, Settings_1.updateSettings)(newSettings);
        // Fetch the updated settings, in case the user has not yet edited the settings,
        // in which case newSettings is currently empty.
        newSettings = (0, Settings_1.getSettings)();
        GlobalFilter_1.GlobalFilter.getInstance().set(newSettings.globalFilter);
        GlobalFilter_1.GlobalFilter.getInstance().setRemoveGlobalFilter(newSettings.removeGlobalFilter);
        GlobalQuery_1.GlobalQuery.getInstance().set(newSettings.globalQuery);
        await this.loadTaskStatuses();
    }
    async saveSettings() {
        await this.saveData((0, Settings_1.getSettings)());
    }
    getTasks() {
        if (this.cache === undefined) {
            return [];
        }
        else {
            return this.cache.getTasks();
        }
    }
    getState() {
        if (this.cache === undefined) {
            return Cache_1.State.Cold;
        }
        return this.cache.getState();
    }
    /**
     * Add {@link QueryFileDefaults} properties to the Obsidian vault's types.json file,
     * so that they are available via auto-complete in the File Properties panel.
     */
    setObsidianPropertiesTypes() {
        // Credit: this code based on ideas...
        // by:
        //      @SkepticMystic
        // in:
        //      https://github.com/SkepticMystic/breadcrumbs/blob/d380407678ce64f5668550d270b1035bc1a767f8/src/main.ts#L47-L64
        try {
            // @ts-expect-error TS2339: Property metadataTypeManager does not exist on type App
            const metadataTypeManager = this.app.metadataTypeManager;
            const all_properties = metadataTypeManager.getAllProperties();
            const defaults = new QueryFileDefaults_1.QueryFileDefaults();
            for (const field of defaults.allPropertyNamesSorted()) {
                const property_type = defaults.propertyType(field);
                if (all_properties[field]?.type === property_type) {
                    continue;
                }
                metadataTypeManager.setType(field, property_type);
            }
        }
        catch (error) {
            console.error('setObsidianPropertiesTypes error', error);
        }
    }
}
exports.default = TasksPlugin;
//# sourceMappingURL=main.js.map