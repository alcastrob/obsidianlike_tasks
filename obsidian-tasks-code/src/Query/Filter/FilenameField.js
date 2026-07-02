"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilenameField = void 0;
const TextField_1 = require("./TextField");
/** Support the 'filename' search instruction.
 *
 * Note that the current implementation also searches the file extension,
 * so 'filename includes .md' will typically match all tasks.
 *
 */
class FilenameField extends TextField_1.TextField {
    fieldName() {
        return 'filename';
    }
    /**
     * Returns the file name including file extension, or an empty string if the task does not have a filename
     * @param task
     * @public
     */
    value(task) {
        const filename = task.filename;
        if (filename === null) {
            return '';
        }
        return filename + '.md';
    }
    supportsSorting() {
        return true;
    }
    supportsGrouping() {
        return true;
    }
    grouper() {
        return (task) => {
            // Note current limitation: Tasks from different notes with the
            // same name will be grouped together, even though they are in
            // different files and their links will look different.
            const filename = task.filename;
            if (filename === null) {
                return ['Unknown Location'];
            }
            return ['[[' + filename + ']]'];
        };
    }
}
exports.FilenameField = FilenameField;
//# sourceMappingURL=FilenameField.js.map