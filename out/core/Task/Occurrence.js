"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Occurrence = void 0;
const moment_1 = __importDefault(require("moment"));
const DateTools_1 = require("../DateTime/DateTools");
const Settings_1 = require("../Config/Settings");
/**
 * A set of dates on a single instance of {@link Recurrence}.
 *
 * It is responsible for calculating the set of dates for the next occurrence.
 */
class Occurrence {
    constructor({ startDate = null, scheduledDate = null, dueDate = null, }) {
        this.startDate = startDate ?? null;
        this.scheduledDate = scheduledDate ?? null;
        this.dueDate = dueDate ?? null;
    }
    /**
     * The reference date is used to calculate future occurrences.
     *
     * Future occurrences will recur based on the reference date.
     * The reference date is the due date, if it is given.
     * Otherwise the scheduled date, if it is given. And so on.
     */
    get referenceDate() {
        return this.getReferenceDate();
    }
    getReferenceDate() {
        const datesInPriorityOrder = this.getDatePriorityOrder();
        for (const date of datesInPriorityOrder) {
            if (date) {
                return (0, moment_1.default)(date);
            }
        }
        return null;
    }
    getDatePriorityOrder() {
        const { removeScheduledDateOnRecurrence } = (0, Settings_1.getSettings)();
        if (removeScheduledDateOnRecurrence) {
            return [this.dueDate, this.startDate, this.scheduledDate];
        }
        else {
            return [this.dueDate, this.scheduledDate, this.startDate];
        }
    }
    isIdenticalTo(other) {
        if ((0, DateTools_1.compareByDate)(this.startDate, other.startDate) !== 0) {
            return false;
        }
        if ((0, DateTools_1.compareByDate)(this.scheduledDate, other.scheduledDate) !== 0) {
            return false;
        }
        if ((0, DateTools_1.compareByDate)(this.dueDate, other.dueDate) !== 0) {
            return false;
        }
        return true;
    }
    /**
     * Provides an {@link Occurrence} with the dates calculated relative to a new reference date.
     */
    next(nextReferenceDate) {
        if (this.referenceDate === null) {
            return new Occurrence({
                startDate: null,
                scheduledDate: null,
                dueDate: null,
            });
        }
        const hasStartDate = this.startDate !== null;
        const hasDueDate = this.dueDate !== null;
        const canRemoveScheduledDate = hasStartDate || hasDueDate;
        const { removeScheduledDateOnRecurrence } = (0, Settings_1.getSettings)();
        const shouldRemoveScheduledDate = removeScheduledDateOnRecurrence && canRemoveScheduledDate;
        const startDate = this.nextOccurrenceDate(this.startDate, nextReferenceDate);
        const scheduledDate = shouldRemoveScheduledDate
            ? null
            : this.nextOccurrenceDate(this.scheduledDate, nextReferenceDate);
        const dueDate = this.nextOccurrenceDate(this.dueDate, nextReferenceDate);
        return new Occurrence({
            startDate,
            scheduledDate,
            dueDate,
        });
    }
    nextOccurrenceDate(currentOccurrenceDate, nextReferenceDate) {
        if (currentOccurrenceDate === null) {
            return null;
        }
        const originalDifference = moment_1.default.duration(currentOccurrenceDate.diff(this.referenceDate));
        const nextOccurrence = (0, moment_1.default)(nextReferenceDate);
        nextOccurrence.add(Math.round(originalDifference.asDays()), 'days');
        return nextOccurrence;
    }
}
exports.Occurrence = Occurrence;
//# sourceMappingURL=Occurrence.js.map