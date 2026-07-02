"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetStatus = void 0;
exports.allStatusInstructions = allStatusInstructions;
const StatusSettings_1 = require("../../Config/StatusSettings");
/**
 * An instruction class, for editing a {@link Task} object's {@link Status}.
 */
class SetStatus {
    constructor(status) {
        this.newStatus = status;
    }
    apply(task) {
        if (this.isCheckedForTask(task)) {
            // Unchanged: return the input task:
            return [task];
        }
        else {
            return task.handleNewStatusWithRecurrenceInUsersOrder(this.newStatus);
        }
    }
    instructionDisplayName() {
        const commonTitle = 'Change status to:';
        return `${commonTitle} [${this.newStatus.symbol}] ${this.newStatus.name}`;
    }
    isCheckedForTask(task) {
        return this.newStatus.symbol === task.status.symbol;
    }
}
exports.SetStatus = SetStatus;
/**
 * Return all the available instructions for editing task statuses.
 */
function allStatusInstructions(statusRegistry) {
    const instructions = [];
    const coreStatuses = new StatusSettings_1.StatusSettings().coreStatuses.map((setting) => setting.symbol);
    // Put the core statuses at the top of the menu:
    for (const matchCoreTask of [true, false]) {
        for (const status of statusRegistry.registeredStatuses) {
            if (coreStatuses.includes(status.symbol) === matchCoreTask) {
                instructions.push(new SetStatus(status));
            }
        }
    }
    return instructions;
}
//# sourceMappingURL=StatusInstructions.js.map