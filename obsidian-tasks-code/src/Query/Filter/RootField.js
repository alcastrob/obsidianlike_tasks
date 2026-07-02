"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootField = void 0;
const TextField_1 = require("./TextField");
class RootField extends TextField_1.TextField {
    fieldName() {
        return 'root';
    }
    value(task) {
        return task.file.root;
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
exports.RootField = RootField;
//# sourceMappingURL=RootField.js.map