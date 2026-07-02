"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const Settings_1 = require("../../src/Config/Settings");
const Presets_1 = require("../../src/Query/Presets/Presets");
beforeEach(() => {
    (0, Settings_1.resetSettings)();
});
afterEach(() => {
    (0, Settings_1.resetSettings)();
});
describe('settings-usage', () => {
    it('load default settings and validate features', () => {
        const currentSettings = (0, Settings_1.getSettings)();
        expect(Object.entries(currentSettings.features).length).toBeGreaterThan(0);
        expect(currentSettings.features['INTERNAL_TESTING_ENABLED_BY_DEFAULT']).toBe(true);
    });
    it('returns true if feature enabled', () => {
        const currentSettings = (0, Settings_1.isFeatureEnabled)('INTERNAL_TESTING_ENABLED_BY_DEFAULT');
        expect(currentSettings).toBe(true);
    });
    it('toggles a feature', () => {
        const updatedFeatures = (0, Settings_1.toggleFeature)('INTERNAL_TESTING_ENABLED_BY_DEFAULT', false);
        expect(updatedFeatures['INTERNAL_TESTING_ENABLED_BY_DEFAULT']).toBe(false);
        const currentSettings = (0, Settings_1.getSettings)();
        expect(currentSettings.features['INTERNAL_TESTING_ENABLED_BY_DEFAULT']).toBe(false);
    });
    it('should add new logging options to settings', () => {
        // Arrange:
        // Simulate the user have run an earlier version of Tasks with few logging options:
        const initialLoggingOptions = {
            minLevels: {
                '': 'info',
                tasks: 'info',
            },
        };
        (0, Settings_1.updateSettings)({ loggingOptions: initialLoggingOptions });
        // Act:
        // getSettings() has responsibility for adding any new/missing settings:
        const loggingOptions = (0, Settings_1.getSettings)();
        // Assert:
        expect(loggingOptions.loggingOptions.minLevels['tasks.Query']).toBeDefined();
    });
});
describe('dismissible notices', function () {
    describe('live preview callout warning', () => {
        const id = 'live-preview-callout-warning';
        it('should not dismiss callout warning by default', () => {
            // Initially gives undefined: need to initialise settings
            expect((0, Settings_1.getSettings)().dismissedNotices[id]).toBe(false);
        });
        it('should be able to turn on dismissing callout warning', () => {
            (0, Settings_1.getSettings)().dismissedNotices[id] = true;
            expect((0, Settings_1.getSettings)().dismissedNotices[id]).toBe(true);
        });
    });
});
describe('resetSettings behaviour', () => {
    it('should reset a setting to default values', () => {
        expect((0, Settings_1.getSettings)().setCancelledDate).toEqual(true);
        (0, Settings_1.updateSettings)({ setCancelledDate: false });
        expect((0, Settings_1.getSettings)().setCancelledDate).toEqual(false);
        (0, Settings_1.resetSettings)();
        expect((0, Settings_1.getSettings)().setCancelledDate).toEqual(true);
    });
    it('should have taskCountLocation default to bottom', () => {
        const currentSettings = (0, Settings_1.getSettings)();
        expect(currentSettings.searchResults.taskCountLocation).toBe('bottom');
    });
    it('should completely remove properties not in defaultSettings', () => {
        // Arrange: Add an extra property that isn't in defaultSettings
        (0, Settings_1.updateSettings)({
            extraProperty: 'should be removed',
        });
        // Verify the extra property exists
        const settingsBeforeReset = (0, Settings_1.getSettings)();
        expect(settingsBeforeReset.extraProperty).toBe('should be removed');
        // Act: Reset settings
        const resetResult = (0, Settings_1.resetSettings)();
        // Assert: Extra property should be completely gone
        expect(resetResult.extraProperty).toBeUndefined();
    });
});
describe('settings migration', () => {
    it('should migrate "includes" to "presets" when loading old settings', () => {
        // Arrange: Create settings with old 'includes' property
        const oldSettings = {
            includes: {
                'my-preset': 'some query value',
                'another-preset': 'another query',
            },
            globalQuery: 'test query',
        };
        // Act: Update settings with the old structure
        (0, Settings_1.updateSettings)(oldSettings);
        const currentSettings = (0, Settings_1.getSettings)();
        // Assert: Verify migration happened correctly
        expect(currentSettings.presets).toEqual({
            'my-preset': 'some query value',
            'another-preset': 'another query',
        });
        expect(currentSettings.includes).toBeUndefined();
        expect(currentSettings.globalQuery).toBe('test query');
    });
    it('should not migrate when "presets" already exists', () => {
        // Arrange: Settings with both old and new properties
        const settingsWithBothProperties = {
            includes: {
                'old-preset': 'old value',
            },
            presets: {
                'new-preset': 'new value',
            },
        };
        // Act
        (0, Settings_1.updateSettings)(settingsWithBothProperties);
        const currentSettings = (0, Settings_1.getSettings)();
        // Assert: Should keep the new "presets" and ignore "includes"
        expect(currentSettings.presets).toEqual({
            'new-preset': 'new value',
        });
        expect(currentSettings.presets).not.toEqual({
            'old-preset': 'old value',
        });
    });
    it('should handle empty includes migration', () => {
        // Arrange: Settings with empty includes
        const settingsWithEmptyIncludes = {
            includes: {},
            globalQuery: 'test',
        };
        // Act
        (0, Settings_1.updateSettings)(settingsWithEmptyIncludes);
        const currentSettings = (0, Settings_1.getSettings)();
        // Assert
        expect(currentSettings.presets).toEqual({});
        expect(currentSettings.includes).toBeUndefined();
    });
    it('should handle settings without includes property', () => {
        // Arrange: Normal settings without includes
        const normalSettings = {
            globalQuery: 'test query',
            globalFilter: 'test filter',
        };
        // Act
        (0, Settings_1.updateSettings)(normalSettings);
        const currentSettings = (0, Settings_1.getSettings)();
        // Assert: Should work normally without any migration
        expect(currentSettings.globalQuery).toBe('test query');
        expect(currentSettings.globalFilter).toBe('test filter');
        // presets should be the default empty object
        expect(currentSettings.presets).toEqual(Presets_1.defaultPresets);
    });
});
//# sourceMappingURL=Settings.test.js.map