"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Occurrence = void 0;
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
     *
     * Recurrence of all dates will be kept relative to the reference date.
     * For example: if the due date and the start date are given, the due date
     * is the reference date. Future occurrences will have a start date with the
     * same relative distance to the due date as the original task. For example
     * "starts one week before it is due".
     */
    get referenceDate() {
        return this.getReferenceDate();
    }
    /**
     *  Pick the reference date for occurrence based on importance.
     *  Assuming due date has the highest priority, then scheduled date,
     *  then start date, by default.
     *  The order differs if removeScheduledDateOnRecurrence is enabled.
     *  See [Priority of Dates](https://publish.obsidian.md/tasks/Getting+Started/Recurring+Tasks#Priority%20of%20Dates).
     *
     *  The Moment objects are cloned.
     *
     * @private
     */
    getReferenceDate() {
        const datesInPriorityOrder = this.getDatePriorityOrder();
        for (const date of datesInPriorityOrder) {
            if (date) {
                return window.moment(date);
            }
        }
        return null;
    }
    getDatePriorityOrder() {
        const { removeScheduledDateOnRecurrence } = (0, Settings_1.getSettings)();
        if (removeScheduledDateOnRecurrence) {
            // If the `removeScheduledDateOnRecurrence` setting is enabled, it does
            // not make sense to pick the scheduled date over the start date because
            // the scheduled date will be deleted in the newly created task. So if
            // this setting is enabled, we favour start date over scheduled date:
            return [this.dueDate, this.startDate, this.scheduledDate];
        }
        else {
            return [this.dueDate, this.scheduledDate, this.startDate];
        }
    }
    isIdenticalTo(other) {
        // Compare Date fields
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
     *
     * If the occurrence has no reference date, an empty {@link Occurrence} will be returned.
     *
     * @param nextReferenceDate
     */
    next(nextReferenceDate) {
        // Only if a reference date is given. A reference date will exist if at
        // least one of the other dates is set.
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
    /**
     * Gets next occurrence (start/scheduled/due date) keeping the relative distance
     * with the reference date
     *
     * @param nextReferenceDate
     * @param currentOccurrenceDate start/scheduled/due date
     * @private
     */
    nextOccurrenceDate(currentOccurrenceDate, nextReferenceDate) {
        if (currentOccurrenceDate === null) {
            return null;
        }
        const originalDifference = window.moment.duration(currentOccurrenceDate.diff(this.referenceDate));
        // Cloning so that original won't be manipulated:
        const nextOccurrence = window.moment(nextReferenceDate);
        // Rounding days to handle cross daylight-savings-time recurrences.
        nextOccurrence.add(Math.round(originalDifference.asDays()), 'days');
        return nextOccurrence;
    }
}
exports.Occurrence = Occurrence;
//# sourceMappingURL=Occurrence.js.map