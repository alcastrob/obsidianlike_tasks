"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusConfiguration = exports.StatusType = void 0;
/**
 * Collection of status types supported by the plugin.
 */
var StatusType;
(function (StatusType) {
    StatusType["TODO"] = "TODO";
    StatusType["DONE"] = "DONE";
    StatusType["IN_PROGRESS"] = "IN_PROGRESS";
    StatusType["ON_HOLD"] = "ON_HOLD";
    StatusType["CANCELLED"] = "CANCELLED";
    StatusType["NON_TASK"] = "NON_TASK";
    StatusType["EMPTY"] = "EMPTY";
})(StatusType || (exports.StatusType = StatusType = {}));
/**
 * This is the object stored by the Obsidian configuration and used to create the status
 * objects for the session
 *
 * @class StatusConfiguration
 */
class StatusConfiguration {
    /**
     * Creates an instance of Status. The registry will be added later in the case
     * of the default statuses.
     *
     * @param {string} symbol
     * @param {string} name
     * @param {Status} nextStatusSymbol
     * @param {boolean} availableAsCommand
     * @param {StatusType} type
     */
    constructor(symbol, name, nextStatusSymbol, availableAsCommand, type = StatusType.TODO) {
        this.symbol = symbol;
        this.name = name;
        this.nextStatusSymbol = nextStatusSymbol;
        this.availableAsCommand = availableAsCommand;
        this.type = type;
    }
}
exports.StatusConfiguration = StatusConfiguration;
//# sourceMappingURL=StatusConfiguration.js.map