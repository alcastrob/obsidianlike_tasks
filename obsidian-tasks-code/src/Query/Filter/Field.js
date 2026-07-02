"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Field = void 0;
const Sorter_1 = require("../Sort/Sorter");
const RegExpTools = __importStar(require("../../lib/RegExpTools"));
const Grouper_1 = require("../Group/Grouper");
/**
 * Field is an abstract base class for each type of filter instruction.
 *
 * For example, derived class StartDateField implements the parsing
 * of 'starts' instructions.
 *
 * The name 'Field' may seem confusing, as it might currently be
 * expected to have the word 'Filter' in the class name.
 *
 * Current thinking is that it may well evolve later to also implement
 * the presence and absence searches as well
 * (such 'no start date' and 'has start date').
 */
class Field {
    // -----------------------------------------------------------------------------------------------------------------
    // Filtering
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * Returns true if the class can parse the given instruction line.
     *
     * Current implementation simply checks whether the line matches
     * this.filterRegExp().
     * @param line - A line from a ```tasks``` block.
     */
    canCreateFilterForLine(line) {
        return Field.lineMatchesFilter(this.filterRegExp(), line);
    }
    /**
     * Does the given line match the given filter?
     * @param filter - A RegExp regular expression, that specifies one query instruction.
     *                 Or null, if the field does not support regexp-based filtering.
     * @param line - A line from a tasks code block query.
     * @protected
     */
    static lineMatchesFilter(filter, line) {
        if (filter) {
            return filter.test(line);
        }
        else {
            return false;
        }
    }
    /**
     * Return the match for the given filter, or null if it does not match
     * @param filterRegExp - A RegExp regular expression, that specifies one query instruction.
     *                       Or null, if the field does not support regexp-based filtering.
     * @param line - A line from a tasks code block query.
     * @protected
     */
    static getMatch(filterRegExp, line) {
        if (filterRegExp) {
            return line.match(filterRegExp);
        }
        else {
            return null;
        }
    }
    /**
     * Returns the singular form of the field's name.
     * @public
     *
     * @see fieldName
     * @see fieldNameSingularEscaped
     */
    fieldNameSingular() {
        return this.fieldName();
    }
    /**
     * Returns the singular form of the field's name, escaped for use in regular expressions.
     *
     * This is needed for field names that contain `.` in, for example.
     * @public
     *
     * @see fieldName
     * @see fieldNameSingular
     */
    fieldNameSingularEscaped() {
        return RegExpTools.escapeRegExp(this.fieldNameSingular());
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Sorting
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * Return whether the code for this field implements sorting of tasks.
     *
     * If overriding this to return true, in order to enable sorting,
     * the method {@link comparator} must also be overridden.
     */
    supportsSorting() {
        return false;
    }
    /**
     * Parse the line, and return either a {@link Sorter} object or null.
     *
     * This default implementation works for all fields that support
     * the default sorting pattern of `sort by <fieldName> (reverse)?`.
     *
     * Fields that offer more complicated 'sort by' options can override
     * this method.
     *
     * @param line - A 'sort by' line from a ```tasks``` block.
     */
    createSorterFromLine(line) {
        if (!this.supportsSorting()) {
            return null;
        }
        const match = Field.getMatch(this.sorterRegExp(), line);
        if (match === null) {
            return null;
        }
        const reverse = !!match[1];
        return this.createSorter(reverse);
    }
    /**
     * Return a regular expression that will match a correctly-formed
     * instruction line for sorting Tasks by this field.
     *
     * Throws if this field does not support sorting.
     *
     * `match[1]` will be either `reverse` or undefined.
     *
     * Fields that offer more complicated 'sort by' options can override
     * this method.
     */
    sorterRegExp() {
        if (!this.supportsSorting()) {
            throw new Error(`sorterRegExp() unimplemented for ${this.fieldNameSingular()}`);
        }
        return new RegExp(`^sort by ${this.fieldNameSingularEscaped()}( reverse)?`, 'i');
    }
    /**
     * Reconstruct a 'sorter by' instruction to use for sorting of this field.
     *
     * This is used to simplify the construction of {@link Sorter} objects.
     * @param reverse
     * @protected
     */
    sorterInstruction(reverse) {
        let instruction = `sort by ${this.fieldNameSingular()}`;
        if (reverse) {
            instruction += ' reverse';
        }
        return instruction;
    }
    /**
     * Return a function to compare two Task objects, for use in sorting by this field's value.
     *
     * See {@link supportsSorting} for what to do, to enable support of sorting in a
     * particular {@link Field} implementation.
     */
    comparator() {
        throw new Error(`comparator() unimplemented for ${this.fieldNameSingular()}`);
    }
    /**
     * Create a {@link Sorter} object for sorting tasks by this field's value.
     * @param reverse - false for normal sort order, true for reverse sort order.
     */
    createSorter(reverse) {
        return new Sorter_1.Sorter(this.sorterInstruction(reverse), this.fieldNameSingular(), this.comparator(), reverse);
    }
    /**
     * Create a {@link Sorter} object for sorting tasks by this field's value,
     * in the standard/normal sort order for this field.
     *
     * @see {@link createReverseSorter}
     */
    createNormalSorter() {
        return this.createSorter(false);
    }
    /**
     * Create a {@link Sorter} object for sorting tasks by this field's value,
     * in the reverse of the standard/normal sort order for this field.
     *
     * @see {@link createNormalSorter}
     */
    createReverseSorter() {
        return this.createSorter(true);
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Grouping
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * Return whether the code for this field implements grouping of tasks.
     *
     * If overriding this to return true, in order to enable grouping,
     * the method {@link grouper} must also be overridden.
     */
    supportsGrouping() {
        return false;
    }
    /**
     * Parse the line, and return either a {@link Grouper} object or null.
     *
     * This default implementation works for all fields that support
     * the default grouping pattern of `group by <fieldName> (reverse)?`.
     *
     * Fields that offer more complicated 'group by' options can override
     * this method.
     *
     * @param line - A 'group by' line from a ```tasks``` block.
     */
    createGrouperFromLine(line) {
        if (!this.supportsGrouping()) {
            return null;
        }
        const match = Field.getMatch(this.grouperRegExp(), line);
        if (match === null) {
            return null;
        }
        const reverse = !!match[1];
        return this.createGrouper(reverse);
    }
    /**
     * Return a regular expression that will match a correctly-formed
     * instruction line for grouping Tasks by this field.
     *
     * Throws if this field does not support grouping.
     *
     * `match[1]` will be either `reverse` or undefined.
     *
     * Fields that offer more complicated 'group by' options can override
     * this method.
     */
    grouperRegExp() {
        if (!this.supportsGrouping()) {
            throw new Error(`grouperRegExp() unimplemented for ${this.fieldNameSingular()}`);
        }
        // The $ at end is required to distinguish between group by status and status.name
        return new RegExp(`^group by ${this.fieldNameSingularEscaped()}( reverse)?$`, 'i');
    }
    /**
     * Reconstruct a 'group by' instruction to use for grouping of this field.
     *
     * This is used to simplify the construction of Grouper objects.
     * @param reverse
     * @protected
     */
    grouperInstruction(reverse) {
        let instruction = `group by ${this.fieldNameSingular()}`;
        if (reverse) {
            instruction += ' reverse';
        }
        return instruction;
    }
    /**
     * Return a function to get a list of a task's group names, for use in grouping by this field's value.
     *
     * See {@link supportsGrouping} for what to do, to enable support of grouping in a
     * particular {@link Field} implementation.
     */
    grouper() {
        throw new Error(`grouper() unimplemented for ${this.fieldNameSingular()}`);
    }
    /**
     * Create a {@link Grouper} object for grouping tasks by this field's value.
     * @param reverse - false for normal group order, true for reverse group order.
     */
    createGrouper(reverse) {
        return new Grouper_1.Grouper(this.grouperInstruction(reverse), this.fieldNameSingular(), this.grouper(), reverse);
    }
    /**
     * Create a {@link Grouper} object for grouping tasks by this field's value,
     * in the standard/normal group order for this field.
     *
     * @see {@link createReverseGrouper}
     */
    createNormalGrouper() {
        return this.createGrouper(false);
    }
    /**
     * Create a {@link Grouper} object for grouping tasks by this field's value,
     * in the reverse of the standard/normal group order for this field.
     *
     * @see {@link createNormalGrouper}
     */
    createReverseGrouper() {
        return this.createGrouper(true);
    }
}
exports.Field = Field;
//# sourceMappingURL=Field.js.map