"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurrenceBuilder = void 0;
const Occurrence_1 = require("../../src/Task/Occurrence");
const Recurrence_1 = require("../../src/Task/Recurrence");
const DateParser_1 = require("../../src/DateTime/DateParser");
/**
 * A fluent class for creating Recurrence objects for tests.
 *
 * This uses the Builder Pattern.
 *
 * See RecurrenceBuilder.build() for an example of use.
 *
 * IMPORTANT: Changed values are retained after calls to .build()
 *            There is no way to reset a RecurrenceBuilder to its default
 *            start currently.
 *            Create a new RecurrenceBuilder object to start from a clean state,
 */
class RecurrenceBuilder {
    constructor() {
        this._recurrenceRuleText = 'every day';
        this._startDate = null;
        this._scheduledDate = null;
        this._dueDate = null;
    }
    /**
     * Build a Recurrence
     *
     * Example of use:
     *
     *  const builder = new RecurrenceBuilder();
     *  const recurrence = builder
     *      .rule('every week when done')
     *      .startDate('2022-07-14')
     *      .build();
     */
    build() {
        return Recurrence_1.Recurrence.fromText({
            recurrenceRuleText: this._recurrenceRuleText,
            occurrence: new Occurrence_1.Occurrence({
                startDate: this._startDate,
                scheduledDate: this._scheduledDate,
                dueDate: this._dueDate,
            }),
        });
    }
    rule(recurrenceRuleText) {
        this._recurrenceRuleText = recurrenceRuleText;
        return this;
    }
    startDate(startDate) {
        this._startDate = RecurrenceBuilder.parseDate(startDate);
        return this;
    }
    scheduledDate(scheduledDate) {
        this._scheduledDate = RecurrenceBuilder.parseDate(scheduledDate);
        return this;
    }
    dueDate(dueDate) {
        this._dueDate = RecurrenceBuilder.parseDate(dueDate);
        return this;
    }
    static parseDate(date) {
        if (date) {
            return DateParser_1.DateParser.parseDate(date);
        }
        else {
            return null;
        }
    }
}
exports.RecurrenceBuilder = RecurrenceBuilder;
//# sourceMappingURL=RecurrenceBuilder.js.map