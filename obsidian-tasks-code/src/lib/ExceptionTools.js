"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMessageForException = errorMessageForException;
/**
 * Get the text to report after an exception is caught.
 * @param whatWasHappening - a description of what was happening at the time, preferably including any user inputs.
 * @param exception - object that was caught in a try/catch block.
 */
function errorMessageForException(whatWasHappening, exception) {
    const errorMessage = `Error: ${whatWasHappening}.
The error message was:
    `;
    let detail = '';
    if (exception instanceof Error) {
        detail += exception;
    }
    else {
        detail += 'Unknown error';
    }
    return `${errorMessage}"${detail}"`;
}
//# sourceMappingURL=ExceptionTools.js.map