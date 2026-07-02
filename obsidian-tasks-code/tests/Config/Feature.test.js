"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const Feature_1 = require("../../src/Config/Feature");
describe('feature-usage', () => {
    it('load current features', () => {
        const currentFeatures = Feature_1.Feature.values;
        expect(currentFeatures.length).toBeGreaterThan(0);
    });
    it('load current feature states', () => {
        for (const flag in Feature_1.Feature.settingsFlags) {
            expect(Feature_1.Feature.settingsFlags[flag]).not.toBeNull();
        }
    });
    it('load and validate enabled by default', () => {
        const name = 'INTERNAL_TESTING_ENABLED_BY_DEFAULT';
        expect(Feature_1.Feature.settingsFlags[name]).toBe(true);
        expect(Feature_1.Feature.fromString(name).enabledByDefault).toBe(true);
    });
    it('load and validate feature properties', () => {
        const name = 'INTERNAL_TESTING_ENABLED_BY_DEFAULT';
        const feature = Feature_1.Feature.fromString(name);
        expect(feature.internalName).toBe(name);
        expect(feature.index).toBe(9999);
        expect(feature.description).toBe('Description');
        expect(feature.displayName).toBe('Test Item. Used to validate the Feature Framework.');
        expect(feature.enabledByDefault).toBe(true);
        expect(feature.stable).toBe(false);
    });
    it('load and access invalid feature name', () => {
        function getFeature() {
            const name = 'INVALID_FEATURE_NAME';
            Feature_1.Feature.fromString(name);
        }
        expect(getFeature).toThrowError('Illegal argument passed');
        expect(getFeature).toThrowError(RangeError);
    });
});
//# sourceMappingURL=Feature.test.js.map