"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feature = void 0;
const featureConfiguration_json_1 = __importDefault(require("./featureConfiguration.json"));
/**
 * The Feature class tracks all the possible features that users can enabled that are in development. This allows
 * new features to be added to the platform but not enabled by default. This reduces the complications when it
 * comes to adding new features and a large cascade of dependent branches.
 *
 * When you add a new feature you need to add it to the featureConfiguration.json file. It then needs to be added to
 * settings so a user can enable it. If you want it hidden you will need to manually update the data.json file. In the
 * plugin folder.
 *
 * @since 2022-05-29
 */
class Feature {
    constructor(internalName, index, description, displayName, enabledByDefault, stable) {
        this.internalName = internalName;
        this.index = index;
        this.description = description;
        this.displayName = displayName;
        this.enabledByDefault = enabledByDefault;
        this.stable = stable;
    }
    /**
     * Returns the list of all available features.
     *
     * @readonly
     * @static
     * @type {Feature[]}
     */
    static get values() {
        let availableFeatures = [];
        featureConfiguration_json_1.default.forEach((feature) => {
            availableFeatures = [
                ...availableFeatures,
                new Feature(feature.internalName, feature.index, feature.description, feature.displayName, feature.enabledByDefault, feature.stable),
            ];
        });
        return availableFeatures;
    }
    /**
     * Returns the enabled state of the feature.
     *
     * @readonly
     * @static
     * @type {FeatureFlag}
     */
    static get settingsFlags() {
        const featureFlags = {};
        Feature.values.forEach((feature) => {
            featureFlags[feature.internalName] = feature.enabledByDefault;
        });
        return featureFlags;
    }
    /**
     * Converts a name to its corresponding default Feature instance.
     *
     * @param name the name to convert to Feature
     * @throws RangeError, if a string that has no corresponding Feature value was passed.
     * @returns the matching Feature
     */
    static fromString(name) {
        for (const feature of Feature.values) {
            if (name === feature.internalName) {
                return feature;
            }
        }
        throw new RangeError(`Illegal argument passed to fromString(): ${name} does not correspond to any available Feature ${this.name}`);
    }
}
exports.Feature = Feature;
//# sourceMappingURL=Feature.js.map