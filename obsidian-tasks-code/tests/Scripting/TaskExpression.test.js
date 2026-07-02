"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskExpression_1 = require("../../src/Scripting/TaskExpression");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const QueryContext_1 = require("../../src/Scripting/QueryContext");
const TasksFileHelpers_1 = require("../TestingTools/TasksFileHelpers");
describe('TaskExpression', () => {
    describe('low level functions', () => {
        it('should allow passing QueryContext or null to constructArguments()', () => {
            const task = new TaskBuilder_1.TaskBuilder().build();
            (0, TaskExpression_1.constructArguments)(task, null);
            (0, TaskExpression_1.constructArguments)(task, (0, QueryContext_1.makeQueryContext)((0, TasksFileHelpers_1.createTestTasksFile)('dummy.md')));
        });
        it('should calculate an expression value from a QueryContext', () => {
            const queryContext = (0, QueryContext_1.makeQueryContext)((0, TasksFileHelpers_1.createTestTasksFile)('test.md'));
            const task = new TaskBuilder_1.TaskBuilder().build();
            const result = (0, TaskExpression_1.parseAndEvaluateExpression)(task, 'query.file.path', queryContext);
            expect(result).toEqual('test.md');
        });
        it('should behave predictably if no QueryContext supplied', () => {
            const task = new TaskBuilder_1.TaskBuilder().build();
            const result = (0, TaskExpression_1.parseAndEvaluateExpression)(task, 'query.file.path', undefined);
            expect(result).toMatchInlineSnapshot(`
                "Error: Failed calculating expression "query.file.path".
                The error message was:
                    "TypeError: Cannot read properties of null (reading 'file')""
            `);
        });
    });
    describe('parsing', () => {
        it('should report that a parsable line using task is valid', () => {
            const line = 'task.description';
            // Act
            const taskExpression = new TaskExpression_1.TaskExpression(line);
            // Assert
            expect(taskExpression.isValid()).toEqual(true);
            expect(taskExpression.line).toEqual(line);
            expect(taskExpression.parseError).toBeUndefined();
        });
        it('should report that a parsable line using query is valid', () => {
            const line = 'query.file.path';
            // Act
            const taskExpression = new TaskExpression_1.TaskExpression(line);
            // Assert
            expect(taskExpression.isValid()).toEqual(true);
            expect(taskExpression.line).toEqual(line);
            expect(taskExpression.parseError).toBeUndefined();
        });
        it('should report that a line with mismatched parentheses is invalid', () => {
            const line = 'task.due.formatAsDate())';
            // Act
            const taskExpression = new TaskExpression_1.TaskExpression(line);
            // Assert
            expect(taskExpression.isValid()).toEqual(false);
            expect(taskExpression.line).toEqual(line);
            expect(taskExpression.parseError).toEqual('Error: Failed parsing expression "task.due.formatAsDate())".\nThe error message was:\n    "SyntaxError: Unexpected token \')\'"');
        });
    });
    describe('evaluating', () => {
        const queryContext = (0, QueryContext_1.makeQueryContext)((0, TasksFileHelpers_1.createTestTasksFile)('dummy.md'));
        it('should evaluate a valid task property and give correct result', () => {
            // Arrange
            const taskExpression = new TaskExpression_1.TaskExpression('task.description');
            const task = new TaskBuilder_1.TaskBuilder().description('hello').build();
            // Act, Assert
            expect(taskExpression.evaluate(task, queryContext)).toEqual('hello');
            expect(taskExpression.evaluateOrCatch(task, queryContext)).toEqual('hello');
        });
        it('should evaluate a valid query property and give correct result', () => {
            // Arrange
            const taskExpression = new TaskExpression_1.TaskExpression('query.file.path');
            const task = new TaskBuilder_1.TaskBuilder().build();
            // Act, Assert
            expect(taskExpression.evaluate(task, queryContext)).toEqual('dummy.md');
            expect(taskExpression.evaluateOrCatch(task, queryContext)).toEqual('dummy.md');
        });
        it('should return error string as output if evaluating an expression that parsed OK fails at execution', () => {
            // Arrange
            const taskExpression = new TaskExpression_1.TaskExpression('wibble');
            // Act
            const result = taskExpression.evaluateOrCatch(new TaskBuilder_1.TaskBuilder().build(), queryContext);
            // Assert
            expect(result).toEqual('Error: Failed calculating expression "wibble".\nThe error message was:\n    "ReferenceError: wibble is not defined"');
            // Try again, using evaluate()
            const t = () => {
                taskExpression.evaluate(new TaskBuilder_1.TaskBuilder().build(), queryContext);
            };
            expect(t).toThrow(ReferenceError);
            expect(t).toThrowError('wibble is not defined');
        });
        it('should give a meaningful error if evaluating a line that failed to parse', () => {
            // Arrange
            const taskExpression = new TaskExpression_1.TaskExpression('task.due.formatAsDate(');
            expect(taskExpression.isValid()).toEqual(false);
            // Act
            const result = taskExpression.evaluateOrCatch(new TaskBuilder_1.TaskBuilder().build(), queryContext);
            // Assert
            const expectedErrorMessage = 'Error: Cannot evaluate an expression which is not valid: "task.due.formatAsDate(" gave error: "Error: Failed parsing expression "task.due.formatAsDate(".\nThe error message was:\n    "SyntaxError: Unexpected token \'}\'""';
            expect(result).toEqual(expectedErrorMessage);
            // Try again, using evaluate()
            const t = () => {
                taskExpression.evaluate(new TaskBuilder_1.TaskBuilder().build(), queryContext);
            };
            expect(t).toThrow(Error);
            expect(t).toThrowError(expectedErrorMessage);
        });
    });
});
//# sourceMappingURL=TaskExpression.test.js.map