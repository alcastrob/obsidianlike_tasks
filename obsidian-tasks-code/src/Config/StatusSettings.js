"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusSettings = void 0;
const Status_1 = require("../Statuses/Status");
/**
 * Class for encapsulating the settings that control custom statuses.
 *
 * There are two lists of {@link StatusConfiguration} objects:
 *
 * - {@link coreStatuses} - which will always have two values in.
 * - {@link customStatuses} - which starts two values, but these can be deleted and more added.
 *
 * Most methods are static to allow them to be called from call-backs.
 *
 * Use {@link applyToStatusRegistry} to apply these settings to a {@link StatusRegistry}
 *
 * @see Status
 */
class StatusSettings {
    constructor() {
        this.coreStatuses = [
            // The two statuses that do not need CSS styling
            Status_1.Status.TODO.configuration,
            Status_1.Status.DONE.configuration,
        ]; // Do not modify directly: use the static mutation methods in this class.
        this.customStatuses = [
            // Any statuses that are always supported, but need custom CSS styling
            Status_1.Status.IN_PROGRESS.configuration,
            Status_1.Status.CANCELLED.configuration,
        ]; // Do not modify directly: use the static mutation methods in this class.
    }
    /**
     * Add a new custom status.
     *
     * This is static so that it can be called from modal onClick() call-backs.
     *
     * - Currently, duplicates are allowed.
     * - Allows empty StatusConfiguration objects - where every string is empty
     * @param statuses
     * @param newStatus
     */
    static addStatus(statuses, newStatus) {
        statuses.push(newStatus);
    }
    /**
     * Replace the given status, to effectively edit it.
     * Returns true if the settings were changed.
     *
     * This is static so that it can be called from modal onClick() call-backs.
     *
     * - Does not currently check whether the status character is the same
     * - If the status character is different, does not check whether the new one is already used in another status
     * @param statuses
     * @param originalStatus
     * @param newStatus
     */
    static replaceStatus(statuses, originalStatus, newStatus) {
        const index = this.findStatusIndex(originalStatus, statuses);
        if (index <= -1) {
            return false;
        }
        statuses.splice(index, 1, newStatus);
        return true;
    }
    /**
     * This is a workaround for the fact that statusSettings.customStatusTypes.indexOf(statusConfiguration)
     * stopped finding identical statuses since the addition of StatusConfiguration.type.
     * @param statusConfiguration
     * @param statuses
     * @private
     */
    static findStatusIndex(statusConfiguration, statuses) {
        const originalStatusAsStatus = new Status_1.Status(statusConfiguration);
        return statuses.findIndex((s) => {
            return new Status_1.Status(s).previewText() == originalStatusAsStatus.previewText();
        });
    }
    /**
     * Delete the given status.
     * Returns true if deleted, and false if not.
     *
     * This is static so that it can be called from modal onClick() call-backs.
     *
     * @param statuses
     * @param status
     */
    static deleteStatus(statuses, status) {
        const index = this.findStatusIndex(status, statuses);
        if (index <= -1) {
            return false;
        }
        statuses.splice(index, 1);
        return true;
    }
    /**
     * Delete all custom statuses.
     *
     * This is static so that it can be called from modal onClick() call-backs.
     *
     * @param statusSettings
     */
    static deleteAllCustomStatuses(statusSettings) {
        statusSettings.customStatuses.splice(0);
    }
    /**
     * Restore the default custom statuses.
     *
     * @param statusSettings
     */
    static resetAllCustomStatuses(statusSettings) {
        StatusSettings.deleteAllCustomStatuses(statusSettings);
        const defaultSettings = new StatusSettings();
        defaultSettings.customStatuses.forEach((s) => {
            StatusSettings.addStatus(statusSettings.customStatuses, s);
        });
    }
    /**
     * Add a collection of custom supported statuses to a StatusSettings.
     * This can be used to quickly populate the user's settings.
     * If there are any exact duplicates already present, they are skipped, and noted in the returned value.
     *
     * This is static so that it can be called from modal onClick() call-backs.
     *
     * @param statusSettings a StatusSettings
     * @param supportedStatuses - an array of status specifications, for example `['b', 'Bookmark', 'x']`
     * @return An array of warning messages to show the user, one for each rejected exact duplicate status.
     *
     * @see {@link minimalSupportedStatuses}, {@link itsSupportedStatuses}
     */
    static bulkAddStatusCollection(statusSettings, supportedStatuses) {
        const notices = [];
        supportedStatuses.forEach((importedStatus) => {
            const hasStatus = statusSettings.customStatuses.find((element) => {
                return (element.symbol == importedStatus[0] &&
                    element.name == importedStatus[1] &&
                    element.nextStatusSymbol == importedStatus[2]);
            });
            if (!hasStatus) {
                StatusSettings.addStatus(statusSettings.customStatuses, Status_1.Status.createFromImportedValue(importedStatus));
            }
            else {
                notices.push(`The status ${importedStatus[1]} (${importedStatus[0]}) is already added.`);
            }
        });
        return notices;
    }
    /**
     * Retun a list of all the statuses in the settings - first the core ones, then the custom ones.
     * @param statusSettings
     */
    static allStatuses(statusSettings) {
        return statusSettings.coreStatuses.concat(statusSettings.customStatuses);
    }
    /**
     * Apply the custom statuses in the statusSettings object to the statusRegistry.
     * @param statusSettings
     * @param statusRegistry
     */
    static applyToStatusRegistry(statusSettings, statusRegistry) {
        statusRegistry.clearStatuses();
        StatusSettings.allStatuses(statusSettings).forEach((statusType) => {
            statusRegistry.add(statusType);
        });
    }
}
exports.StatusSettings = StatusSettings;
//# sourceMappingURL=StatusSettings.js.map