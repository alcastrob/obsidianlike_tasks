import { RRule } from 'rrule';
import moment from 'moment';
import type { Moment } from 'moment';
import type { Occurrence } from './Occurrence';

export class Recurrence {
    private readonly rrule: RRule;
    private readonly baseOnToday: boolean;
    readonly occurrence: Occurrence;

    constructor({ rrule, baseOnToday, occurrence }: { rrule: RRule; baseOnToday: boolean; occurrence: Occurrence }) {
        this.rrule = rrule;
        this.baseOnToday = baseOnToday;
        this.occurrence = occurrence;
    }

    public static fromText({
        recurrenceRuleText,
        occurrence,
    }: {
        recurrenceRuleText: string;
        occurrence: Occurrence;
    }): Recurrence | null {
        try {
            const match = recurrenceRuleText.match(/^([a-zA-Z0-9, !]+?)( when done)?$/i);
            if (match == null) {
                return null;
            }

            const isolatedRuleText = match[1].trim();
            const baseOnToday = match[2] !== undefined;

            const options = RRule.parseText(isolatedRuleText);
            if (options !== null) {
                const referenceDate = occurrence.referenceDate;

                if (!baseOnToday && referenceDate !== null) {
                    options.dtstart = moment(referenceDate).startOf('day').utc(true).toDate();
                } else {
                    options.dtstart = moment().startOf('day').utc(true).toDate();
                }

                const rrule = new RRule(options);
                return new Recurrence({
                    rrule,
                    baseOnToday,
                    occurrence,
                });
            }
        } catch {
            // Could not read recurrence rule. User possibly not done typing.
            return null;
        }

        return null;
    }

    public toText(): string {
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
    public next(today: Moment = moment()): Occurrence | null {
        const nextReferenceDate = this.nextReferenceDate(today);

        if (nextReferenceDate === null) {
            return null;
        }

        return this.occurrence.next(nextReferenceDate);
    }

    public identicalTo(other: Recurrence) {
        if (this.baseOnToday !== other.baseOnToday) {
            return false;
        }

        if (!this.occurrence.isIdenticalTo(other.occurrence)) {
            return false;
        }

        return this.toText() === other.toText();
    }

    private nextReferenceDate(today: Moment): Date {
        if (this.baseOnToday) {
            return this.nextReferenceDateFromToday(today.clone()).toDate();
        } else {
            return this.nextReferenceDateFromOriginalReferenceDate().toDate();
        }
    }

    private nextReferenceDateFromToday(today: Moment): Moment {
        const ruleBasedOnToday = new RRule({
            ...this.rrule.origOptions,
            dtstart: today.startOf('day').utc(true).toDate(),
        });

        return this.nextAfter(today.endOf('day'), ruleBasedOnToday);
    }

    private nextReferenceDateFromOriginalReferenceDate(): Moment {
        const after = moment(this.occurrence.referenceDate ?? undefined).endOf('day');

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
    private nextAfter(after: Moment, rrule: RRule): Moment {
        after.utc(true);
        let next = moment.utc(rrule.after(after.toDate()));

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

    private static nextAfterMonths(
        after: Moment,
        next: Moment,
        rrule: RRule,
        skippingMonths: string | undefined,
    ): Moment {
        let parsedSkippingMonths: number = 1;
        if (skippingMonths !== undefined) {
            parsedSkippingMonths = Number.parseInt(skippingMonths.trim(), 10);
        }

        while (Recurrence.isSkippingTooManyMonths(after, next, parsedSkippingMonths)) {
            next = Recurrence.fromOneDayEarlier(after, rrule);
        }

        return next;
    }

    private static isSkippingTooManyMonths(after: Moment, next: Moment, skippingMonths: number): boolean {
        let diffMonths = next.month() - after.month();

        const diffYears = next.year() - after.year();
        diffMonths += diffYears * 12;

        return diffMonths > skippingMonths;
    }

    private static nextAfterYears(
        after: Moment,
        next: Moment,
        rrule: RRule,
        skippingYears: string | undefined,
    ): Moment {
        let parsedSkippingYears: number = 1;
        if (skippingYears !== undefined) {
            parsedSkippingYears = Number.parseInt(skippingYears.trim(), 10);
        }

        while (Recurrence.isSkippingTooManyYears(after, next, parsedSkippingYears)) {
            next = Recurrence.fromOneDayEarlier(after, rrule);
        }

        return next;
    }

    private static isSkippingTooManyYears(after: Moment, next: Moment, skippingYears: number): boolean {
        const diff = next.year() - after.year();

        return diff > skippingYears;
    }

    /**
     * WARNING: This method manipulates the given instance of `after`.
     */
    private static fromOneDayEarlier(after: Moment, rrule: RRule): Moment {
        after.subtract(1, 'days').endOf('day');

        const options = rrule.origOptions;
        options.dtstart = after.startOf('day').toDate();
        rrule = new RRule(options);

        return moment.utc(rrule.after(after.toDate()));
    }

    private static addTimezone(date: Moment): Moment {
        // Moment's local(true) has a bug where it returns an incorrect result if the input is on
        // the day of the year when DST kicks in, and the time of day is before DST kicks in.
        // Workaround: set the time of day to noon before calling local(true).
        const localTimeZone = moment
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
