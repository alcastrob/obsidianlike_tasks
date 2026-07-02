"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sorter = void 0;
const Statement_1 = require("../Statement");
/**
 * Sorter represents a single 'sort by' instruction.
 * It stores the comparison function as a {@link Comparator}.
 */
class Sorter {
    /**
     * Constructor.
     *
     * @param instruction - the query instruction that created this object
     * @param property - the name of the property.
     * @param comparator - {@link Comparator} function, for sorting in the standard direction.
     *                     If `reverse` is true, it will automatically be converted to reverse the sort direction.
     * @param reverse - whether the sort order should be reversed.
     */
    constructor(instruction, property, comparator, reverse) {
        this._statement = new Statement_1.Statement(instruction, instruction);
        this.property = property;
        this.comparator = Sorter.maybeReverse(reverse, comparator);
    }
    /**
     * Optionally record more detail about the source statement.
     *
     * In tests, we only care about the actual instruction being parsed and executed.
     * However, in {@link Query}, we want the ability to show user more information.
     */
    setStatement(statement) {
        this._statement = statement;
    }
    get statement() {
        return this._statement;
    }
    get instruction() {
        return this._statement.anyPlaceholdersExpanded;
    }
    static maybeReverse(reverse, comparator) {
        return reverse ? Sorter.makeReversedComparator(comparator) : comparator;
    }
    static makeReversedComparator(comparator) {
        // Note: This can return -0.
        return (a, b, searchInfo) => comparator(a, b, searchInfo) * -1;
    }
}
exports.Sorter = Sorter;
//# sourceMappingURL=Sorter.js.map