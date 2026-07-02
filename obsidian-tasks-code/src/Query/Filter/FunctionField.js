"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionField = void 0;
exports.filterByFunction = filterByFunction;
exports.groupByFunction = groupByFunction;
const Grouper_1 = require("../Group/Grouper");
const Explanation_1 = require("../Explain/Explanation");
const TaskExpression_1 = require("../../Scripting/TaskExpression");
const Sorter_1 = require("../Sort/Sorter");
const DateTools_1 = require("../../DateTime/DateTools");
const TypeDetection_1 = require("../../lib/TypeDetection");
const EnableJsInTasksQueries_1 = require("../../Config/EnableJsInTasksQueries");
const JsInTasksQueriesDisabledError_1 = require("../../Scripting/JsInTasksQueriesDisabledError");
const Field_1 = require("./Field");
const Filter_1 = require("./Filter");
const FilterOrErrorMessage_1 = require("./FilterOrErrorMessage");
/**
 * A {@link Field} implement that accepts a JavaScript expression to filter or group tasks.
 *
 * See also {@link parseAndEvaluateExpression}
 */
class FunctionField extends Field_1.Field {
    // -----------------------------------------------------------------------------------------------------------------
    // Filtering
    // -----------------------------------------------------------------------------------------------------------------
    createFilterOrErrorMessage(line) {
        if (!EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().get()) {
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, JsInTasksQueriesDisabledError_1.JsInTasksQueriesDisabledError.helpMessage);
        }
        const match = Field_1.Field.getMatch(this.filterRegExp(), line);
        if (match === null) {
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, 'Unable to parse line');
        }
        const expression = match[1];
        const taskExpression = new TaskExpression_1.TaskExpression(expression);
        if (!taskExpression.isValid()) {
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, taskExpression.parseError);
        }
        return FilterOrErrorMessage_1.FilterOrErrorMessage.fromFilter(new Filter_1.Filter(line, createFilterFunctionFromLine(taskExpression), new Explanation_1.Explanation(line)));
    }
    fieldName() {
        return 'function';
    }
    filterRegExp() {
        return new RegExp(`^filter by ${this.fieldNameSingularEscaped()} (.*)`, 'i');
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Sorting
    // -----------------------------------------------------------------------------------------------------------------
    supportsSorting() {
        return true;
    }
    sorterRegExp() {
        return new RegExp(`^sort by ${this.fieldNameSingularEscaped()}( reverse)? (.*)`, 'i');
    }
    createSorterFromLine(line) {
        const match = Field_1.Field.getMatch(this.sorterRegExp(), line);
        if (match === null) {
            return null;
        }
        if (!EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().get()) {
            throw new JsInTasksQueriesDisabledError_1.JsInTasksQueriesDisabledError();
        }
        const reverse = !!match[1];
        const expression = match[2];
        const taskExpression = new TaskExpression_1.TaskExpression(expression);
        if (!taskExpression.isValid()) {
            // This does not need to report the line, and that it was parsing, as calling code
            // will add that information.
            throw new Error(taskExpression.parseError);
        }
        const comparator = (a, b, searchInfo) => {
            try {
                const queryContext = searchInfo.queryContext();
                const valueA = this.validateTaskSortKey(taskExpression.evaluate(a, queryContext));
                const valueB = this.validateTaskSortKey(taskExpression.evaluate(b, queryContext));
                return this.compareTaskSortKeys(valueA, valueB);
            }
            catch (exception) {
                if (exception instanceof Error) {
                    exception.message += `: while evaluating instruction '${line}'`;
                }
                throw exception;
            }
        };
        return new Sorter_1.Sorter(line, this.fieldNameSingular(), comparator, reverse);
    }
    validateTaskSortKey(sortKey) {
        function throwSortKeyTypeError(sortKeyType) {
            throw new Error(`"${sortKeyType}" is not a valid sort key`);
        }
        if (sortKey === undefined) {
            throwSortKeyTypeError('undefined');
        }
        if (Number.isNaN(sortKey)) {
            throwSortKeyTypeError('NaN (Not a Number)');
        }
        if (Array.isArray(sortKey)) {
            throwSortKeyTypeError('array');
        }
        return sortKey;
    }
    /**
     * A comparator function for sorting two values
     *
     * **IMPORTANT**: Both values must already have been checked by {@link validateTaskSortKey}.
     *
     * - If the result is negative, a is sorted before b.
     * - If the result is positive, b is sorted before a.
     * - If the result is 0, no changes are done with the sort order of the two values.
     *
     * @param valueA - a value that satisfies {@link validateTaskSortKey}.
     * @param valueB - a value that satisfies {@link validateTaskSortKey}.
     */
    compareTaskSortKeys(valueA, valueB) {
        // Precondition: Both parameter values have satisfied constraints in validateTaskSortKey().
        const valueAType = (0, TypeDetection_1.getValueType)(valueA);
        const valueBType = (0, TypeDetection_1.getValueType)(valueB);
        // Sort Task.dueDate and similar in same order as 'sort by due' etc: null values come after Moment values:
        const resultIfMoment = this.compareTaskSortKeysIfOptionalMoment(valueA, valueB, valueAType, valueBType);
        if (resultIfMoment !== undefined) {
            return resultIfMoment;
        }
        // Otherwise, any null values come after non-null values
        const resultIfNull = this.compareTaskSortKeysIfEitherIsNull(valueA, valueB);
        if (resultIfNull !== undefined) {
            return resultIfNull;
        }
        if (valueAType !== valueBType) {
            throw new Error(`Unable to compare two different sort key types '${valueAType}' and '${valueBType}' order`);
        }
        if (valueAType === 'string') {
            return valueA.localeCompare(valueB, undefined, { numeric: true });
        }
        if (valueAType === 'TasksDate') {
            return (0, DateTools_1.compareByDate)(valueA.moment, valueB.moment);
        }
        if (valueAType === 'boolean') {
            // We want true to come before false, as it's been found to give more intuitive behaviour.
            // So this is the opposite way round to the calculation below.
            return Number(valueB) - Number(valueA);
        }
        // We use Number() to prevent implicit type conversion, by making the conversion explicit:
        const result = Number(valueA) - Number(valueB);
        if (isNaN(result)) {
            throw new Error(`Unable to determine sort order for sort key types '${valueAType}' and '${valueBType}'`);
        }
        return result;
    }
    compareTaskSortKeysIfOptionalMoment(valueA, valueB, valueAType, valueBType) {
        const aIsMoment = valueAType === 'Moment';
        const bIsMoment = valueBType === 'Moment';
        const bothAreMoment = aIsMoment && bIsMoment;
        const aIsMomentBIsNull = aIsMoment && valueB === null;
        const bIsMomentAIsNull = bIsMoment && valueA === null;
        if (bothAreMoment || aIsMomentBIsNull || bIsMomentAIsNull) {
            return (0, DateTools_1.compareByDate)(valueA, valueB);
        }
        return undefined;
    }
    compareTaskSortKeysIfEitherIsNull(valueA, valueB) {
        if (valueA === null && valueB === null) {
            return 0;
        }
        // Null sorts before anything else.
        // This is consistent with how null headings are handled.
        // However, it differs from how compareByDate() works, so special-case code will be needed
        // for that, later.
        if (valueA === null && valueB !== null) {
            return -1;
        }
        if (valueA !== null && valueB === null) {
            return 1;
        }
        return undefined;
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Grouping
    // -----------------------------------------------------------------------------------------------------------------
    supportsGrouping() {
        return true;
    }
    createGrouperFromLine(line) {
        const match = Field_1.Field.getMatch(this.grouperRegExp(), line);
        if (match === null) {
            return null;
        }
        if (!EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().get()) {
            throw new JsInTasksQueriesDisabledError_1.JsInTasksQueriesDisabledError();
        }
        const reverse = !!match[1];
        const args = match[2];
        return new Grouper_1.Grouper(line, 'function', createGrouperFunctionFromLine(args), reverse);
    }
    grouperRegExp() {
        return new RegExp(`^group by ${this.fieldNameSingularEscaped()}( reverse)? (.*)`, 'i');
    }
    /**
     * This method does not work for 'group by function' as the user's instruction line
     * is required in order to create the {@link GrouperFunction}.
     *
     * So this class overrides {@link createGrouperFromLine} instead.
     * @throws Error
     */
    grouper() {
        throw new Error('grouper() function not valid for FunctionField. Use createGrouperFromLine() instead.');
    }
}
exports.FunctionField = FunctionField;
// -----------------------------------------------------------------------------------------------------------------
// Filtering
// -----------------------------------------------------------------------------------------------------------------
function createFilterFunctionFromLine(expression) {
    return (task, searchInfo) => {
        const queryContext = searchInfo.queryContext();
        return filterByFunction(expression, task, queryContext);
    };
}
function filterByFunction(expression, task, queryContext) {
    // Allow exceptions to propagate to caller, since this will be called in a tight loop.
    // In searches, it will be caught by Query.applyQueryToTasks().
    const result = expression.evaluate(task, queryContext);
    // We insist that 'filter by function' returns booleans,
    // to avoid users having to understand truthy and falsey values.
    if (typeof result === 'boolean') {
        return result;
    }
    throw new Error(`filtering function must return true or false. This returned "${result}".`);
}
function createGrouperFunctionFromLine(line) {
    return (task, searchInfo) => {
        const queryContext = searchInfo.queryContext();
        return groupByFunction(task, line, queryContext);
    };
}
function groupByFunction(task, arg, queryContext) {
    try {
        const result = (0, TaskExpression_1.parseAndEvaluateExpression)(task, arg, queryContext);
        if (Array.isArray(result)) {
            return result.map((h) => h.toString());
        }
        // Task uses null to represent missing information.
        // So we treat null as an empty group or 'not in a heading', for simplicity for users.
        // This can be overridden with 'null || "No value"
        if (result === null) {
            return [];
        }
        if (typeof result === 'number' && !Number.isInteger(result)) {
            // Guard against #3371: order of groups, when grouping by "function task.urgency" without specifying precision, is confusing.
            // Sorting has been found to be unreliable with varying numbers of decimal places.
            // So to ensure consistent sorting, we round the value to a fixed number of decimals and return it as a string.
            // This still sorts consistently even when some of the group's values are integers.
            return [result.toFixed(5)];
        }
        // If there was an error in the expression, like it referred to
        // an unknown task field, result will be undefined, and the call
        // on undefined.toString() will give an exception and a useful error
        // message below. This is a feature: it gives users feedback on the problem
        // instruction line.
        const group = result.toString();
        return [group];
    }
    catch (e) {
        const errorMessage = `Error: Failed calculating expression "${arg}". The error message was: `;
        if (e instanceof Error) {
            return [errorMessage + e.message];
        }
        else {
            return [errorMessage + 'Unknown error'];
        }
    }
}
//# sourceMappingURL=FunctionField.js.map