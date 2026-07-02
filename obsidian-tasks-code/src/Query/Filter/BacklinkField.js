"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacklinkField = void 0;
const FilterOrErrorMessage_1 = require("./FilterOrErrorMessage");
const TextField_1 = require("./TextField");
class BacklinkField extends TextField_1.TextField {
    fieldName() {
        return 'backlink';
    }
    value(task) {
        const linkText = task.getLinkText({ isFilenameUnique: true });
        if (linkText === null) {
            return 'Unknown Location';
        }
        return linkText;
    }
    createFilterOrErrorMessage(line) {
        return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, 'backlink field does not support filtering');
    }
    canCreateFilterForLine(_line) {
        return false;
    }
    supportsGrouping() {
        return true;
    }
    grouper() {
        return (task) => {
            const filename = task.filename;
            if (filename === null) {
                return ['Unknown Location'];
            }
            const header = task.precedingHeader;
            if (header === null) {
                return ['[[' + filename + ']]'];
            }
            // Always append the header, to ensure we navigate to the correct section of the file:
            return [`[[${filename}#${header}|${filename} > ${header}]]`];
        };
    }
}
exports.BacklinkField = BacklinkField;
//# sourceMappingURL=BacklinkField.js.map