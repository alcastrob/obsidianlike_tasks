"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const Expression_1 = require("../../src/Scripting/Expression");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const VerifyMarkdown_1 = require("../TestingTools/VerifyMarkdown");
const Scanner_1 = require("../../src/Query/Scanner");
const TaskExpression_1 = require("../../src/Scripting/TaskExpression");
const QueryContext_1 = require("../../src/Scripting/QueryContext");
const EnableJsInTasksQueries_1 = require("../../src/Config/EnableJsInTasksQueries");
const JsInTasksQueriesDisabledError_1 = require("../../src/Scripting/JsInTasksQueriesDisabledError");
const TasksFileHelpers_1 = require("../TestingTools/TasksFileHelpers");
const ScriptingTestHelpers_1 = require("./ScriptingTestHelpers");
window.moment = moment_1.default;
describe('Expression', () => {
    describe('Expression - disabling execution', () => {
        beforeEach(() => {
            EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().set(false);
        });
        afterEach(() => {
            EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().set(true);
        });
        it('parsing expressions should throw exception if JS execution disabled', () => {
            expect(() => (0, Expression_1.parseExpression)([], '42')).toThrow(JsInTasksQueriesDisabledError_1.JsInTasksQueriesDisabledError);
        });
        it('evaluating expressions should throw exception if JS execution disabled', () => {
            // Turn on JS expression to allow parsing.
            EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().set(true);
            const functionOrError = (0, Expression_1.parseExpression)([], '42');
            expect(functionOrError.queryComponent).toBeDefined();
            const func = functionOrError.queryComponent;
            // Turn off JS execution, so we can test evaluation fails.
            EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().set(false);
            expect(() => (0, Expression_1.evaluateExpression)(func, [])).toThrow(JsInTasksQueriesDisabledError_1.JsInTasksQueriesDisabledError);
        });
    });
    describe('support simple calculations', () => {
        it('should calculate simple expression', () => {
            expect('1 + 1').toEvaluateAs(2);
        });
        it('should support return statements', () => {
            expect('return 42').toEvaluateAs(42);
        });
        it('should allow use of a variable in expression', () => {
            expect('const x = 1 + 1; return x;').toEvaluateAs(2);
        });
        it('should support if blocks', () => {
            expect('if (1 === 1) { return "yes"; } else { return "no"; }').toEvaluateAs('yes');
            expect('if (1 !== 1) { return "yes"; } else { return "no"; }').toEvaluateAs('no');
        });
        it('should support functions - multi-line', () => {
            // Tasks only supports single-line expressions.
            // This multi-line one is used for readability
            const line = `
                function f(value) {
                    if (value === 1 ) {
                        return "yes";
                    } else {
                        return "no";
                    }
                }
                return f(1)`;
            expect(line).toEvaluateAs('yes');
        });
        it('should support functions - single-line', () => {
            const line = 'function f(value) { if (value === 1 ) { return "yes"; } else { return "no"; } } return f(1)';
            expect(line).toEvaluateAs('yes');
        });
    });
    const task = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask();
    const queryContext = (0, QueryContext_1.makeQueryContext)((0, TasksFileHelpers_1.createTestTasksFile)('temp.md'));
    describe('detect errors at parse stage', () => {
        it('should report meaningful error message for parentheses too few parentheses', () => {
            expect((0, Expression_1.parseExpression)([], 'x(').error).toEqual('Error: Failed parsing expression "x(".\nThe error message was:\n    "SyntaxError: Unexpected token \'}\'"');
        });
        it('should report meaningful error message for parentheses too many parentheses', () => {
            expect((0, Expression_1.parseExpression)([], 'x())').error).toEqual('Error: Failed parsing expression "x())".\nThe error message was:\n    "SyntaxError: Unexpected token \')\'"');
        });
    });
    describe('detect errors at evaluation time', () => {
        const line = 'nonExistentVariable';
        const paramsArgs = (0, TaskExpression_1.constructArguments)(task, queryContext);
        const expression = (0, Expression_1.parseExpression)(paramsArgs, line);
        it('evaluateExpressionAndCatch() should report meaningful error message for invalid variable', () => {
            expect(expression.error).toBeUndefined();
            const result = (0, Expression_1.evaluateExpressionOrCatch)(expression.queryComponent, paramsArgs, line);
            expect(result).toEqual('Error: Failed calculating expression "nonExistentVariable".\nThe error message was:\n    "ReferenceError: nonExistentVariable is not defined"');
        });
        it('evaluateExpression() should throw exception for invalid variable', () => {
            const t = () => {
                (0, Expression_1.evaluateExpression)(expression.queryComponent, paramsArgs);
            };
            expect(t).toThrow(ReferenceError);
            expect(t).toThrowError('nonExistentVariable is not defined');
        });
        it('should report unknown for invalid task property', () => {
            expect((0, TaskExpression_1.parseAndEvaluateExpression)(task, 'task.iAmNotAKnownTaskProperty', queryContext)).toEqual(undefined);
        });
    });
    const extraBlankLineBetweenExpressions = true;
    const noBlankLineBetweenExpressions = false;
    /**
     * Generate Markdown strings showing expressions and their evaluation results, for use in docs.
     * @param expressions - a list of expressions to be evaluated
     * @param addBlankLineBetweenExpressions - use either {@link extraBlankLineBetweenExpressions} or {@link noBlankLineBetweenExpressions},
     *                                         depending on the length of lines in {@link expressions}.
     */
    function verifyExpressionsForDocs(expressions, addBlankLineBetweenExpressions) {
        let markdown = '~~~text\n';
        const separator = addBlankLineBetweenExpressions ? '\n\n' : '\n';
        const resultSeparator = addBlankLineBetweenExpressions ? '\n' : ' ';
        markdown +=
            expressions
                .map((expression) => {
                const result = (0, TaskExpression_1.parseAndEvaluateExpression)(task, (0, Scanner_1.continueLinesFlattened)(expression), queryContext);
                return `${expression}${resultSeparator}=> ${(0, ScriptingTestHelpers_1.formatToRepresentType)(result)}`;
            })
                .join(separator) + '\n';
        markdown += '~~~\n';
        (0, VerifyMarkdown_1.verifyMarkdownForDocs)(markdown);
    }
    it('result', () => {
        const expressions = [
            "'hello'",
            '"hello"',
            '""',
            '[]',
            '"" || "No value"',
            'false',
            'true',
            '1',
            '0',
            '0 || "No value"',
            '1.0765456',
            '6 * 7',
            '["heading1", "heading2"]',
            '[1, 2]',
            'null',
            'null || "No value"',
            'undefined',
            'undefined || "No value"',
            // Should allow manual escaping of markdown
            String.raw `"I _am_ not _italic_".replaceAll("_", "\\_")`,
        ];
        verifyExpressionsForDocs(expressions, noBlankLineBetweenExpressions);
    });
    it('returns and functions', () => {
        const expressions = [
            'return 42',
            'const x = 1 + 1; return x * x',
            // Presence of 'return', even if in a string, makes Tasks plugin think it does not need to add 'return':
            "'any text that contains the word return'",
            // So if the text 'return' appears anywhere in the expression, an explicit 'return' instruction must be supplied:
            "return 'any text that contains the word return'",
            'if (1 === 1) { return "yes"; } else { return "no" }',
            `function f(value) {                 \\
    if (value === 1 ) {             \\
        return "yes";               \\
    } else {                        \\
        return "no";                \\
    }                               \\
}                                   \\
return f(1);`,
        ];
        verifyExpressionsForDocs(expressions, extraBlankLineBetweenExpressions);
    });
});
//# sourceMappingURL=Expression.test.js.map