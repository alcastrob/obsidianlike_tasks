"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiTextField = void 0;
const Grouper_1 = require("../Group/Grouper");
const TextField_1 = require("./TextField");
/**
 * MultiTextField is an abstract base class to help implement
 * all the filter instructions that act on multiple string values
 * such as the tags.
 */
class MultiTextField extends TextField_1.TextField {
    /**
     * Returns the plural form of the field's name.
     * If not overridden, returns the singular form appended with an "s".
     */
    fieldNamePlural() {
        return this.fieldNameSingular() + 's';
    }
    fieldName() {
        return `${this.fieldNameSingular()}/${this.fieldNamePlural()}`;
    }
    fieldPattern() {
        return `${this.fieldNameSingular()}|${this.fieldNamePlural()}`;
    }
    filterOperatorPattern() {
        return `${super.filterOperatorPattern()}|include|do not include`;
    }
    /**
     * If not overridden, returns a comma-separated concatenation of all
     * the values of this field or an empty string if there are not values
     * @param task
     * @public
     */
    value(task) {
        return this.values(task).join(', ');
    }
    getFilter(matcher, negate) {
        return (task) => {
            const match = matcher.matchesAnyOf(this.values(task));
            return negate ? !match : match;
        };
    }
    /**
     * This overloads {@link Field.createGrouper} to put a plural field name in the {@link Grouper.property}.
     */
    createGrouper(reverse) {
        return new Grouper_1.Grouper(this.grouperInstruction(reverse), this.fieldNamePlural(), this.grouper(), reverse);
    }
    grouperRegExp() {
        if (!this.supportsGrouping()) {
            throw new Error(`grouperRegExp() unimplemented for ${this.fieldNameSingular()}`);
        }
        return new RegExp(`^group by ${this.fieldNamePlural()}( reverse)?$`, 'i');
    }
    grouperInstruction(reverse) {
        let instruction = `group by ${this.fieldNamePlural()}`;
        if (reverse) {
            instruction += ' reverse';
        }
        return instruction;
    }
}
exports.MultiTextField = MultiTextField;
//# sourceMappingURL=MultiTextField.js.map