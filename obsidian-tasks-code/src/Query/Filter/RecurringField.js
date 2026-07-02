"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringField = void 0;
const FilterInstructionsBasedField_1 = require("./FilterInstructionsBasedField");
class RecurringField extends FilterInstructionsBasedField_1.FilterInstructionsBasedField {
    constructor() {
        super();
        this._filters.add('is recurring', (task) => task.recurrence !== null);
        this._filters.add('is not recurring', (task) => task.recurrence === null);
    }
    fieldName() {
        return 'recurring';
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Sorting
    // -----------------------------------------------------------------------------------------------------------------
    supportsSorting() {
        return true;
    }
    comparator() {
        // Recurring tasks sort before non-recurring ones
        return (a, b) => {
            if (a.recurrence !== null && b.recurrence === null) {
                return -1;
            }
            else if (a.recurrence === null && b.recurrence !== null) {
                return 1;
            }
            else {
                return 0;
            }
        };
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Grouping
    // -----------------------------------------------------------------------------------------------------------------
    supportsGrouping() {
        return true;
    }
    grouper() {
        return (task) => {
            if (task.recurrence !== null) {
                return ['Recurring'];
            }
            else {
                return ['Not Recurring'];
            }
        };
    }
}
exports.RecurringField = RecurringField;
//# sourceMappingURL=RecurringField.js.map