"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusTypeField = void 0;
const StatusConfiguration_1 = require("../../Statuses/StatusConfiguration");
const Explanation_1 = require("../Explain/Explanation");
const Field_1 = require("./Field");
const Filter_1 = require("./Filter");
const FilterOrErrorMessage_1 = require("./FilterOrErrorMessage");
/**
 * A ${@link Field} implementation for searching status.type
 */
class StatusTypeField extends Field_1.Field {
    // -----------------------------------------------------------------------------------------------------------------
    // Filtering
    // -----------------------------------------------------------------------------------------------------------------
    canCreateFilterForLine(line) {
        // Use a relaxed regexp, just checking field name and not the contents,
        // so that we can parse the line later and give meaningful errors if user uses invalid values.
        const relaxedRegExp = new RegExp(`^(?:${this.fieldNameSingularEscaped()})`, 'i');
        return Field_1.Field.lineMatchesFilter(relaxedRegExp, line);
    }
    createFilterOrErrorMessage(line) {
        const match = Field_1.Field.getMatch(this.filterRegExp(), line);
        if (match === null) {
            // It's OK to get here, because canCreateFilterForLine() uses a more relaxed regexp.
            return this.helpMessage(line);
        }
        const filterOperator = match[1].toLowerCase();
        const statusTypeAsString = match[2];
        const statusTypeElement = StatusConfiguration_1.StatusType[statusTypeAsString.toUpperCase()];
        if (!statusTypeElement) {
            return this.helpMessage(line);
        }
        let filterFunction;
        switch (filterOperator) {
            case 'is':
                filterFunction = (task) => {
                    return task.status.type === statusTypeElement;
                };
                break;
            case 'is not':
                filterFunction = (task) => {
                    return task.status.type !== statusTypeElement;
                };
                break;
            default:
                return this.helpMessage(line);
        }
        return FilterOrErrorMessage_1.FilterOrErrorMessage.fromFilter(new Filter_1.Filter(line, filterFunction, new Explanation_1.Explanation(line)));
    }
    filterRegExp() {
        return new RegExp(`^(?:${this.fieldNameSingularEscaped()}) (is|is not) ([^ ]+)$`, 'i');
    }
    helpMessage(line) {
        const allowedTypes = Object.values(StatusConfiguration_1.StatusType)
            .filter((t) => t !== StatusConfiguration_1.StatusType.EMPTY)
            .join(' ');
        const message = `Invalid ${this.fieldNameSingular()} instruction: '${line}'.
    Allowed options: 'is' and 'is not' (without quotes).
    Allowed values:  ${allowedTypes}
                     Note: values are case-insensitive,
                           so 'in_progress' works too, for example.
    Example:         ${this.fieldNameSingular()} is not NON_TASK`;
        return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, message);
    }
    fieldName() {
        return 'status.type';
    }
    value(task) {
        return task.status.type;
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Sorting
    // -----------------------------------------------------------------------------------------------------------------
    supportsSorting() {
        return true;
    }
    comparator() {
        return (a, b) => {
            const keyA = StatusTypeField.groupName(a);
            const keyB = StatusTypeField.groupName(b);
            return keyA.localeCompare(keyB, undefined, { numeric: true });
        };
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Grouping
    // -----------------------------------------------------------------------------------------------------------------
    supportsGrouping() {
        return true;
    }
    grouper() {
        return (task) => {
            return [StatusTypeField.groupName(task)];
        };
    }
    static groupName(task) {
        return task.status.typeGroupText;
    }
}
exports.StatusTypeField = StatusTypeField;
//# sourceMappingURL=StatusTypeField.js.map