"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionOrError = void 0;
exports.parseExpression = parseExpression;
exports.evaluateExpression = evaluateExpression;
exports.evaluateExpressionOrCatch = evaluateExpressionOrCatch;
const QueryComponentOrError_1 = require("../Query/QueryComponentOrError");
const ExceptionTools_1 = require("../lib/ExceptionTools");
const EnableJsInTasksQueries_1 = require("../Config/EnableJsInTasksQueries");
const JsInTasksQueriesDisabledError_1 = require("./JsInTasksQueriesDisabledError");
class FunctionOrError extends QueryComponentOrError_1.QueryComponentOrError {
}
exports.FunctionOrError = FunctionOrError;
/**
 * Parse a JavaScript expression, and return either a Function or an error message in a string.
 * @param paramsArgs
 * @param arg
 *
 * @see evaluateExpression
 * @see evaluateExpressionOrCatch
 */
function parseExpression(paramsArgs, arg) {
    if (!EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().get()) {
        throw new JsInTasksQueriesDisabledError_1.JsInTasksQueriesDisabledError();
    }
    try {
        const parameterNames = paramsArgs.map(([name]) => name);
        const input = arg.includes('return') ? arg : `return ${arg}`;
        const expression = arg && new Function(...parameterNames, input);
        if (expression instanceof Function) {
            return FunctionOrError.fromObject(arg, expression);
        }
        // I have not managed to write a test that reaches here:
        return FunctionOrError.fromError(arg, `Problem parsing expression "${arg}"`);
    }
    catch (e) {
        return FunctionOrError.fromError(arg, (0, ExceptionTools_1.errorMessageForException)(`Failed parsing expression "${arg}"`, e));
    }
}
/**
 * Evaluate an arbitrary JavaScript expression, throwing an exception if the calculation failed.
 * @param expression
 * @param paramsArgs
 *
 * @see parseExpression
 * @see evaluateExpressionOrCatch
 */
function evaluateExpression(expression, paramsArgs) {
    if (!EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().get()) {
        throw new JsInTasksQueriesDisabledError_1.JsInTasksQueriesDisabledError();
    }
    const parameterValues = paramsArgs.map(([_, value]) => value);
    return expression(...parameterValues);
}
/**
 * Evaluate an arbitrary JavaScript expression, returning an error message if the calculation failed.
 * @param expression
 * @param paramsArgs
 * @param arg
 *
 * @see parseExpression
 * @see evaluateExpression
 */
function evaluateExpressionOrCatch(expression, paramsArgs, arg) {
    try {
        return evaluateExpression(expression, paramsArgs);
    }
    catch (e) {
        return (0, ExceptionTools_1.errorMessageForException)(`Failed calculating expression "${arg}"`, e);
    }
}
//# sourceMappingURL=Expression.js.map