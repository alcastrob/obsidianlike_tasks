"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsTab = void 0;
const obsidian_1 = require("obsidian");
const StatusConfiguration_1 = require("../Statuses/StatusConfiguration");
const StatusRegistry_1 = require("../Statuses/StatusRegistry");
const Status_1 = require("../Statuses/Status");
const StatusRegistryReport_1 = require("../Statuses/StatusRegistryReport");
const i18n_1 = require("../i18n/i18n");
const Themes = __importStar(require("./Themes"));
const Settings_1 = require("./Settings");
const GlobalFilter_1 = require("./GlobalFilter");
const StatusSettings_1 = require("./StatusSettings");
const CustomStatusModal_1 = require("./CustomStatusModal");
const GlobalQuery_1 = require("./GlobalQuery");
const PresetsSettingsUI_1 = require("./PresetsSettingsUI");
const EnableJsInTasksQueries_1 = require("./EnableJsInTasksQueries");
class SettingsTab extends obsidian_1.PluginSettingTab {
    constructor({ plugin, events }) {
        super(plugin.app, plugin);
        // If the UI needs a more complex setting you can create a
        // custom function and specify it from the json file. It will
        // then be rendered instead of a normal checkbox or text box.
        this.customFunctions = {
            insertTaskCoreStatusSettings: this.insertTaskCoreStatusSettings.bind(this),
            insertCustomTaskStatusSettings: this.insertCustomTaskStatusSettings.bind(this),
        };
        this.plugin = plugin;
        this.presetsSettingsUI = new PresetsSettingsUI_1.PresetsSettingsUI(plugin, events);
        this.events = events;
    }
    async saveSettingsAndRebuildSettingsTab() {
        await this.plugin.saveSettings();
        // Rebuilding the settings tab resets it to the top, so restore how far down it was.
        const previousDistanceFromTop = this.containerEl.scrollTop;
        this.display();
        requestAnimationFrame(() => {
            this.containerEl.scrollTo({ top: previousDistanceFromTop });
        });
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        this.containerEl.addClass('tasks-settings');
        new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.format.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(`<p>${i18n_1.i18n.t('settings.format.description.line1')}</p>` +
            `<p>${i18n_1.i18n.t('settings.format.description.line2')}</p>` +
            `<p>${i18n_1.i18n.t('settings.changeRequiresRestart')}</p>` +
            this.seeTheDocumentation('https://publish.obsidian.md/tasks/Reference/Task+Formats/About+Task+Formats')))
            .addDropdown((dropdown) => {
            for (const key of Object.keys(Settings_1.TASK_FORMATS)) {
                dropdown.addOption(key, Settings_1.TASK_FORMATS[key].getDisplayName());
            }
            dropdown.setValue((0, Settings_1.getSettings)().taskFormat).onChange(async (value) => {
                (0, Settings_1.updateSettings)({ taskFormat: value });
                await this.plugin.saveSettings();
            });
        });
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl).setName(i18n_1.i18n.t('settings.globalFilter.heading')).setHeading();
        // ---------------------------------------------------------------------------
        let globalFilterHidden = null;
        new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.globalFilter.filter.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(`<p><b>${i18n_1.i18n.t('settings.globalFilter.filter.description.line1')}</b></p>` +
            `<p>${i18n_1.i18n.t('settings.globalFilter.filter.description.line2')}<p>` +
            `<p>${i18n_1.i18n.t('settings.globalFilter.filter.description.line3')}</br>` +
            `${i18n_1.i18n.t('settings.globalFilter.filter.description.line4')}</p>` +
            this.seeTheDocumentation('https://publish.obsidian.md/tasks/Getting+Started/Global+Filter')))
            .addText((text) => {
            // I wanted to make this say 'for example, #task or TODO'
            // but wasn't able to figure out how to make the text box
            // wide enough for the whole string to be visible.
            text.setPlaceholder(i18n_1.i18n.t('settings.globalFilter.filter.placeholder'))
                .setValue(GlobalFilter_1.GlobalFilter.getInstance().get())
                .onChange((0, obsidian_1.debounce)(async (value) => {
                (0, Settings_1.updateSettings)({ globalFilter: value });
                GlobalFilter_1.GlobalFilter.getInstance().set(value);
                await this.plugin.saveSettings();
                setSettingVisibility(globalFilterHidden, value.length > 0);
                this.events.triggerReloadVault();
            }, 500, true));
        });
        globalFilterHidden = new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.globalFilter.removeFilter.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(`<p>${i18n_1.i18n.t('settings.globalFilter.removeFilter.description')}</p>` +
            `<p>${i18n_1.i18n.t('settings.changeRequiresRestart')}</p>`))
            .addToggle((toggle) => {
            const settings = (0, Settings_1.getSettings)();
            toggle.setValue(settings.removeGlobalFilter).onChange(async (value) => {
                (0, Settings_1.updateSettings)({ removeGlobalFilter: value });
                GlobalFilter_1.GlobalFilter.getInstance().setRemoveGlobalFilter(value);
                await this.plugin.saveSettings();
            });
        });
        setSettingVisibility(globalFilterHidden, (0, Settings_1.getSettings)().globalFilter.length > 0);
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl).setName(i18n_1.i18n.t('settings.globalQuery.heading')).setHeading();
        // ---------------------------------------------------------------------------
        makeMultilineTextSetting(new obsidian_1.Setting(containerEl)
            .setDesc(SettingsTab.createFragmentWithHTML(`<p>${i18n_1.i18n.t('settings.globalQuery.query.description')}</p>` +
            this.seeTheDocumentation('https://publish.obsidian.md/tasks/Queries/Global+Query')))
            .addTextArea((text) => {
            const settings = (0, Settings_1.getSettings)();
            text.inputEl.rows = 4;
            text.setPlaceholder('# ' + i18n_1.i18n.t('settings.globalQuery.query.placeholder'))
                .setValue(settings.globalQuery)
                .onChange(async (value) => {
                (0, Settings_1.updateSettings)({ globalQuery: value });
                GlobalQuery_1.GlobalQuery.getInstance().set(value);
                await this.plugin.saveSettings();
                this.events.triggerReloadOpenSearchResults();
            });
        }));
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl).setName(i18n_1.i18n.t('settings.searches.heading')).setHeading();
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.searches.enableCustomSearches.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(`<p>${i18n_1.i18n.t('settings.searches.enableCustomSearches.description.line1', {
            filterByFunction: '<code>filter by function</code>',
            sortByFunction: '<code>sort by function</code>',
            groupByFunction: '<code>group by function</code>',
        })}</p>` +
            `<p>${i18n_1.i18n.t('settings.searches.enableCustomSearches.description.line2')}</p>` +
            `<p><b>${i18n_1.i18n.t('settings.searches.enableCustomSearches.description.line3')}</b></p>` +
            `<p>${i18n_1.i18n.t('settings.searches.enableCustomSearches.description.line4')}</p>`))
            .addToggle((toggle) => {
            toggle.setValue(EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().get()).onChange(async (value) => {
                EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().set(value);
                this.events.triggerReloadOpenSearchResults();
            });
        });
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl).setName(i18n_1.i18n.t('settings.searchResults.heading')).setHeading();
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.searchResults.taskCountLocation.name'))
            .setDesc(i18n_1.i18n.t('settings.searchResults.taskCountLocation.description'))
            .addDropdown((dropdown) => {
            dropdown.addOption('top', i18n_1.i18n.t('settings.searchResults.taskCountLocation.options.top'));
            dropdown.addOption('bottom', i18n_1.i18n.t('settings.searchResults.taskCountLocation.options.bottom'));
            dropdown.setValue((0, Settings_1.getSettings)().searchResults.taskCountLocation).onChange(async (value) => {
                (0, Settings_1.updateSettings)({ searchResults: { taskCountLocation: value } });
                await this.plugin.saveSettings();
                this.events.triggerReloadOpenSearchResults();
            });
        });
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.presets.name'))
            .setHeading()
            .setDesc(SettingsTab.createFragmentWithHTML('<p>' +
            i18n_1.i18n.t('settings.presets.line1', {
                name: '<code>name</code>',
                instruction1: '<code>preset name</code>',
                instruction2: '<code>{{preset.name}}</code>',
            }) +
            '</p><p>' +
            i18n_1.i18n.t('settings.presets.line2') +
            '</p>' +
            this.seeTheDocumentation('https://publish.obsidian.md/tasks/Queries/Presets')));
        // ---------------------------------------------------------------------------
        this.presetsSettingsUI.renderPresetsSettings(containerEl);
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl).setName(i18n_1.i18n.t('settings.statuses.heading')).setHeading();
        // ---------------------------------------------------------------------------
        const { headingOpened } = (0, Settings_1.getSettings)();
        // Directly define the JSON data as a constant object
        const settingsJson = [
            {
                text: i18n_1.i18n.t('settings.statuses.coreStatuses.heading'),
                level: 'h3',
                class: '',
                open: true,
                notice: {
                    class: 'setting-item-description',
                    text: null,
                    html: '<p>' +
                        i18n_1.i18n.t('settings.statuses.coreStatuses.description.line1') +
                        '</p><p>' +
                        i18n_1.i18n.t('settings.statuses.coreStatuses.description.line2') +
                        '</p><p>' +
                        i18n_1.i18n.t('settings.changeRequiresRestart') +
                        '</p>',
                },
                settings: [
                    {
                        name: '',
                        description: '',
                        type: 'function',
                        initialValue: '',
                        placeholder: '',
                        settingName: 'insertTaskCoreStatusSettings',
                        featureFlag: '',
                        notice: null,
                    },
                ],
            },
            {
                text: i18n_1.i18n.t('settings.statuses.customStatuses.heading'),
                level: 'h3',
                class: '',
                open: true,
                notice: {
                    class: 'setting-item-description',
                    text: null,
                    html: '<p>' +
                        i18n_1.i18n.t('settings.statuses.customStatuses.description.line1') +
                        '</p><p>' +
                        i18n_1.i18n.t('settings.statuses.customStatuses.description.line2') +
                        '</p><p>' +
                        i18n_1.i18n.t('settings.statuses.customStatuses.description.line3') +
                        '</p><p>' +
                        i18n_1.i18n.t('settings.changeRequiresRestart') +
                        '</p><p></p><p>' +
                        `<a href="https://publish.obsidian.md/tasks/Getting+Started/Statuses">${i18n_1.i18n.t('settings.statuses.customStatuses.description.line4')}</a></p>`,
                },
                settings: [
                    {
                        name: '',
                        description: '',
                        type: 'function',
                        initialValue: '',
                        placeholder: '',
                        settingName: 'insertCustomTaskStatusSettings',
                        featureFlag: '',
                        notice: null,
                    },
                ],
            },
        ];
        // Original usage remains unchanged
        settingsJson.forEach((heading) => {
            const initiallyOpen = headingOpened[heading.text] ?? true;
            const detailsContainer = this.addOneSettingsBlock(containerEl, heading, headingOpened);
            detailsContainer.open = initiallyOpen;
        });
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl).setName(i18n_1.i18n.t('settings.dates.heading')).setHeading();
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.dates.createdDate.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(i18n_1.i18n.t('settings.dates.createdDate.description') +
            '</br>' +
            this.seeTheDocumentation('https://publish.obsidian.md/tasks/Getting+Started/Dates#Created+date')))
            .addToggle((toggle) => {
            const settings = (0, Settings_1.getSettings)();
            toggle.setValue(settings.setCreatedDate).onChange(async (value) => {
                (0, Settings_1.updateSettings)({ setCreatedDate: value });
                await this.plugin.saveSettings();
            });
        });
        new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.dates.doneDate.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(i18n_1.i18n.t('settings.dates.doneDate.description') +
            '</br>' +
            this.seeTheDocumentation('https://publish.obsidian.md/tasks/Getting+Started/Dates#Done+date')))
            .addToggle((toggle) => {
            const settings = (0, Settings_1.getSettings)();
            toggle.setValue(settings.setDoneDate).onChange(async (value) => {
                (0, Settings_1.updateSettings)({ setDoneDate: value });
                await this.plugin.saveSettings();
            });
        });
        new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.dates.cancelledDate.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(i18n_1.i18n.t('settings.dates.cancelledDate.description') +
            '</br>' +
            this.seeTheDocumentation('https://publish.obsidian.md/tasks/Getting+Started/Dates#Cancelled+date')))
            .addToggle((toggle) => {
            const settings = (0, Settings_1.getSettings)();
            toggle.setValue(settings.setCancelledDate).onChange(async (value) => {
                (0, Settings_1.updateSettings)({ setCancelledDate: value });
                await this.plugin.saveSettings();
            });
        });
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl).setName(i18n_1.i18n.t('settings.datesFromFileNames.heading')).setHeading();
        // ---------------------------------------------------------------------------
        let scheduledDateExtraFormat = null;
        let scheduledDateFolders = null;
        new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.datesFromFileNames.scheduledDate.toggle.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(i18n_1.i18n.t('settings.datesFromFileNames.scheduledDate.toggle.description.line1') +
            '</br>' +
            i18n_1.i18n.t('settings.datesFromFileNames.scheduledDate.toggle.description.line2') +
            '</br>' +
            i18n_1.i18n.t('settings.datesFromFileNames.scheduledDate.toggle.description.line3') +
            '</br>' +
            i18n_1.i18n.t('settings.datesFromFileNames.scheduledDate.toggle.description.line4') +
            '</br>' +
            `<p>${i18n_1.i18n.t('settings.changeRequiresRestart')}</p>` +
            this.seeTheDocumentation('https://publish.obsidian.md/tasks/Getting+Started/Use+Filename+as+Default+Date')))
            .addToggle((toggle) => {
            const settings = (0, Settings_1.getSettings)();
            toggle.setValue(settings.useFilenameAsScheduledDate).onChange(async (value) => {
                (0, Settings_1.updateSettings)({ useFilenameAsScheduledDate: value });
                setSettingVisibility(scheduledDateExtraFormat, value);
                setSettingVisibility(scheduledDateFolders, value);
                await this.plugin.saveSettings();
            });
        });
        scheduledDateExtraFormat = new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.datesFromFileNames.scheduledDate.extraFormat.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(i18n_1.i18n.t('settings.datesFromFileNames.scheduledDate.extraFormat.description.line1') +
            '</br>' +
            `<p>${i18n_1.i18n.t('settings.changeRequiresRestart')}</p>` +
            `<p><a href="https://momentjs.com/docs/#/displaying/format/">${i18n_1.i18n.t('settings.datesFromFileNames.scheduledDate.extraFormat.description.line2')}</a></p>`))
            .addText((text) => {
            const settings = (0, Settings_1.getSettings)();
            text.setPlaceholder(i18n_1.i18n.t('settings.datesFromFileNames.scheduledDate.extraFormat.placeholder'))
                .setValue(settings.filenameAsScheduledDateFormat)
                .onChange(async (value) => {
                (0, Settings_1.updateSettings)({ filenameAsScheduledDateFormat: value });
                await this.plugin.saveSettings();
            });
        });
        scheduledDateFolders = new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.datesFromFileNames.scheduledDate.folders.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(`<p>${i18n_1.i18n.t('settings.datesFromFileNames.scheduledDate.folders.description')}</p>` +
            `<p>${i18n_1.i18n.t('settings.changeRequiresRestart')}</p>`))
            .addText(async (input) => {
            const settings = (0, Settings_1.getSettings)();
            await this.plugin.saveSettings();
            input
                .setValue(SettingsTab.renderFolderArray(settings.filenameAsDateFolders))
                .onChange(async (value) => {
                const folders = SettingsTab.parseCommaSeparatedFolders(value);
                (0, Settings_1.updateSettings)({ filenameAsDateFolders: folders });
                await this.plugin.saveSettings();
            });
        });
        setSettingVisibility(scheduledDateExtraFormat, (0, Settings_1.getSettings)().useFilenameAsScheduledDate);
        setSettingVisibility(scheduledDateFolders, (0, Settings_1.getSettings)().useFilenameAsScheduledDate);
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl).setName(i18n_1.i18n.t('settings.recurringTasks.heading')).setHeading();
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.recurringTasks.nextLine.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(i18n_1.i18n.t('settings.recurringTasks.nextLine.description') +
            '</br>' +
            this.seeTheDocumentation('https://publish.obsidian.md/tasks/Getting+Started/Recurring+Tasks')))
            .addToggle((toggle) => {
            const { recurrenceOnNextLine: recurrenceOnNextLine } = (0, Settings_1.getSettings)();
            toggle.setValue(recurrenceOnNextLine).onChange(async (value) => {
                (0, Settings_1.updateSettings)({ recurrenceOnNextLine: value });
                await this.plugin.saveSettings();
            });
        });
        new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.recurringTasks.removeScheduledDate.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(i18n_1.i18n.t('settings.recurringTasks.removeScheduledDate.description.line1') +
            '</br>' +
            i18n_1.i18n.t('settings.recurringTasks.removeScheduledDate.description.line2') +
            '</br>' +
            this.seeTheDocumentation('https://publish.obsidian.md/tasks/Getting+Started/Recurring+Tasks')))
            .addToggle((toggle) => {
            const { removeScheduledDateOnRecurrence } = (0, Settings_1.getSettings)();
            toggle.setValue(removeScheduledDateOnRecurrence).onChange(async (value) => {
                (0, Settings_1.updateSettings)({ removeScheduledDateOnRecurrence: value });
                await this.plugin.saveSettings();
            });
        });
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl).setName(i18n_1.i18n.t('settings.autoSuggest.heading')).setHeading();
        // ---------------------------------------------------------------------------
        let autoSuggestMinimumMatchLength = null;
        let autoSuggestMaximumSuggestions = null;
        new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.autoSuggest.toggle.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(i18n_1.i18n.t('settings.autoSuggest.toggle.description') +
            '</br>' +
            `<p>${i18n_1.i18n.t('settings.changeRequiresRestart')}</p>` +
            this.seeTheDocumentation('https://publish.obsidian.md/tasks/Getting+Started/Auto-Suggest')))
            .addToggle((toggle) => {
            const settings = (0, Settings_1.getSettings)();
            toggle.setValue(settings.autoSuggestInEditor).onChange(async (value) => {
                (0, Settings_1.updateSettings)({ autoSuggestInEditor: value });
                await this.plugin.saveSettings();
                setSettingVisibility(autoSuggestMinimumMatchLength, value);
                setSettingVisibility(autoSuggestMaximumSuggestions, value);
            });
        });
        autoSuggestMinimumMatchLength = new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.autoSuggest.minLength.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(`<p>${i18n_1.i18n.t('settings.autoSuggest.minLength.description')}</p>` +
            `<p>${i18n_1.i18n.t('settings.changeRequiresRestart')}</p>`))
            .addSlider((slider) => {
            const settings = (0, Settings_1.getSettings)();
            slider
                .setLimits(0, 3, 1)
                .setValue(settings.autoSuggestMinMatch)
                .setDynamicTooltip()
                .onChange(async (value) => {
                (0, Settings_1.updateSettings)({ autoSuggestMinMatch: value });
                await this.plugin.saveSettings();
            });
        });
        autoSuggestMaximumSuggestions = new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.autoSuggest.maxSuggestions.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(`<p>${i18n_1.i18n.t('settings.autoSuggest.maxSuggestions.description')}</p>` +
            `<p>${i18n_1.i18n.t('settings.changeRequiresRestart')}</p>`))
            .addSlider((slider) => {
            const settings = (0, Settings_1.getSettings)();
            slider
                .setLimits(3, 20, 1)
                .setValue(settings.autoSuggestMaxItems)
                .setDynamicTooltip()
                .onChange(async (value) => {
                (0, Settings_1.updateSettings)({ autoSuggestMaxItems: value });
                await this.plugin.saveSettings();
            });
        });
        setSettingVisibility(autoSuggestMinimumMatchLength, (0, Settings_1.getSettings)().autoSuggestInEditor);
        setSettingVisibility(autoSuggestMaximumSuggestions, (0, Settings_1.getSettings)().autoSuggestInEditor);
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl).setName(i18n_1.i18n.t('settings.dialogs.heading')).setHeading();
        // ---------------------------------------------------------------------------
        new obsidian_1.Setting(containerEl)
            .setName(i18n_1.i18n.t('settings.dialogs.accessKeys.name'))
            .setDesc(SettingsTab.createFragmentWithHTML(i18n_1.i18n.t('settings.dialogs.accessKeys.description') +
            '</br>' +
            this.seeTheDocumentation('https://publish.obsidian.md/tasks/Getting+Started/Create+or+edit+Task#Keyboard+shortcuts')))
            .addToggle((toggle) => {
            const settings = (0, Settings_1.getSettings)();
            toggle.setValue(settings.provideAccessKeys).onChange(async (value) => {
                (0, Settings_1.updateSettings)({ provideAccessKeys: value });
                await this.plugin.saveSettings();
            });
        });
    }
    seeTheDocumentation(url) {
        return `<p><a href="${url}">${i18n_1.i18n.t('settings.seeTheDocumentation')}</a>.</p>`;
    }
    addOneSettingsBlock(containerEl, heading, headingOpened) {
        const detailsContainer = containerEl.createEl('details', {
            cls: 'tasks-nested-settings',
            attr: {
                ...(heading.open || headingOpened[heading.text] ? { open: true } : {}),
            },
        });
        detailsContainer.empty();
        detailsContainer.ontoggle = () => {
            headingOpened[heading.text] = detailsContainer.open;
            (0, Settings_1.updateSettings)({ headingOpened: headingOpened });
            void this.plugin.saveSettings();
        };
        const summary = detailsContainer.createEl('summary');
        new obsidian_1.Setting(summary).setHeading().setName(heading.text);
        summary.createDiv('collapser').createDiv('handle');
        // detailsContainer.createEl(heading.level as keyof HTMLElementTagNameMap, { text: heading.text });
        if (heading.notice !== null) {
            if (heading.notice.html !== null) {
                new obsidian_1.Setting(detailsContainer).setDesc(SettingsTab.createFragmentWithHTML(heading.notice.html));
            }
        }
        // This will process all the settings from settingsConfiguration.json and render
        // them out reducing the duplication of the code in this file. This will become
        // more important as features are being added over time.
        heading.settings.forEach((setting) => {
            if (setting.featureFlag !== '' && !(0, Settings_1.isFeatureEnabled)(setting.featureFlag)) {
                // The settings configuration has a featureFlag set and the user has not
                // enabled it. Skip adding the settings option.
                return;
            }
            if (setting.type === 'checkbox') {
                new obsidian_1.Setting(detailsContainer)
                    .setName(setting.name)
                    .setDesc(setting.description)
                    .addToggle((toggle) => {
                    const settings = (0, Settings_1.getSettings)();
                    if (!settings.generalSettings[setting.settingName]) {
                        (0, Settings_1.updateGeneralSetting)(setting.settingName, setting.initialValue);
                    }
                    toggle
                        .setValue(settings.generalSettings[setting.settingName])
                        .onChange(async (value) => {
                        (0, Settings_1.updateGeneralSetting)(setting.settingName, value);
                        await this.plugin.saveSettings();
                    });
                });
            }
            else if (setting.type === 'text') {
                new obsidian_1.Setting(detailsContainer)
                    .setName(setting.name)
                    .setDesc(setting.description)
                    .addText((text) => {
                    const settings = (0, Settings_1.getSettings)();
                    if (!settings.generalSettings[setting.settingName]) {
                        (0, Settings_1.updateGeneralSetting)(setting.settingName, setting.initialValue);
                    }
                    const onChange = async (value) => {
                        (0, Settings_1.updateGeneralSetting)(setting.settingName, value);
                        await this.plugin.saveSettings();
                    };
                    text.setPlaceholder(setting.placeholder.toString())
                        .setValue(settings.generalSettings[setting.settingName].toString())
                        .onChange((0, obsidian_1.debounce)(onChange, 500, true));
                });
            }
            else if (setting.type === 'textarea') {
                new obsidian_1.Setting(detailsContainer)
                    .setName(setting.name)
                    .setDesc(setting.description)
                    .addTextArea((text) => {
                    const settings = (0, Settings_1.getSettings)();
                    if (!settings.generalSettings[setting.settingName]) {
                        (0, Settings_1.updateGeneralSetting)(setting.settingName, setting.initialValue);
                    }
                    const onChange = async (value) => {
                        (0, Settings_1.updateGeneralSetting)(setting.settingName, value);
                        await this.plugin.saveSettings();
                    };
                    text.setPlaceholder(setting.placeholder.toString())
                        .setValue(settings.generalSettings[setting.settingName].toString())
                        .onChange((0, obsidian_1.debounce)(onChange, 500, true));
                    text.inputEl.rows = 8;
                    text.inputEl.cols = 40;
                });
            }
            else if (setting.type === 'function') {
                this.customFunctions[setting.settingName](detailsContainer, this);
            }
            if (setting.notice !== null) {
                const notice = detailsContainer.createEl('p', {
                    cls: setting.notice.class,
                    text: setting.notice.text ?? '',
                });
                if (setting.notice.html !== null) {
                    notice.append((0, obsidian_1.sanitizeHTMLToDom)(setting.notice.html));
                }
            }
        });
        return detailsContainer;
    }
    static parseCommaSeparatedFolders(input) {
        return (input
            // a limitation is that folder names may not contain commas
            .split(',')
            .map((folder) => folder.trim())
            // remove leading and trailing slashes
            .map((folder) => folder.replace(/^\/|\/$/g, ''))
            .filter((folder) => folder !== ''));
    }
    static renderFolderArray(folders) {
        return folders.join(',');
    }
    /**
     * Settings for Core Task Status
     * These are built-in statuses that can have minimal edits made,
     * but are not allowed to be deleted or added to.
     *
     * @param {HTMLElement} containerEl
     * @param {SettingsTab} settings
     */
    insertTaskCoreStatusSettings(containerEl, settings) {
        const { statusSettings } = (0, Settings_1.getSettings)();
        /* -------------------- One row per core status in the settings -------------------- */
        statusSettings.coreStatuses.forEach((status_type) => {
            createRowForTaskStatus(containerEl, status_type, statusSettings.coreStatuses, statusSettings, settings, settings.plugin, true);
        });
        /* -------------------- 'Review and check your Statuses' button -------------------- */
        const createMermaidDiagram = new obsidian_1.Setting(containerEl).addButton((button) => {
            const buttonName = i18n_1.i18n.t('settings.statuses.coreStatuses.buttons.checkStatuses.name');
            button
                .setButtonText(buttonName)
                .setCta()
                .onClick(async () => {
                // Generate a new file unique file name, in the root of the vault
                const now = window.moment();
                const formattedDateTime = now.format('YYYY-MM-DD HH-mm-ss');
                const filename = `Tasks Plugin - ${buttonName} ${formattedDateTime}.md`;
                // Create the report
                const version = this.plugin.manifest.version;
                const statusRegistry = StatusRegistry_1.StatusRegistry.getInstance();
                const fileContent = (0, StatusRegistryReport_1.createStatusRegistryReport)(statusSettings, statusRegistry, buttonName, version);
                // Save the file
                const file = await this.app.vault.create(filename, fileContent);
                // And open the new file
                const leaf = this.app.workspace.getLeaf(true);
                await leaf.openFile(file);
            });
            button.setTooltip(i18n_1.i18n.t('settings.statuses.coreStatuses.buttons.checkStatuses.tooltip'));
        });
        createMermaidDiagram.infoEl.remove();
    }
    /**
     * Settings for Custom Task Status
     *
     * @param {HTMLElement} containerEl
     * @param {SettingsTab} settings
     */
    insertCustomTaskStatusSettings(containerEl, settings) {
        const { statusSettings } = (0, Settings_1.getSettings)();
        /* -------------------- One row per custom status in the settings -------------------- */
        statusSettings.customStatuses.forEach((status_type) => {
            createRowForTaskStatus(containerEl, status_type, statusSettings.customStatuses, statusSettings, settings, settings.plugin, false);
        });
        containerEl.createEl('div');
        /* -------------------- 'Add New Task Status' button -------------------- */
        const setting = new obsidian_1.Setting(containerEl).addButton((button) => {
            button
                .setButtonText(i18n_1.i18n.t('settings.statuses.customStatuses.buttons.addNewStatus.name'))
                .setCta()
                .onClick(async () => {
                StatusSettings_1.StatusSettings.addStatus(statusSettings.customStatuses, new StatusConfiguration_1.StatusConfiguration('', '', '', false, StatusConfiguration_1.StatusType.TODO));
                await updateAndSaveStatusSettings(statusSettings, settings);
            });
        });
        setting.infoEl.remove();
        const themes = [
            // Light and Dark themes - alphabetical order
            [i18n_1.i18n.t('settings.statuses.collections.anuppuccinTheme'), Themes.anuppuccinSupportedStatuses()],
            [i18n_1.i18n.t('settings.statuses.collections.auraTheme'), Themes.auraSupportedStatuses()],
            [i18n_1.i18n.t('settings.statuses.collections.borderTheme'), Themes.borderSupportedStatuses()],
            [i18n_1.i18n.t('settings.statuses.collections.ebullientworksTheme'), Themes.ebullientworksSupportedStatuses()],
            [i18n_1.i18n.t('settings.statuses.collections.itsThemeAndSlrvbCheckboxes'), Themes.itsSupportedStatuses()],
            [i18n_1.i18n.t('settings.statuses.collections.minimalTheme'), Themes.minimalSupportedStatuses()],
            [i18n_1.i18n.t('settings.statuses.collections.thingsTheme'), Themes.thingsSupportedStatuses()],
            // Dark only themes - alphabetical order
            [i18n_1.i18n.t('settings.statuses.collections.lytModeTheme'), Themes.lytModeSupportedStatuses()],
        ];
        for (const [name, collection] of themes) {
            const addStatusesSupportedByThisTheme = new obsidian_1.Setting(containerEl).addButton((button) => {
                const label = i18n_1.i18n.t('settings.statuses.collections.buttons.addCollection.name', {
                    themeName: name,
                    numberOfStatuses: collection.length,
                });
                button.setButtonText(label).onClick(async () => {
                    await addCustomStatesToSettings(collection, statusSettings, settings);
                });
            });
            addStatusesSupportedByThisTheme.infoEl.remove();
        }
        /* -------------------- 'Add All Unknown Status Types' button -------------------- */
        const addAllUnknownStatuses = new obsidian_1.Setting(containerEl).addButton((button) => {
            button
                .setButtonText(i18n_1.i18n.t('settings.statuses.customStatuses.buttons.addAllUnknown.name'))
                .setCta()
                .onClick(async () => {
                const tasks = this.plugin.getTasks();
                const allStatuses = tasks.map((task) => {
                    return task.status;
                });
                const unknownStatuses = StatusRegistry_1.StatusRegistry.getInstance().findUnknownStatuses(allStatuses);
                if (unknownStatuses.length === 0) {
                    return;
                }
                unknownStatuses.forEach((s) => {
                    StatusSettings_1.StatusSettings.addStatus(statusSettings.customStatuses, s);
                });
                await updateAndSaveStatusSettings(statusSettings, settings);
            });
        });
        addAllUnknownStatuses.infoEl.remove();
        /* -------------------- 'Reset Custom Status Types to Defaults' button -------------------- */
        const clearCustomStatuses = new obsidian_1.Setting(containerEl).addButton((button) => {
            button
                .setButtonText(i18n_1.i18n.t('settings.statuses.customStatuses.buttons.resetCustomStatuses.name'))
                .setWarning()
                .onClick(async () => {
                StatusSettings_1.StatusSettings.resetAllCustomStatuses(statusSettings);
                await updateAndSaveStatusSettings(statusSettings, settings);
            });
        });
        clearCustomStatuses.infoEl.remove();
    }
}
exports.SettingsTab = SettingsTab;
SettingsTab.createFragmentWithHTML = (html) => (0, obsidian_1.sanitizeHTMLToDom)(html);
/**
 * Create the row to see and modify settings for a single task status type.
 * @param containerEl
 * @param statusType - The status type to be edited.
 * @param statuses - The list of statuses that statusType is stored in.
 * @param statusSettings - All the status types already in the user's settings, EXCEPT the standard ones.
 * @param settings
 * @param plugin
 * @param isCoreStatus - whether the status is a core status
 */
function createRowForTaskStatus(containerEl, statusType, statuses, statusSettings, settings, plugin, isCoreStatus) {
    //const taskStatusDiv = containerEl.createEl('div');
    const taskStatusPreview = containerEl.createEl('pre');
    taskStatusPreview.addClass('row-for-status');
    taskStatusPreview.textContent = new Status_1.Status(statusType).previewText();
    const setting = new obsidian_1.Setting(containerEl);
    setting.infoEl.replaceWith(taskStatusPreview);
    if (!isCoreStatus) {
        setting.addExtraButton((extra) => {
            extra
                .setIcon('cross')
                .setTooltip('Delete')
                .onClick(async () => {
                if (StatusSettings_1.StatusSettings.deleteStatus(statuses, statusType)) {
                    await updateAndSaveStatusSettings(statusSettings, settings);
                }
            });
        });
    }
    setting.addExtraButton((extra) => {
        extra
            .setIcon('pencil')
            .setTooltip('Edit')
            .onClick(async () => {
            const modal = new CustomStatusModal_1.CustomStatusModal(plugin, statusType, isCoreStatus);
            modal.onClose = async () => {
                if (modal.saved) {
                    if (StatusSettings_1.StatusSettings.replaceStatus(statuses, statusType, modal.statusConfiguration())) {
                        await updateAndSaveStatusSettings(statusSettings, settings);
                    }
                }
            };
            modal.open();
        });
    });
    setting.infoEl.remove();
}
async function addCustomStatesToSettings(supportedStatuses, statusSettings, settings) {
    const notices = StatusSettings_1.StatusSettings.bulkAddStatusCollection(statusSettings, supportedStatuses);
    notices.forEach((notice) => {
        new obsidian_1.Notice(notice);
    });
    await updateAndSaveStatusSettings(statusSettings, settings);
}
async function updateAndSaveStatusSettings(statusTypes, settings) {
    (0, Settings_1.updateSettings)({
        statusSettings: statusTypes,
    });
    // Update the active statuses.
    // This saves the user from having to restart Obsidian in order to apply the changed status(es).
    StatusSettings_1.StatusSettings.applyToStatusRegistry(statusTypes, StatusRegistry_1.StatusRegistry.getInstance());
    await settings.saveSettingsAndRebuildSettingsTab();
}
function makeMultilineTextSetting(setting) {
    const { settingEl, infoEl, controlEl } = setting;
    const textEl = controlEl.querySelector('textarea');
    // Not a setting with a text field
    if (textEl === null) {
        return;
    }
    settingEl.addClass('tasks-setting-multiline-text');
    infoEl.addClass('tasks-setting-multiline-text-info');
    textEl.addClass('tasks-setting-multiline-text-textarea');
}
function setSettingVisibility(setting, visible) {
    if (setting) {
        // @ts-expect-error Setting.setVisibility() is not exposed in the API.
        // Source: https://discord.com/channels/686053708261228577/840286264964022302/1293725986042544139
        setting.setVisibility(visible);
    }
    else {
        console.warn('Setting has not be initialised. Can update visibility of setting UI - in setSettingVisibility');
    }
}
//# sourceMappingURL=SettingsTab.js.map