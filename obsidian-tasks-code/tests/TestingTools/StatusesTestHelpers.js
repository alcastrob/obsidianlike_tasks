"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coreStatusesData = void 0;
exports.createStatuses = createStatuses;
exports.constructStatuses = constructStatuses;
const StatusSettings_1 = require("../../src/Config/StatusSettings");
const Status_1 = require("../../src/Statuses/Status");
const StatusRegistry_1 = require("../../src/Statuses/StatusRegistry");
exports.coreStatusesData = [
    [' ', 'Todo', 'x', 'TODO'],
    ['x', 'Done', ' ', 'DONE'],
];
function createStatuses(coreStatusesData, customStatusesData) {
    // Populate StatusSettings:
    const statusSettings = new StatusSettings_1.StatusSettings();
    const core = statusSettings.coreStatuses;
    StatusSettings_1.StatusSettings.replaceStatus(core, core[0], Status_1.Status.createFromImportedValue(coreStatusesData[0]));
    StatusSettings_1.StatusSettings.replaceStatus(core, core[1], Status_1.Status.createFromImportedValue(coreStatusesData[1]));
    StatusSettings_1.StatusSettings.deleteAllCustomStatuses(statusSettings);
    customStatusesData.forEach((entry) => {
        StatusSettings_1.StatusSettings.addStatus(statusSettings.customStatuses, Status_1.Status.createFromImportedValue(entry));
    });
    // Populate StatusRegistry:
    const statusRegistry = new StatusRegistry_1.StatusRegistry();
    StatusSettings_1.StatusSettings.applyToStatusRegistry(statusSettings, statusRegistry);
    return { statusSettings, statusRegistry };
}
function constructStatuses(importedStatuses) {
    const statuses = [];
    importedStatuses.forEach((importedStatus) => {
        statuses.push(Status_1.Status.createFromImportedValue(importedStatus));
    });
    return statuses;
}
//# sourceMappingURL=StatusesTestHelpers.js.map