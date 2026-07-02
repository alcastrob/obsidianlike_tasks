"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HappensDateField = void 0;
const FilterInstructions_1 = require("./FilterInstructions");
const DateField_1 = require("./DateField");
/**
 * Support the 'happens' search instruction, which searches all of
 * start, scheduled and due dates.
 */
class HappensDateField extends DateField_1.DateField {
    constructor() {
        const filterInstructions = new FilterInstructions_1.FilterInstructions();
        filterInstructions.add('has happens date', (task) => this.dates(task).some((date) => date !== null));
        filterInstructions.add('no happens date', (task) => !this.dates(task).some((date) => date !== null));
        super(filterInstructions);
    }
    fieldName() {
        return 'happens';
    }
    fieldNameForExplanation() {
        return 'due, start or scheduled';
    }
    /**
     * Returns {@link earliestDate}
     * @param task
     */
    date(task) {
        return this.earliestDate(task);
    }
    /**
     * Return the task's start, scheduled and due dates, any or all of which may be null.
     */
    dates(task) {
        return task.happensDates;
    }
    /**
     * Return the earliest of the dates used by 'happens' in the given task, or null if none set.
     *
     * Generally speaking, the earliest date is considered to be the highest priority,
     * as it is the first point at which the user might wish to act on the task.
     * @param task
     */
    earliestDate(task) {
        return task.happens.moment;
    }
    filterResultIfFieldMissing() {
        return false;
    }
    getFilter(dateFilterFunction) {
        return (task) => {
            return this.dates(task).some((date) => dateFilterFunction(date));
        };
    }
}
exports.HappensDateField = HappensDateField;
//# sourceMappingURL=HappensDateField.js.map