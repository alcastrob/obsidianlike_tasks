"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterOrErrorMessage = void 0;
const QueryComponentOrError_1 = require("../QueryComponentOrError");
/**
 * A class which stores one of:
 * - The original instruction string - a line from a tasks code block
 * - An optional {@link Filter}
 * - An optional error message
 *
 * This is really currently a convenience for returning data from
 * {@link Field.createFilterOrErrorMessage()} and derived classes.
 *
 * By the time the code has finished with parsing the line, typically the
 * contained {@link Filter} will be saved, for later use in searching for Tasks
 * that match the user's filter instruction.
 */
class FilterOrErrorMessage {
    constructor(object) {
        this.object = object;
    }
    get instruction() {
        return this.object.instruction;
    }
    get filter() {
        return this.object.queryComponent;
    }
    isValid() {
        return this.object.isValid();
    }
    get error() {
        return this.object.error;
    }
    get filterFunction() {
        if (this.filter) {
            return this.filter.filterFunction;
        }
        else {
            return undefined;
        }
    }
    /**
     * Construct a FilterOrErrorMessage with the filter.
     *
     * This function allows a meaningful {@link Explanation} to be supplied.
     *
     * @param filter - a {@link Filter}
     */
    static fromFilter(filter) {
        return new FilterOrErrorMessage(QueryComponentOrError_1.QueryComponentOrError.fromObject(filter.instruction, filter));
    }
    /**
     * Construct a FilterOrErrorMessage with the given error message.
     * @param instruction
     * @param errorMessage
     */
    static fromError(instruction, errorMessage) {
        return new FilterOrErrorMessage(QueryComponentOrError_1.QueryComponentOrError.fromError(instruction, errorMessage));
    }
}
exports.FilterOrErrorMessage = FilterOrErrorMessage;
//# sourceMappingURL=FilterOrErrorMessage.js.map