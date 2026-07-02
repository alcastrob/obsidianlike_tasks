"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagsField = void 0;
const Sorter_1 = require("../Sort/Sorter");
const FilterInstructions_1 = require("./FilterInstructions");
const MultiTextField_1 = require("./MultiTextField");
/**
 * Support the 'tag' and 'tags' search instructions.
 *
 * Tags can be searched for with and without the hash tag at the start.
 */
class TagsField extends MultiTextField_1.MultiTextField {
    constructor() {
        super();
        this.filterInstructions = new FilterInstructions_1.FilterInstructions();
        this.filterInstructions.add(`has ${this.fieldNameSingular()}`, (task) => this.values(task).length > 0);
        this.filterInstructions.add(`has ${this.fieldNamePlural()}`, (task) => this.values(task).length > 0);
        this.filterInstructions.add(`no ${this.fieldNameSingular()}`, (task) => this.values(task).length === 0);
        this.filterInstructions.add(`no ${this.fieldNamePlural()}`, (task) => this.values(task).length === 0);
    }
    createFilterOrErrorMessage(line) {
        const filterResult = this.filterInstructions.createFilterOrErrorMessage(line);
        if (filterResult.isValid()) {
            return filterResult;
        }
        return super.createFilterOrErrorMessage(line);
    }
    canCreateFilterForLine(line) {
        if (this.filterInstructions.canCreateFilterForLine(line)) {
            return true;
        }
        return super.canCreateFilterForLine(line);
    }
    fieldNameSingular() {
        return 'tag';
    }
    values(task) {
        return task.tags;
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Sorting
    // -----------------------------------------------------------------------------------------------------------------
    supportsSorting() {
        return true;
    }
    /** Overridden to add support for tag number.
     *
     * @param line
     */
    createSorterFromLine(line) {
        const match = line.match(this.sorterRegExp());
        if (match === null) {
            return null;
        }
        const reverse = !!match[1];
        const propertyInstance = isNaN(+match[2]) ? 1 : +match[2];
        const comparator = TagsField.makeCompareByTagComparator(propertyInstance);
        return new Sorter_1.Sorter(line, this.fieldNameSingular(), comparator, reverse);
    }
    /**
     * Return a regular expression that will match a correctly-formed
     * instruction line for sorting Tasks by tag.
     *
     * `match[1]` will be either `reverse` or undefined.
     * `match[2]` will be either the tag number or undefined.
     */
    sorterRegExp() {
        return /^sort by tag( reverse)?[\s]*(\d+)?/i;
    }
    /**
     * Create a ${@link Comparator} that sorts by the first tag.
     */
    comparator() {
        return TagsField.makeCompareByTagComparator(1);
    }
    static makeCompareByTagComparator(propertyInstance) {
        return (a, b) => {
            // If no tags then assume they are equal.
            if (a.tags.length === 0 && b.tags.length === 0) {
                return 0;
            }
            else if (a.tags.length === 0) {
                // a is less than b
                return 1;
            }
            else if (b.tags.length === 0) {
                // b is less than a
                return -1;
            }
            // Arrays start at 0 but the users specify a tag starting at 1.
            const tagInstanceToSortBy = propertyInstance - 1;
            if (a.tags.length < propertyInstance && b.tags.length >= propertyInstance) {
                return 1;
            }
            else if (b.tags.length < propertyInstance && a.tags.length >= propertyInstance) {
                return -1;
            }
            else if (a.tags.length < propertyInstance && b.tags.length < propertyInstance) {
                return 0;
            }
            const tagA = a.tags[tagInstanceToSortBy];
            const tagB = b.tags[tagInstanceToSortBy];
            return tagA.localeCompare(tagB, undefined, { numeric: true });
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
            if (task.tags.length == 0) {
                return ['(No tags)'];
            }
            return task.tags;
        };
    }
}
exports.TagsField = TagsField;
//# sourceMappingURL=TagsField.js.map