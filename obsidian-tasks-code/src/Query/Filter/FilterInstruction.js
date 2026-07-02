"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterInstruction = void 0;
const Explanation_1 = require("../Explain/Explanation");
const Filter_1 = require("./Filter");
const FilterOrErrorMessage_1 = require("./FilterOrErrorMessage");
/**
 * Implementation of a single instruction for filtering tasks, and its corresponding predicate.
 *
 * This is really a helper to simplify the implementation of individual filter
 * instructions, hiding away the details of parsing individual instruction lines.
 *
 * This will usually be accessed via {@link FilterInstructions.add}
 *
 * @see FilterInstructions
 */
class FilterInstruction {
    /**
     * Constructor:
     * @param instruction - Full text of the instruction for the filter: must be matched exactly, ignoring capitalisation.
     * @param filter
     */
    constructor(instruction, filter) {
        this._instruction = instruction;
        this._filter = filter;
    }
    canCreateFilterForLine(line) {
        return line.toLocaleLowerCase() === this._instruction.toLocaleLowerCase();
    }
    createFilterOrErrorMessage(line) {
        if (this.canCreateFilterForLine(line)) {
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromFilter(new Filter_1.Filter(line, this._filter, new Explanation_1.Explanation(line)));
        }
        return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, `do not understand filter: ${line}`);
    }
}
exports.FilterInstruction = FilterInstruction;
//# sourceMappingURL=FilterInstruction.js.map