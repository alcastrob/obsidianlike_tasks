"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusField = void 0;
const FilterInstructionsBasedField_1 = require("./FilterInstructionsBasedField");
class StatusField extends FilterInstructionsBasedField_1.FilterInstructionsBasedField {
    constructor() {
        super();
        // Backwards-compatibility change: In Tasks 1.22.0 and earlier, all tasks
        // with any status character except space were considered by the status filter
        // instructions to be done.
        // In later versions:
        //   StatusType.DONE counts as done
        //   StatusType.CANCELLED counts as done
        //   StatusType.TODO counts as not done
        //   StatusType.IN_PROGRESS counts as not done
        //   StatusType.ON_HOLD counts as not done
        //   StatusType.NON_TASK counts as done
        this._filters.add('done', (task) => task.isDone);
        this._filters.add('not done', (task) => !task.isDone);
    }
    fieldName() {
        return 'status';
    }
    supportsSorting() {
        return true;
    }
    /**
     * Return a function to compare two Task objects, for use in sorting by status.
     * TODO and IN_PROGRESS types are sorted before the other types.
     */
    comparator() {
        return (a, b) => {
            const oldStatusNameA = StatusField.oldStatusName(a);
            const oldStatusNameB = StatusField.oldStatusName(b);
            if (oldStatusNameA < oldStatusNameB) {
                return 1;
            }
            else if (oldStatusNameA > oldStatusNameB) {
                return -1;
            }
            else {
                return 0;
            }
        };
    }
    static oldStatusName(a) {
        if (!a.isDone) {
            return 'Todo';
        }
        else {
            return 'Done';
        }
    }
    supportsGrouping() {
        return true;
    }
    /**
     * Return a function to name tasks, for use in grouping by status.
     * TODO and IN_PROGRESS types are grouped in 'Todo'.
     * Other status types are grouped in 'Done'.
     */
    grouper() {
        return (task) => {
            return [StatusField.oldStatusName(task)];
        };
    }
}
exports.StatusField = StatusField;
//# sourceMappingURL=StatusField.js.map