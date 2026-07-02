"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskExpression = void 0;
exports.constructArguments = constructArguments;
exports.parseAndEvaluateExpression = parseAndEvaluateExpression;
const Expression_1 = require("./Expression");
/**
 *  From: https://www.educative.io/answers/parameter-vs-argument
 *      A parameter is a variable in a function definition. It is a placeholder and hence does not have a concrete value.
 *      An argument is a value passed during function invocation.
 * @param task - during parsing, this can be null. During evaluation, it must be a Task
 * @param queryContext - during parsing, this can be null. During evaluation, it must be a QueryContext or undefined.
 */
function constructArguments(task, queryContext) {
    return [
        ['task', task],
        ['query', queryContext ? queryContext.query : null],
    ];
}
/**
 * Evaluate an arbitrary JavaScript expression on a Task object
 * @param task - a {@link Task} object
 * @param arg - a string, such as `task.path.startsWith("journal/") ? "journal/" : task.path`
 * @param queryContext - an optional {@link QueryContext} object
 *
 * Currently any errors are returned as string error messages, starting with the word 'Error'.
 *
 * @todo Implement a type-safe mechanism to report error messages distinct from expression results.
 *
 * See also {@link FunctionField} which exposes this facility to users.
 */
function parseAndEvaluateExpression(task, arg, queryContext) {
    const paramsArgs = constructArguments(task, queryContext || null);
    const functionOrError = (0, Expression_1.parseExpression)(paramsArgs, arg);
    if (functionOrError.error) {
        return functionOrError.error;
    }
    return (0, Expression_1.evaluateExpressionOrCatch)(functionOrError.queryComponent, paramsArgs, arg);
}
/**
 * Encapsulate an expression that can be calculated from a {@link Task} object
 */
class TaskExpression {
    constructor(line) {
        this.line = line;
        this.functionOrError = (0, Expression_1.parseExpression)(constructArguments(null, null), line);
    }
    isValid() {
        return this.functionOrError.isValid();
    }
    get parseError() {
        return this.functionOrError.error;
    }
    /**
     * Evaluate the expression on this task, or throw an exception if the calculation failed
     * @param task
     * @param queryContext - optional. If not supplied, query properties will be unavailable.
     *
     * @see evaluateOrCatch
     */
    evaluate(task, queryContext) {
        if (!this.isValid()) {
            throw new Error(`Error: Cannot evaluate an expression which is not valid: "${this.line}" gave error: "${this.parseError}"`);
        }
        return (0, Expression_1.evaluateExpression)(this.functionOrError.queryComponent, constructArguments(task, queryContext || null));
    }
    /**
     * Evaluate the expression on this task, or return error text if the calculation failed
     * @param task
     * @param queryContext
     *
     * @see evaluate
     */
    evaluateOrCatch(task, queryContext) {
        if (!this.isValid()) {
            return `Error: Cannot evaluate an expression which is not valid: "${this.line}" gave error: "${this.parseError}"`;
        }
        return (0, Expression_1.evaluateExpressionOrCatch)(this.functionOrError.queryComponent, constructArguments(task, queryContext), this.line);
    }
}
exports.TaskExpression = TaskExpression;
//# sourceMappingURL=TaskExpression.js.map