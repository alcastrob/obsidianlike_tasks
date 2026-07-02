"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryComponentOrError = void 0;
/**
 * Generic class for storing:
 * - a text instruction.
 * - an object of type QueryComponent constructed from the instruction, if the instruction is valid.
 * - otherwise, an error message explaining in what wat the instruction is invalid.
 *
 * An example type of QueryComponent is {@link Filter}. See {@link FilterOrErrorMessage}.
 */
class QueryComponentOrError {
    constructor(instruction) {
        this.instruction = instruction;
    }
    get queryComponent() {
        return this._queryComponent;
    }
    set queryComponent(value) {
        this._queryComponent = value;
    }
    get error() {
        return this._error;
    }
    set error(value) {
        this._error = value;
    }
    /**
     * This object is valid if {@link queryComponent} isn't undefined.
     */
    isValid() {
        return this._queryComponent !== undefined;
    }
    /**
     * Construct an ObjectOrErrorMessage with the given QueryComponent.
     *
     * @param instruction
     * @param object - a {@link Filter}
     */
    static fromObject(instruction, object) {
        const result = new QueryComponentOrError(instruction);
        result._queryComponent = object;
        return result;
    }
    /**
     * Construct a ObjectOrErrorMessage with the given error message.
     * @param instruction
     * @param errorMessage
     */
    static fromError(instruction, errorMessage) {
        const result = new QueryComponentOrError(instruction);
        result._error = errorMessage;
        return result;
    }
}
exports.QueryComponentOrError = QueryComponentOrError;
//# sourceMappingURL=QueryComponentOrError.js.map