"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcludeSubItemsField = void 0;
const FilterInstructionsBasedField_1 = require("./FilterInstructionsBasedField");
/**
 * Implements 'exclude sub-items' filter
 */
class ExcludeSubItemsField extends FilterInstructionsBasedField_1.FilterInstructionsBasedField {
    constructor() {
        super();
        this._filters.add('exclude sub-items', (task) => {
            if (task.indentation === '')
                return true; // no indentation, not a subitem
            const lastBlockquoteMark = task.indentation.lastIndexOf('>');
            if (lastBlockquoteMark === -1)
                return false; // indentation present, not in a blockquote, subitem
            // Up to one space allowed after last > in blockquote/callout, otherwise subitem
            return /^ ?$/.test(task.indentation.slice(lastBlockquoteMark + 1));
        });
    }
    fieldName() {
        return 'exclude';
    }
}
exports.ExcludeSubItemsField = ExcludeSubItemsField;
//# sourceMappingURL=ExcludeSubItemsField.js.map