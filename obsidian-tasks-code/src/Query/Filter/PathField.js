"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathField = void 0;
const TextField_1 = require("./TextField");
/** Support the 'path' search instruction.
 *
 * Note that the current implementation also searches the file extension,
 * so 'path includes .md' will typically match all tasks.
 *
 */
class PathField extends TextField_1.TextField {
    fieldName() {
        return 'path';
    }
    /**
     * Returns the file path including file extension, or an empty string if the path is null
     * @param task
     * @public
     */
    value(task) {
        return task.path;
    }
    supportsSorting() {
        return true;
    }
    supportsGrouping() {
        return true;
    }
    grouper() {
        return (task) => {
            // Does this need to be made stricter?
            // Is there a better way of getting the file name?
            return [TextField_1.TextField.escapeMarkdownCharacters(task.path.replace('.md', ''))];
        };
    }
}
exports.PathField = PathField;
//# sourceMappingURL=PathField.js.map