"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterInstructionsBasedField = void 0;
const Field_1 = require("./Field");
const FilterInstructions_1 = require("./FilterInstructions");
/**
 * This class is an implementation for implements of {@link Field}
 *
 * The named of the class is weak. It is based solely on the fact that the
 * class is entirely implemented via the {@link FilterInstructions} class.
 */
class FilterInstructionsBasedField extends Field_1.Field {
    constructor() {
        super(...arguments);
        this._filters = new FilterInstructions_1.FilterInstructions();
    }
    canCreateFilterForLine(line) {
        return this._filters.canCreateFilterForLine(line);
    }
    createFilterOrErrorMessage(line) {
        return this._filters.createFilterOrErrorMessage(line);
    }
    filterRegExp() {
        return null;
    }
}
exports.FilterInstructionsBasedField = FilterInstructionsBasedField;
//# sourceMappingURL=FilterInstructionsBasedField.js.map