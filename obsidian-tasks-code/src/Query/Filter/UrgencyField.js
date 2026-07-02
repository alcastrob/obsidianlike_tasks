"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrgencyField = void 0;
const Field_1 = require("./Field");
const FilterOrErrorMessage_1 = require("./FilterOrErrorMessage");
/**
 * Support 'urgency' sorting.
 *
 * Note: Searching by urgency is not yet implemented.
 */
class UrgencyField extends Field_1.Field {
    canCreateFilterForLine(_line) {
        return false;
    }
    createFilterOrErrorMessage(line) {
        return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, 'Filtering by urgency is not yet supported');
    }
    fieldName() {
        return 'urgency';
    }
    filterRegExp() {
        throw new Error(`filterRegExp() unimplemented for ${this.fieldName()}`);
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Sorting
    // -----------------------------------------------------------------------------------------------------------------
    supportsSorting() {
        return true;
    }
    comparator() {
        return (a, b) => {
            // Higher urgency should be sorted earlier.
            return b.urgency - a.urgency;
        };
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Grouping
    // -----------------------------------------------------------------------------------------------------------------
    supportsGrouping() {
        return true;
    }
    grouper() {
        // Note: Groups are sorted from low priority to high.
        // This will be improved in a future release, by allowing
        // the grouping code to take advantage of the comparator()
        // method above.
        return (task) => {
            return [`${task.urgency.toFixed(2)}`];
        };
    }
    /**
     * The {@link Field.createGrouper} creates a grouper that sorts by increasing values.
     * For {@link UrgencyField} the group sorting shall be done by decreasing values, so
     * the normal order here is the reverse of the regular one.
     *
     * @param reverse - false for normal group order (from most urgent to less urgent),
     * true for reverse group order.
     */
    createGrouper(reverse) {
        return super.createGrouper(!reverse);
    }
    grouperInstruction(reverse) {
        return super.grouperInstruction(!reverse);
    }
}
exports.UrgencyField = UrgencyField;
//# sourceMappingURL=UrgencyField.js.map