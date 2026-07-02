"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoneDateField = void 0;
const DateField_1 = require("./DateField");
/**
 * Support the 'done' search instruction.
 */
class DoneDateField extends DateField_1.DateField {
    fieldName() {
        return 'done';
    }
    date(task) {
        return task.doneDate;
    }
    filterResultIfFieldMissing() {
        return false;
    }
}
exports.DoneDateField = DoneDateField;
//# sourceMappingURL=DoneDateField.js.map