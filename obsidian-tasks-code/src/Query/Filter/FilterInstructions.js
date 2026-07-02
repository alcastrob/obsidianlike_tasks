"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterInstructions = void 0;
const FilterInstruction_1 = require("./FilterInstruction");
const FilterOrErrorMessage_1 = require("./FilterOrErrorMessage");
/**
 * Implementation of a collection of instructions for filtering tasks.
 *
 * @example
 *     private readonly _filters = new FilterInstructions();
 *     this._filters.add('is recurring', (task) => task.recurrence !== null);
 *
 * @see FilterInstruction
 */
class FilterInstructions {
    constructor() {
        this._filters = [];
    }
    add(instruction, filter) {
        this._filters.push(new FilterInstruction_1.FilterInstruction(instruction, filter));
    }
    canCreateFilterForLine(line) {
        return this._filters.some((filter) => filter.canCreateFilterForLine(line));
    }
    createFilterOrErrorMessage(line) {
        for (const filter of this._filters) {
            const x = filter.createFilterOrErrorMessage(line);
            if (x.isValid()) {
                return x;
            }
        }
        return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, `do not understand filter: ${line}`);
    }
}
exports.FilterInstructions = FilterInstructions;
//# sourceMappingURL=FilterInstructions.js.map