"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceTracker = void 0;
const Settings_1 = require("../Config/Settings");
/**
 * Helper class for measuring performance of code, and adding labels for profiling.
 *
 * @summary
 * When the user has **edited their Tasks plugin settings to set 'recordTimings' to true**,
 * this class will:
 *  - measure the elapsed time taken in sections of performance critical code,
 *  - write the elapsed time to the console, similar to `console.time()` and `console.timeEnd()`,
 *  - add markings to the Timing section of performance flame charts.
 * @example
 *  // How to use PerformanceTracker:
 *  const tracker = new PerformanceTracker('some descriptive text');
 *  tracker.start();
 *  // ... some slow code
 *  tracker.finish();
 */
class PerformanceTracker {
    constructor(labelForPerformance) {
        this.label = labelForPerformance;
        this.start();
    }
    start() {
        if (!this.recordTimings()) {
            return;
        }
        performance.mark(this.labelForStart());
    }
    finish() {
        if (!this.recordTimings()) {
            return;
        }
        performance.mark(this.labelForEnd());
        // Measure the time between the marks
        performance.measure(this.label, this.labelForStart(), this.labelForEnd());
        this.printDuration();
    }
    printDuration() {
        // Get all entries matching the name this.label
        const entries = performance.getEntriesByName(this.label);
        // Get the last entry, in case the operation with this label has been run more than once this session.
        const lastEntry = entries[entries.length - 1];
        // Log the duration to the console
        if (lastEntry) {
            console.log(this.label + ':', lastEntry.duration.toFixed(2), 'milliseconds');
        }
        else {
            console.log(`Measurement for ${this.label} not found`);
        }
    }
    labelForStart() {
        return `${this.label} - start`;
    }
    labelForEnd() {
        return `${this.label} - end`;
    }
    recordTimings() {
        const { debugSettings } = (0, Settings_1.getSettings)();
        return debugSettings.recordTimings;
    }
}
exports.PerformanceTracker = PerformanceTracker;
//# sourceMappingURL=PerformanceTracker.js.map