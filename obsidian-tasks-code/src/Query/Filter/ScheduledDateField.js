"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledDateField = void 0;
const DateField_1 = require("./DateField");
/**
 * Support the 'scheduled' search instruction.
 */
class ScheduledDateField extends DateField_1.DateField {
    fieldName() {
        return 'scheduled';
    }
    date(task) {
        return task.scheduledDate;
    }
    filterResultIfFieldMissing() {
        return false;
    }
}
exports.ScheduledDateField = ScheduledDateField;
//# sourceMappingURL=ScheduledDateField.js.map