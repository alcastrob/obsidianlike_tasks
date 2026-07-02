"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdField = void 0;
const FilterInstructions_1 = require("./FilterInstructions");
const TextField_1 = require("./TextField");
class IdField extends TextField_1.TextField {
    constructor() {
        super();
        this.filterInstructions = new FilterInstructions_1.FilterInstructions();
        this.filterInstructions.add('has id', (task) => task.id.length > 0);
        this.filterInstructions.add('no id', (task) => task.id.length === 0);
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
        return super.createFilterOrErrorMessage(line);
    }
    fieldName() {
        return 'id';
    }
    value(task) {
        return task.id;
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Sorting
    // -----------------------------------------------------------------------------------------------------------------
    supportsSorting() {
        return true;
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Grouping
    // -----------------------------------------------------------------------------------------------------------------
    supportsGrouping() {
        return true;
    }
}
exports.IdField = IdField;
//# sourceMappingURL=IdField.js.map