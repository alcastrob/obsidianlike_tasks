"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartDateField = void 0;
const DateField_1 = require("./DateField");
/**
 * Support the 'starts' search instruction.
 */
class StartDateField extends DateField_1.DateField {
    fieldName() {
        return 'start';
    }
    fieldNameForFilterInstruction() {
        return 'starts';
    }
    date(task) {
        return task.startDate;
    }
    filterResultIfFieldMissing() {
        // reference: https://publish.obsidian.md/tasks/Queries/Filters#Start+Date
        return true;
    }
}
exports.StartDateField = StartDateField;
//# sourceMappingURL=StartDateField.js.map