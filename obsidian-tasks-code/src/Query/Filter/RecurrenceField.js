"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurrenceField = void 0;
const TextField_1 = require("./TextField");
class RecurrenceField extends TextField_1.TextField {
    fieldName() {
        return 'recurrence';
    }
    value(task) {
        if (task.recurrence !== null) {
            return task.recurrence.toText();
        }
        else {
            return '';
        }
    }
    supportsGrouping() {
        return true;
    }
    grouper() {
        return (task) => {
            if (task.recurrence !== null) {
                return [task.recurrence.toText()];
            }
            else {
                return ['None'];
            }
        };
    }
}
exports.RecurrenceField = RecurrenceField;
//# sourceMappingURL=RecurrenceField.js.map