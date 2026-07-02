"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeadingField = void 0;
const TextField_1 = require("./TextField");
/** Support the 'heading' search instruction.
 *
 */
class HeadingField extends TextField_1.TextField {
    fieldName() {
        return 'heading';
    }
    /**
     * Returns the preceding heading, or an empty string if the heading is null
     * @param task
     * @public
     */
    value(task) {
        if (task.precedingHeader) {
            return task.precedingHeader;
        }
        else {
            return '';
        }
    }
    supportsSorting() {
        return true;
    }
    supportsGrouping() {
        return true;
    }
    grouper() {
        return (task) => {
            if (task.precedingHeader === null || task.precedingHeader.length === 0) {
                return ['(No heading)'];
            }
            return [task.precedingHeader];
        };
    }
}
exports.HeadingField = HeadingField;
//# sourceMappingURL=HeadingField.js.map