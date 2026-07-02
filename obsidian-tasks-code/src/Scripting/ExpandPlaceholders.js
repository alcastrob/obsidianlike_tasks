"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandPlaceholders = expandPlaceholders;
const mustache_1 = __importDefault(require("mustache"));
const mustache_validator_1 = __importDefault(require("mustache-validator"));
const EnableJsInTasksQueries_1 = require("../Config/EnableJsInTasksQueries");
const Expression_1 = require("./Expression");
const KnownPlaceholderResolver_1 = require("./KnownPlaceholderResolver");
const JsInTasksQueriesDisabledError_1 = require("./JsInTasksQueriesDisabledError");
// https://github.com/janl/mustache.js
/**
 * Expand any placeholder strings - {{....}} - in the given template, and return the result.
 *
 * The template implementation is currently provided by: [mustache.js](https://github.com/janl/mustache.js).
 * This is augmented by also allowing the templates to contain function calls.
 *
 * @param template - A template string, typically with placeholders such as {{query.task.folder}} or
 *                  {{query.file.property('task_instruction')}}
 * @param view - The property values
 *
 * @throws Error
 *
 *      By using mustache-validator's proxyData, we ensure that any accesses of property names that are
 *      not in the view, we ensure that errors are detected immediately.
 *      The first unknown placeholder is included in Error.message.
 */
function expandPlaceholders(template, view) {
    // Turn off HTML escaping of things like '/' in file paths:
    // https://github.com/janl/mustache.js#variables
    mustache_1.default.escape = function (text) {
        return text;
    };
    try {
        // Preprocess the template to evaluate any placeholders that involve function calls
        const evaluatedTemplate = evaluateAnyFunctionCalls(template, view);
        // Render the preprocessed template
        return mustache_1.default.render(evaluatedTemplate, (0, mustache_validator_1.default)(view));
    }
    catch (error) {
        let message = '';
        if (error instanceof Error) {
            message = `There was an error expanding one or more placeholders.

The error message was:
    ${error.message.replace(/ > /g, '.').replace('Missing Mustache data property', 'Unknown property')}`;
        }
        else {
            message = 'Unknown error expanding placeholders.';
        }
        message += `

The problem is in:
    ${template}`;
        throw new Error(message);
    }
}
// Regex to detect placeholders
const PLACEHOLDER_REGEX = new RegExp([
    // Match the opening double braces `{{`
    '\\{\\{',
    // Lazily capture everything inside (.*?), ensuring it stops at the first `}}`
    '(.*?)',
    // Match the closing double braces `}}`
    '\\}\\}',
].join(''), // Combine the parts into a single string
'g');
function evaluateAnyFunctionCalls(template, view) {
    return template.replace(PLACEHOLDER_REGEX, (_match, reconstructed) => {
        if (isQueryContext(view)) {
            const knownPlaceholder = (0, KnownPlaceholderResolver_1.resolveKnownPlaceholder)(reconstructed, view);
            if (knownPlaceholder.resolved) {
                const result = knownPlaceholder.value;
                if (result === null) {
                    throwInvalidPlaceholderError(reconstructed);
                }
                if (result !== undefined) {
                    return stringifyPlaceholderResult(result);
                }
            }
        }
        if (!EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().get()) {
            if (isPlainMustachePlaceholder(reconstructed)) {
                return _match;
            }
            throw new JsInTasksQueriesDisabledError_1.JsInTasksQueriesDisabledError();
        }
        const paramsArgs = createExpressionParameters(view);
        const functionOrError = (0, Expression_1.parseExpression)(paramsArgs, reconstructed);
        if (functionOrError.isValid()) {
            const result = (0, Expression_1.evaluateExpression)(functionOrError.queryComponent, paramsArgs);
            if (result === null) {
                throwInvalidPlaceholderError(reconstructed);
            }
            if (result !== undefined) {
                return stringifyPlaceholderResult(result);
            }
        }
        // Fall back on returning the raw string, including {{ and }} - and get Mustache to report the error.
        return _match;
    });
}
function stringifyPlaceholderResult(result) {
    if (typeof result === 'object') {
        return JSON.stringify(result);
    }
    return String(result);
}
function isQueryContext(view) {
    return view?.query?.file !== undefined;
}
function throwInvalidPlaceholderError(reconstructed) {
    throw new Error(`Invalid placeholder result 'null'.
    Check for missing file property in this expression:
        {{${reconstructed}}}`);
}
function isPlainMustachePlaceholder(reconstructed) {
    // This recognises placeholders that Mustache can resolve as ordinary dotted
    // property lookups, without evaluating JavaScript, such as:
    //   query.file.path
    //   preset.this_file
    //
    // This is only a conservative subset of the documented placeholder API.
    // Some documented query.file placeholders, such as
    //   query.file.property('task_instruction')
    //   query.file.hasProperty('task_instruction')
    // are also safe in principle, but need explicit handling because their syntax
    // looks like JavaScript function calls.
    return /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(reconstructed.trim());
}
function createExpressionParameters(view) {
    return Object.entries(view);
}
//# sourceMappingURL=ExpandPlaceholders.js.map