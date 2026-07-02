"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DueDateField = void 0;
const DateField_1 = require("./DateField");
/**
 * Support the 'due' search instruction.
 */
class DueDateField extends DateField_1.DateField {
    fieldName() {
        return 'due';
    }
    date(task) {
        return task.dueDate;
    }
    filterResultIfFieldMissing() {
        return false;
    }
}
exports.DueDateField = DueDateField;
//# sourceMappingURL=DueDateField.js.map