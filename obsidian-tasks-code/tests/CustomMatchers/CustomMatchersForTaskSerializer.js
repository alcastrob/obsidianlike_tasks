"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMatchTaskDetails = void 0;
const jest_diff_1 = require("jest-diff");
const moment_1 = __importDefault(require("moment"));
const Recurrence_1 = require("../../src/Task/Recurrence");
const Priority_1 = require("../../src/Task/Priority");
const TaskRegularExpressions_1 = require("../../src/Task/TaskRegularExpressions");
/** A custom jest {@link Tester} that computes whether two recurrences are equal
 *
 * @note Support for custom equality testers publically landed in jest 29.4.0, but yarn
 *       currently resolves jest to 29.3.1 for this project.
 * @todo When the version of jest is bumped, consider adding `import type {Tester} from 'expect'`
 *       and using that type to typecheckt this function.
 */
const recurrencesAreEqual = function (a, b) {
    if (!(a instanceof Recurrence_1.Recurrence && b instanceof Recurrence_1.Recurrence)) {
        return undefined;
    }
    return a.identicalTo(b);
};
/* A type guard for {@link TaskDetails}
 */
function isTaskDetails(val) {
    if (typeof val !== 'object') {
        return false;
    }
    const dates = [
        // NEW_TASK_FIELD_EDIT_REQUIRED
        'startDate',
        'createdDate',
        'scheduledDate',
        'dueDate',
        'doneDate',
        'cancelledDate',
    ];
    for (const d of dates) {
        if (!(moment_1.default.isMoment(val[d]) || val[d] === null)) {
            return false;
        }
    }
    if (!(typeof val.description === 'string')) {
        return false;
    }
    if (!(Array.isArray(val.tags) && val.tags.every((v) => typeof v === 'string'))) {
        return false;
    }
    if (!Object.values(Priority_1.Priority).includes(val.priority)) {
        return false;
    }
    return true;
}
/**
 * Helper function that replaces non-primitive members of {@link TaskDetails} with
 * a short string indicating its value. Meant to be used when showing a diff when a test fails.
 *
 * @param t A {@link TaskDetails} or null
 * @returns {SummarizedTaskDetails} if {@link t} was not null, otherwise null
 */
function summarizeTaskDetails(t) {
    if (t === null)
        return null;
    return {
        // NEW_TASK_FIELD_EDIT_REQUIRED
        ...t,
        startDate: t.startDate?.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat) ?? null,
        createdDate: t.createdDate?.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat) ?? null,
        scheduledDate: t.scheduledDate?.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat) ?? null,
        dueDate: t.dueDate?.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat) ?? null,
        doneDate: t.doneDate?.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat) ?? null,
        cancelledDate: t.cancelledDate?.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat) ?? null,
        recurrence: t.recurrence?.toText() ?? null,
        id: t.id?.valueOf().toString() ?? null,
    };
}
/**
 * Helper function that tries to build a {@link TaskDetails} from a partial one.
 *
 * The only way this fails (and returns null) is if {@link t} sets a key of {@link TaskDetails}
 * to an unexpected type. Example: {startDate: true, description: null}
 *
 * @param t A Partial {@link TaskDetails} or null
 * @returns {TaskDetails} if TaskDetails was build successfully, null otherwise
 */
function tryBuildTaskDetails(t) {
    const toReturn = {
        // NEW_TASK_FIELD_EDIT_REQUIRED
        description: '',
        priority: Priority_1.Priority.None,
        startDate: null,
        createdDate: null,
        scheduledDate: null,
        dueDate: null,
        doneDate: null,
        cancelledDate: null,
        recurrence: null,
        onCompletion: '',
        dependsOn: [],
        id: '',
        tags: [],
        ...t,
    };
    if (!isTaskDetails(toReturn))
        return null;
    return toReturn;
}
/**
 * A custom jest {@link MatcherFunction} for checking if two {@link TaskDetails} match
 *
 * The expected {@link TaskDetail} may be defined partially for convenience, and missing values
 * assume a default value:
 *      {@link string} - The empty string
 *      {@link Array} - The empty array
 *      {@link Priority} - {@link Priority.None}
 *      nullable types - null
 *
 * @todo Figure out why throwing an Error in a custom matcher shows a traceback that points back to this function.
 *       Built-in matchers can throw exceptions, and it effectly looks like a test failed.
 * @param received A {@TaskDetails} or null
 * @param partial_expected A Partial {@link TaskDetails}
 */
const toMatchTaskDetails = function (received, partial_expected) {
    const { matcherErrorMessage, matcherHint, printWithType, printExpected, printReceived, RECEIVED_COLOR, EXPECTED_COLOR, } = this.utils;
    const matcherInvocation = matcherHint('toMatchTaskDetails', undefined, undefined, this);
    // Message to print when parameter does not have type TaskDetails | null
    function wrongTypeMessage(what, val, typeDescription) {
        const [printfn, PARAM_COLOR] = {
            expected: [printExpected, EXPECTED_COLOR],
            received: [printReceived, RECEIVED_COLOR],
        }[what];
        return matcherErrorMessage(matcherInvocation, `${PARAM_COLOR(what)} value must be ${typeDescription}`, printWithType(capitalize(what), val, printfn));
    }
    if (!(received === null || isTaskDetails(received)))
        throw new Error(wrongTypeMessage('received', received, 'null or TaskDetails'));
    const expected = (function () {
        if (partial_expected !== null && typeof partial_expected === 'object') {
            // Try to build a TaskDetail
            const result = tryBuildTaskDetails(partial_expected);
            if (result !== null)
                return result;
        }
        // partial_expected was not actually null or a Partial<TaskDetails>
        throw new Error(wrongTypeMessage('expected', partial_expected, 'TaskDetails'));
    })();
    // Generate a diff to show when this matcher fails
    const objDiff = this.expand /* jest --expand */
        ? () => (0, jest_diff_1.diff)(expected, received)
        : () => (0, jest_diff_1.diff)(summarizeTaskDetails(expected), summarizeTaskDetails(received));
    const pass = this.equals(expected, received, [recurrencesAreEqual]);
    return {
        pass,
        message: pass
            ? () => matcherInvocation +
                '\n\n' +
                `${EXPECTED_COLOR('expected')} should not match ${RECEIVED_COLOR('received')}`
            : () => matcherInvocation +
                '\n\n' +
                `${EXPECTED_COLOR('expected')} does not match ${RECEIVED_COLOR('received')}:` +
                '\n\n' +
                objDiff(),
    };
};
exports.toMatchTaskDetails = toMatchTaskDetails;
const capitalize = (s) => s[0].toUpperCase() + s.slice(1);
//# sourceMappingURL=CustomMatchersForTaskSerializer.js.map