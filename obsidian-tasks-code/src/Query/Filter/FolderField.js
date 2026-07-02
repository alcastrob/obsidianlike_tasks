"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderField = void 0;
const TextField_1 = require("./TextField");
class FolderField extends TextField_1.TextField {
    fieldName() {
        return 'folder';
    }
    value(task) {
        return task.file.folder;
    }
    supportsGrouping() {
        return true;
    }
    grouper() {
        return (task) => {
            return [TextField_1.TextField.escapeMarkdownCharacters(this.value(task))];
        };
    }
}
exports.FolderField = FolderField;
//# sourceMappingURL=FolderField.js.map