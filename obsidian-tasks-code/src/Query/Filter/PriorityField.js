"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityField = void 0;
const Explanation_1 = require("../Explain/Explanation");
const Priority_1 = require("../../Task/Priority");
const Field_1 = require("./Field");
const Filter_1 = require("./Filter");
const FilterOrErrorMessage_1 = require("./FilterOrErrorMessage");
class PriorityField extends Field_1.Field {
    createFilterOrErrorMessage(line) {
        const priorityMatch = Field_1.Field.getMatch(this.filterRegExp(), line);
        if (priorityMatch !== null) {
            const filterPriorityString = priorityMatch[5];
            let filterPriority = null;
            switch (filterPriorityString.toLowerCase()) {
                case 'lowest':
                    filterPriority = Priority_1.Priority.Lowest;
                    break;
                case 'low':
                    filterPriority = Priority_1.Priority.Low;
                    break;
                case 'none':
                    filterPriority = Priority_1.Priority.None;
                    break;
                case 'medium':
                    filterPriority = Priority_1.Priority.Medium;
                    break;
                case 'high':
                    filterPriority = Priority_1.Priority.High;
                    break;
                case 'highest':
                    filterPriority = Priority_1.Priority.Highest;
                    break;
            }
            if (filterPriority === null) {
                return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, 'do not understand priority');
            }
            let explanation = line;
            let filter;
            switch (priorityMatch[3]?.toLowerCase()) {
                case 'above':
                    filter = (task) => task.priority.localeCompare(filterPriority) < 0;
                    break;
                case 'below':
                    filter = (task) => task.priority.localeCompare(filterPriority) > 0;
                    break;
                case 'not':
                    filter = (task) => task.priority !== filterPriority;
                    break;
                default:
                    filter = (task) => task.priority === filterPriority;
                    explanation = `${this.fieldName()} is ${filterPriorityString}`;
            }
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromFilter(new Filter_1.Filter(line, filter, new Explanation_1.Explanation(explanation)));
        }
        else {
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, 'do not understand query filter (priority)');
        }
    }
    fieldName() {
        return 'priority';
    }
    filterRegExp() {
        return PriorityField.priorityRegexp;
    }
    supportsSorting() {
        return true;
    }
    comparator() {
        return (a, b) => {
            return a.priority.localeCompare(b.priority);
        };
    }
    supportsGrouping() {
        return true;
    }
    grouper() {
        return (task) => {
            return [task.priorityNameGroupText];
        };
    }
}
exports.PriorityField = PriorityField;
// The trick in the following to manage whitespace with optional values
// is to capture them in Nested Capture Groups, like this:
//  (leading-white-space-in-outer-capture-group(values-to-use-are-in-inner-capture-group))
// The capture groups are numbered in the order of their opening brackets, from left to right.
PriorityField.priorityRegexp = /^priority(\s+is)?(\s+(above|below|not))?(\s+(lowest|low|none|medium|high|highest))$/i;
//# sourceMappingURL=PriorityField.js.map