"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelledDateField = void 0;
const DateField_1 = require("./DateField");
/**
 * Support the 'cancelled' search instruction.
 */
class CancelledDateField extends DateField_1.DateField {
    fieldName() {
        return 'cancelled';
    }
    date(task) {
        return task.cancelledDate;
    }
    filterResultIfFieldMissing() {
        return false;
    }
}
exports.CancelledDateField = CancelledDateField;
//# sourceMappingURL=CancelledDateField.js.map