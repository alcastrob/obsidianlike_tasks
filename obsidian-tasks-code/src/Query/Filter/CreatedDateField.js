"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatedDateField = void 0;
const DateField_1 = require("./DateField");
/**
 * Support the 'created' search instruction.
 */
class CreatedDateField extends DateField_1.DateField {
    fieldName() {
        return 'created';
    }
    date(task) {
        return task.createdDate;
    }
    filterResultIfFieldMissing() {
        return false;
    }
}
exports.CreatedDateField = CreatedDateField;
//# sourceMappingURL=CreatedDateField.js.map