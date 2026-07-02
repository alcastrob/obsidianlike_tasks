"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependsOnField = void 0;
const Field_1 = require("./Field");
const FilterOrErrorMessage_1 = require("./FilterOrErrorMessage");
const FilterInstructions_1 = require("./FilterInstructions");
class DependsOnField extends Field_1.Field {
    constructor() {
        super();
        this.filterInstructions = new FilterInstructions_1.FilterInstructions();
        this.filterInstructions.add('has depends on', (task) => task.dependsOn.length > 0);
        this.filterInstructions.add('no depends on', (task) => task.dependsOn.length === 0);
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Filtering
    // -----------------------------------------------------------------------------------------------------------------
    canCreateFilterForLine(line) {
        if (this.filterInstructions.canCreateFilterForLine(line)) {
            return true;
        }
        return super.canCreateFilterForLine(line);
    }
    createFilterOrErrorMessage(line) {
        const filterResult = this.filterInstructions.createFilterOrErrorMessage(line);
        if (filterResult.isValid()) {
            return filterResult;
        }
        return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, 'Unknown instruction');
    }
    fieldName() {
        return 'blocked by';
    }
    filterRegExp() {
        return null;
    }
}
exports.DependsOnField = DependsOnField;
//# sourceMappingURL=DependsOnField.js.map