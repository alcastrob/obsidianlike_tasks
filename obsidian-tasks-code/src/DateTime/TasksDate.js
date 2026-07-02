"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksDate = void 0;
const obsidian_1 = require("obsidian");
const PropertyCategory_1 = require("../lib/PropertyCategory");
const TaskRegularExpressions_1 = require("../Task/TaskRegularExpressions");
/**
 * TasksDate encapsulates a date, for simplifying the JavaScript expressions users need to
 * write in 'group by function' lines.
 */
class TasksDate {
    constructor(date) {
        this._date = null;
        this._date = date;
    }
    /**
     * Return the raw underlying moment (or null, if there is no date)
     */
    get moment() {
        return this._date ? this._date.clone() : null;
    }
    /**
     * Return the date formatted as YYYY-MM-DD, or {@link fallBackText} if there is no date.
     @param fallBackText - the string to use if the date is null. Defaults to empty string.
     */
    formatAsDate(fallBackText = '') {
        return this.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat, fallBackText);
    }
    /**
     * Return the date formatted as YYYY-MM-DD HH:mm, or {@link fallBackText} if there is no date.
     @param fallBackText - the string to use if the date is null. Defaults to empty string.
     */
    formatAsDateAndTime(fallBackText = '') {
        return this.format(TaskRegularExpressions_1.TaskRegularExpressions.dateTimeFormat, fallBackText);
    }
    /**
     * Return the date formatted with the given format string, or {@link fallBackText} if there is no date.
     * See https://momentjs.com/docs/#/displaying/ for all the available formatting options.
     * @param format
     * @param fallBackText - the string to use if the date is null. Defaults to empty string.
     */
    format(format, fallBackText = '') {
        return this._date ? this._date.format(format) : fallBackText;
    }
    /**
     * Return the date as an ISO string, for example '2023-10-13T00:00:00.000Z'.
     * @param keepOffset
     * @returns - The date as an ISO string, for example: '2023-10-13T00:00:00.000Z',
     *            OR an empty string if no date, OR null for an invalid date.
     */
    toISOString(keepOffset) {
        return this._date ? this._date.toISOString(keepOffset) : '';
    }
    get category() {
        // begin-snippet: use-moment-in-src
        const today = window.moment();
        // end-snippet
        const date = this.moment;
        if (!date) {
            return new PropertyCategory_1.PropertyCategory('Undated', 4);
        }
        if (date.isBefore(today, 'day')) {
            return new PropertyCategory_1.PropertyCategory('Overdue', 1);
        }
        if (date.isSame(today, 'day')) {
            return new PropertyCategory_1.PropertyCategory('Today', 2);
        }
        if (!date.isValid()) {
            return new PropertyCategory_1.PropertyCategory('Invalid date', 0);
        }
        return new PropertyCategory_1.PropertyCategory('Future', 3);
    }
    get fromNow() {
        const date = this.moment;
        if (!date) {
            return new PropertyCategory_1.PropertyCategory('', 0);
        }
        const order = this.fromNowOrder(date);
        return new PropertyCategory_1.PropertyCategory(date.fromNow(), order);
    }
    fromNowOrder(date) {
        // Always put invalid dates first:
        if (!date.isValid()) {
            return 0;
        }
        // Calculate a number that:
        //   - is the same for all dates with the same 'fromNow()' name,
        //   - sorts in ascending order of the date.
        const now = window.moment();
        const earlier = date.isSameOrBefore(now, 'second');
        const startDateOfThisGroup = this.fromNowStartDateOfGroup(date, earlier, now);
        const splitPastAndFutureDates = earlier ? 1 : 3;
        return Number(splitPastAndFutureDates + startDateOfThisGroup.format('YYYYMMDDHHmm'));
    }
    fromNowStartDateOfGroup(date, earlier, now) {
        // Calculate the earliest of all dates with the same 'fromNow()' name.
        // https://momentjs.com/docs/#/displaying/fromnow/
        // 'If you pass true, you can get the value without the suffix.'
        // We change the locale to english, to get values like 'hours', 'days', 'years' that we can pass to Moment.
        const words = date.clone().locale('en').fromNow(true).split(' ');
        let multiplier;
        const word0AsNumber = Number(words[0]);
        if (isNaN(word0AsNumber)) {
            multiplier = 1; // examples: 'a year', 'a month', 'a day'
        }
        else {
            multiplier = word0AsNumber; // examples: '10 years', '6 months', '11 hours'
        }
        const unit = words[1]; // day, days, weeks, month, year
        return earlier ? now.subtract(multiplier, unit) : now.add(multiplier, unit);
    }
    postpone(unitOfTime = 'days', amount = 1) {
        if (!this._date)
            throw new obsidian_1.Notice('Cannot postpone a null date');
        const today = window.moment().startOf('day');
        // According to the moment.js docs, isBefore is not stable so we use !isSameOrAfter: https://momentjs.com/docs/#/query/is-before/
        const isDateBeforeToday = !this._date.isSameOrAfter(today, 'day');
        if (isDateBeforeToday) {
            return today.add(amount, unitOfTime);
        }
        return this._date.clone().add(amount, unitOfTime);
    }
}
exports.TasksDate = TasksDate;
//# sourceMappingURL=TasksDate.js.map