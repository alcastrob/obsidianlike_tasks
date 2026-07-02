"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusNameField = void 0;
const TextField_1 = require("./TextField");
/**
 * A {@link Field} implementation for searching status.name
 */
class StatusNameField extends TextField_1.TextField {
    constructor() {
        super();
    }
    fieldName() {
        return 'status.name';
    }
    value(task) {
        return task.status.name;
    }
    supportsSorting() {
        return true;
    }
    supportsGrouping() {
        return true;
    }
}
exports.StatusNameField = StatusNameField;
//# sourceMappingURL=StatusNameField.js.map