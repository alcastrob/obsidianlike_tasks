"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugSettings = void 0;
class DebugSettings {
    constructor(ignoreSortInstructions = false, showTaskHiddenData = false, recordTimings = false) {
        this.ignoreSortInstructions = ignoreSortInstructions;
        this.showTaskHiddenData = showTaskHiddenData;
        this.recordTimings = recordTimings; // Enables or disables PerformanceTracker
    }
}
exports.DebugSettings = DebugSettings;
//# sourceMappingURL=DebugSettings.js.map