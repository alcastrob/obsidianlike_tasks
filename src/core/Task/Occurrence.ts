import moment from 'moment';
import type { Moment } from 'moment';
import { compareByDate } from '../DateTime/DateTools';
import { getSettings } from '../Config/Settings';

/**
 * A set of dates on a single instance of {@link Recurrence}.
 *
 * It is responsible for calculating the set of dates for the next occurrence.
 */
export class Occurrence {
    public readonly startDate: Moment | null;
    public readonly scheduledDate: Moment | null;
    public readonly dueDate: Moment | null;

    constructor({
        startDate = null,
        scheduledDate = null,
        dueDate = null,
    }: {
        startDate?: Moment | null;
        scheduledDate?: Moment | null;
        dueDate?: Moment | null;
    }) {
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
    public get referenceDate(): Moment | null {
        return this.getReferenceDate();
    }

    private getReferenceDate(): Moment | null {
        const datesInPriorityOrder = this.getDatePriorityOrder();

        for (const date of datesInPriorityOrder) {
            if (date) {
                return moment(date);
            }
        }

        return null;
    }

    private getDatePriorityOrder(): (Moment | null)[] {
        const { removeScheduledDateOnRecurrence } = getSettings();
        if (removeScheduledDateOnRecurrence) {
            return [this.dueDate, this.startDate, this.scheduledDate];
        } else {
            return [this.dueDate, this.scheduledDate, this.startDate];
        }
    }

    public isIdenticalTo(other: Occurrence): boolean {
        if (compareByDate(this.startDate, other.startDate) !== 0) {
            return false;
        }
        if (compareByDate(this.scheduledDate, other.scheduledDate) !== 0) {
            return false;
        }
        if (compareByDate(this.dueDate, other.dueDate) !== 0) {
            return false;
        }

        return true;
    }

    /**
     * Provides an {@link Occurrence} with the dates calculated relative to a new reference date.
     */
    public next(nextReferenceDate: Date): Occurrence {
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

        const { removeScheduledDateOnRecurrence } = getSettings();
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

    private nextOccurrenceDate(currentOccurrenceDate: Moment | null, nextReferenceDate: Date): Moment | null {
        if (currentOccurrenceDate === null) {
            return null;
        }
        const originalDifference = moment.duration(currentOccurrenceDate.diff(this.referenceDate));

        const nextOccurrence = moment(nextReferenceDate);
        nextOccurrence.add(Math.round(originalDifference.asDays()), 'days');
        return nextOccurrence;
    }
}
