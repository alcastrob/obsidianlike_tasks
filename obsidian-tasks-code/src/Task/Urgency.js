"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Urgency = void 0;
const Priority_1 = require("./Priority");
class Urgency {
    static calculate(task) {
        let urgency = 0.0;
        if (task.dueDate?.isValid()) {
            // Map a range of 21 days to the value 0.2 - 1.0
            const startOfToday = window.moment().startOf('day');
            const daysOverdue = Math.round(startOfToday.diff(task.dueDate) / Urgency.milliSecondsPerDay);
            let dueMultiplier;
            if (daysOverdue >= 7.0) {
                dueMultiplier = 1.0; // < 1 wk ago
            }
            else if (daysOverdue >= -14.0) {
                // Due between 7 days (+7) ago and in 14 days (-14)
                dueMultiplier = ((daysOverdue + 14.0) * 0.8) / 21.0 + 0.2;
            }
            else {
                dueMultiplier = 0.2; // > 2 wks
            }
            urgency += dueMultiplier * Urgency.dueCoefficient;
        }
        if (task.scheduledDate?.isValid()) {
            if (window.moment().isSameOrAfter(task.scheduledDate)) {
                urgency += 1 * Urgency.scheduledCoefficient;
            }
        }
        if (task.startDate?.isValid()) {
            if (window.moment().isBefore(task.startDate)) {
                urgency += 1 * Urgency.startedCoefficient;
            }
        }
        switch (task.priority) {
            case Priority_1.Priority.Highest:
                urgency += 1.5 * Urgency.priorityCoefficient;
                break;
            case Priority_1.Priority.High:
                urgency += 1.0 * Urgency.priorityCoefficient;
                break;
            case Priority_1.Priority.Medium:
                urgency += 0.65 * Urgency.priorityCoefficient;
                break;
            case Priority_1.Priority.None:
                urgency += 0.325 * Urgency.priorityCoefficient;
                break;
            // no modification for "Low" priority
            case Priority_1.Priority.Lowest:
                urgency -= 0.3 * Urgency.priorityCoefficient;
                break;
        }
        return urgency;
    }
}
exports.Urgency = Urgency;
Urgency.dueCoefficient = 12.0;
Urgency.scheduledCoefficient = 5.0;
Urgency.startedCoefficient = -3.0;
Urgency.priorityCoefficient = 6.0;
Urgency.milliSecondsPerDay = 1000 * 60 * 60 * 24;
//# sourceMappingURL=Urgency.js.map