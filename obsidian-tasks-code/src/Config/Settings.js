"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFeature = exports.isFeatureEnabled = exports.updateGeneralSetting = exports.resetSettings = exports.updateSettings = exports.getSettings = exports.TASK_FORMATS = void 0;
exports.getUserSelectedTaskFormat = getUserSelectedTaskFormat;
const Suggestor_1 = require("../Suggestor/Suggestor");
const DefaultTaskSerializer_1 = require("../TaskSerializer/DefaultTaskSerializer");
const DataviewTaskSerializer_1 = require("../TaskSerializer/DataviewTaskSerializer");
const StatusConfiguration_1 = require("../Statuses/StatusConfiguration");
const Status_1 = require("../Statuses/Status");
const TaskSerializer_1 = require("../TaskSerializer");
const DataviewTaskSerializer_2 = require("../TaskSerializer/DataviewTaskSerializer");
const i18n_1 = require("../i18n/i18n");
const Presets_1 = require("../Query/Presets/Presets");
const DebugSettings_1 = require("./DebugSettings");
const EditModalShowSettings_1 = require("./EditModalShowSettings");
const StatusSettings_1 = require("./StatusSettings");
const Feature_1 = require("./Feature");
/** Map of all defined {@link TaskFormat}s */
exports.TASK_FORMATS = {
    tasksPluginEmoji: {
        getDisplayName: () => i18n_1.i18n.t('settings.format.displayName.tasksEmojiFormat'),
        taskSerializer: new TaskSerializer_1.DefaultTaskSerializer(DefaultTaskSerializer_1.DEFAULT_SYMBOLS),
        buildSuggestions: (0, Suggestor_1.makeDefaultSuggestionBuilder)(DefaultTaskSerializer_1.DEFAULT_SYMBOLS, Suggestor_1.DEFAULT_MAX_GENERIC_SUGGESTIONS, false),
    },
    dataview: {
        getDisplayName: () => i18n_1.i18n.t('settings.format.displayName.dataview'),
        taskSerializer: new DataviewTaskSerializer_2.DataviewTaskSerializer(),
        buildSuggestions: (0, Suggestor_1.onlySuggestIfBracketOpen)((0, Suggestor_1.makeDefaultSuggestionBuilder)(DataviewTaskSerializer_1.DATAVIEW_SYMBOLS, Suggestor_1.DEFAULT_MAX_GENERIC_SUGGESTIONS, true), [
            ['(', ')'],
            ['[', ']'],
        ]),
    },
};
const defaultSettings = {
    presets: Presets_1.defaultPresets,
    globalQuery: '',
    globalFilter: '',
    removeGlobalFilter: false,
    taskFormat: 'tasksPluginEmoji',
    setCreatedDate: false,
    setDoneDate: true,
    setCancelledDate: true,
    autoSuggestInEditor: true,
    autoSuggestMinMatch: 0,
    autoSuggestMaxItems: 20,
    provideAccessKeys: true,
    useFilenameAsScheduledDate: false,
    filenameAsScheduledDateFormat: '',
    filenameAsDateFolders: [],
    recurrenceOnNextLine: false,
    removeScheduledDateOnRecurrence: false,
    searchResults: {
        taskCountLocation: 'bottom',
    },
    statusSettings: new StatusSettings_1.StatusSettings(),
    isShownInEditModal: EditModalShowSettings_1.defaultEditModalShowSettings,
    dismissedNotices: {
        // Note: if any new options are added here, there will need to be a mechanism
        // to add the new values to pre-existing user settings.
        'live-preview-callout-warning': false,
    },
    features: Feature_1.Feature.settingsFlags,
    generalSettings: {
    /* Prevent duplicate values in user settings for now,
       at least until I start porting the pre-1.23.0 settings
       code to be generated from settingsConfiguration.json.
     */
    // globalFilter: '',
    // removeGlobalFilter: false,
    // setDoneDate: true,
    },
    headingOpened: {},
    debugSettings: new DebugSettings_1.DebugSettings(),
    /*
    `loggingOptions` is a property in the `Settings` interface that defines the logging options for
    the application. It is an object that contains a `minLevels` property, which is a map of logger
    names to their minimum logging levels. This allows the application to control the amount of
    logging output based on the logger name and the minimum logging level. For example, the logger
    name `tasks` might have a minimum logging level of `debug`, while the root logger might have a
    minimum logging level of `info`.
    */
    loggingOptions: {
        minLevels: {
            '': 'info',
            tasks: 'info',
            'tasks.Cache': 'info', // Cache.ts
            'tasks.Events': 'info', // TasksEvents.ts
            'tasks.File': 'info', // File.ts
            'tasks.Query': 'info', // Query.ts & QueryRenderer.ts
            'tasks.Task': 'info', // Task.ts
        },
    },
};
let settings = { ...defaultSettings };
function addNewOptionsToUserSettings(defaultValues, userValues) {
    for (const flag in defaultValues) {
        if (userValues[flag] === undefined) {
            userValues[flag] = defaultValues[flag];
        }
    }
}
/**
 * Returns the current settings as a object, it will also check and
 * update the flags to make sure they are all shown in the data.json
 * file. Exposure via the settings UI is optional.
 *
 * @returns true if the feature is enabled.
 */
const getSettings = () => {
    // Check to see if there are any new options that need to be added to the user's settings.
    addNewOptionsToUserSettings(Feature_1.Feature.settingsFlags, settings.features);
    addNewOptionsToUserSettings(defaultSettings.loggingOptions.minLevels, settings.loggingOptions.minLevels);
    addNewOptionsToUserSettings(defaultSettings.debugSettings, settings.debugSettings);
    // In case saves pre-dated StatusConfiguration.type
    // TODO Special case for symbol 'X' or 'x' (just in case)
    settings.statusSettings.customStatuses.forEach((s, index, array) => {
        const newType = Status_1.Status.getTypeFromStatusTypeString(s.type);
        array[index] = new StatusConfiguration_1.StatusConfiguration(s.symbol ?? ' ', s.name, s.nextStatusSymbol ?? 'x', s.availableAsCommand, newType);
    });
    return { ...settings };
};
exports.getSettings = getSettings;
const updateSettings = (newSettings) => {
    // Apply migrations before updating settings
    const migratedSettings = migrateSettings(newSettings);
    settings = { ...settings, ...migratedSettings };
    return (0, exports.getSettings)();
};
exports.updateSettings = updateSettings;
const resetSettings = () => {
    settings = JSON.parse(JSON.stringify(defaultSettings));
    return settings;
};
exports.resetSettings = resetSettings;
const updateGeneralSetting = (name, value) => {
    settings.generalSettings[name] = value;
    /* Prevent duplicate values in user settings for now,
       at least until I start porting the pre-1.23.0 settings
       code to be generated from settingsConfiguration.json.
     */
    // sync the old settings for the moment so a larger change is not needed.
    // updateSettings({
    //     globalFilter: <string>settings.generalSettings['globalFilter'],
    //     removeGlobalFilter: <boolean>settings.generalSettings['removeGlobalFilter'],
    //     setDoneDate: <boolean>settings.generalSettings['setDoneDate'],
    // });
    return (0, exports.getSettings)();
};
exports.updateGeneralSetting = updateGeneralSetting;
/**
 * Returns the enabled state of the feature from settings.
 *
 * @param internalName the internal name of the feature.
 * @returns true if the feature is enabled.
 */
const isFeatureEnabled = (internalName) => {
    return settings.features[internalName] ?? false;
};
exports.isFeatureEnabled = isFeatureEnabled;
/**
 * enables toggling the feature and returning the current collection with state.
 *
 * @param internalName the internal name of the feature.
 * @param enabled the expected state of the feature.
 * @returns the features with the specified feature toggled.
 */
const toggleFeature = (internalName, enabled) => {
    settings.features[internalName] = enabled;
    return settings.features;
};
exports.toggleFeature = toggleFeature;
/**
 * Retrieves the {@link TaskFormat} that corresponds to user's selection ({@link Settings.taskFormat})
 *
 * @returns {TaskFormat}
 */
function getUserSelectedTaskFormat() {
    return exports.TASK_FORMATS[(0, exports.getSettings)().taskFormat];
}
/**
 * Migrates old settings structure to new structure.
 * This handles backwards compatibility when settings property names change.
 *
 * Note: The vault's 'data.json' file is only updated when the user opens the Tasks settings UI.
 */
function migrateSettings(loadedSettings) {
    const migratedSettings = { ...loadedSettings };
    // Migrate 'includes' to 'presets' if present
    if ('includes' in migratedSettings && !('presets' in migratedSettings)) {
        migratedSettings.presets = migratedSettings.includes;
        delete migratedSettings.includes;
    }
    // Add future migrations here as needed
    return migratedSettings;
}
//# sourceMappingURL=Settings.js.map