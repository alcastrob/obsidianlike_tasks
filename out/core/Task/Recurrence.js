"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recurrence = void 0;
const rrule_1 = require("rrule");
const moment_1 = __importDefault(require("moment"));
class Recurrence {
    constructor({ rrule, baseOnToday, occurrence }) {
        this.rrule = rrule;
        this.baseOnToday = baseOnToday;
        this.occurrence = occurrence;
    }
    static fromText({ recurrenceRuleText, occurrence, }) {
        try {
            const match = recurrenceRuleText.match(/^([a-zA-Z0-9, !]+?)( when done)?$/i);
            if (match == null) {
                return null;
            }
            const isolatedRuleText = match[1].trim();
            const baseOnToday = match[2] !== undefined;
            const options = rrule_1.RRule.parseText(isolatedRuleText);
            if (options !== null) {
                const referenceDate = occurrence.referenceDate;
                if (!baseOnToday && referenceDate !== null) {
                    options.dtstart = (0, moment_1.default)(referenceDate).startOf('day').utc(true).toDate();
                }
                else {
                    options.dtstart = (0, moment_1.default)().startOf('day').utc(true).toDate();
                }
                const rrule = new rrule_1.RRule(options);
                return new Recurrence({
                    rrule,
                    baseOnToday,
                    occurrence,
                });
            }
        }
        catch {
            // Could not read recurrence rule. User possibly not done typing.
            return null;
        }
        return null;
    }
    toText() {
        let text = this.rrule.toText();
        if (this.baseOnToday) {
            text += ' when done';
        }
        return text;
    }
    /**
     * Returns the dates of the next occurrence or null if there is no next occurrence.
     *
     * @param today - Optional date representing the completion date. Defaults to today.
     */
    next(today = (0, moment_1.default)()) {
        const nextReferenceDate = this.nextReferenceDate(today);
        if (nextReferenceDate === null) {
            return null;
        }
        return this.occurrence.next(nextReferenceDate);
    }
    identicalTo(other) {
        if (this.baseOnToday !== other.baseOnToday) {
            return false;
        }
        if (!this.occurrence.isIdenticalTo(other.occurrence)) {
            return false;
        }
        return this.toText() === other.toText();
    }
    nextReferenceDate(today) {
        if (this.baseOnToday) {
            return this.nextReferenceDateFromToday(today.clone()).toDate();
        }
        else {
            return this.nextReferenceDateFromOriginalReferenceDate().toDate();
        }
    }
    nextReferenceDateFromToday(today) {
        const ruleBasedOnToday = new rrule_1.RRule({
            ...this.rrule.origOptions,
            dtstart: today.startOf('day').utc(true).toDate(),
        });
        return this.nextAfter(today.endOf('day'), ruleBasedOnToday);
    }
    nextReferenceDateFromOriginalReferenceDate() {
        const after = (0, moment_1.default)(this.occurrence.referenceDate ?? undefined).endOf('day');
        return this.nextAfter(after, this.rrule);
    }
    /**
     * nextAfter returns the next occurrence's date after `after`, based on the given rrule.
     *
     * In the special cases of monthly and yearly recurrences, there exists an edge case where an
     * occurrence after the given number of months or years is not possible (e.g. a task due
     * 2022-01-31 recurring "every month" would otherwise jump to 2022-03-31, skipping February).
     * `after` is walked backwards day by day until the recurrence lands in the expected month/year.
     */
    nextAfter(after, rrule) {
        after.utc(true);
        let next = moment_1.default.utc(rrule.after(after.toDate()));
        const asText = this.toText();
        const monthMatch = asText.match(/every( \d+)? month(s)?(.*)?/);
        if (monthMatch !== null) {
            if (!asText.includes(' on ')) {
                next = Recurrence.nextAfterMonths(after, next, rrule, monthMatch[1]);
            }
        }
        const yearMatch = asText.match(/every( \d+)? year(s)?(.*)?/);
        if (yearMatch !== null) {
            next = Recurrence.nextAfterYears(after, next, rrule, yearMatch[1]);
        }
        return Recurrence.addTimezone(next);
    }
    static nextAfterMonths(after, next, rrule, skippingMonths) {
        let parsedSkippingMonths = 1;
        if (skippingMonths !== undefined) {
            parsedSkippingMonths = Number.parseInt(skippingMonths.trim(), 10);
        }
        while (Recurrence.isSkippingTooManyMonths(after, next, parsedSkippingMonths)) {
            next = Recurrence.fromOneDayEarlier(after, rrule);
        }
        return next;
    }
    static isSkippingTooManyMonths(after, next, skippingMonths) {
        let diffMonths = next.month() - after.month();
        const diffYears = next.year() - after.year();
        diffMonths += diffYears * 12;
        return diffMonths > skippingMonths;
    }
    static nextAfterYears(after, next, rrule, skippingYears) {
        let parsedSkippingYears = 1;
        if (skippingYears !== undefined) {
            parsedSkippingYears = Number.parseInt(skippingYears.trim(), 10);
        }
        while (Recurrence.isSkippingTooManyYears(after, next, parsedSkippingYears)) {
            next = Recurrence.fromOneDayEarlier(after, rrule);
        }
        return next;
    }
    static isSkippingTooManyYears(after, next, skippingYears) {
        const diff = next.year() - after.year();
        return diff > skippingYears;
    }
    /**
     * WARNING: This method manipulates the given instance of `after`.
     */
    static fromOneDayEarlier(after, rrule) {
        after.subtract(1, 'days').endOf('day');
        const options = rrule.origOptions;
        options.dtstart = after.startOf('day').toDate();
        rrule = new rrule_1.RRule(options);
        return moment_1.default.utc(rrule.after(after.toDate()));
    }
    static addTimezone(date) {
        // Moment's local(true) has a bug where it returns an incorrect result if the input is on
        // the day of the year when DST kicks in, and the time of day is before DST kicks in.
        // Workaround: set the time of day to noon before calling local(true).
        const localTimeZone = moment_1.default
            .utc(date)
            .set({
            hour: 12,
            minute: 0,
            second: 0,
            millisecond: 0,
        })
            .local(true);
        return localTimeZone.startOf('day');
    }
}
exports.Recurrence = Recurrence;
//# sourceMappingURL=Recurrence.js.map