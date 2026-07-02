"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExpandPlaceholders_1 = require("../../src/Scripting/ExpandPlaceholders");
const QueryContext_1 = require("../../src/Scripting/QueryContext");
const Query_1 = require("../../src/Query/Query");
const EnableJsInTasksQueries_1 = require("../../src/Config/EnableJsInTasksQueries");
const MockDataHelpers_1 = require("../TestingTools/MockDataHelpers");
const TasksFileHelpers_1 = require("../TestingTools/TasksFileHelpers");
const ScriptingTestHelpers_1 = require("./ScriptingTestHelpers");
describe('Placeholders - disabling execution', () => {
    beforeEach(() => {
        EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().set(false);
    });
    afterEach(() => {
        EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().set(true);
    });
    const tasksFile = (0, MockDataHelpers_1.getTasksFileFromMockData)('yaml_all_property_types_populated');
    function worksWithoutJsExecution(instruction) {
        const query = new Query_1.Query(instruction, tasksFile);
        expect(query.error).toBeUndefined();
    }
    function failsWithoutJsExecution(instruction) {
        const query = new Query_1.Query(instruction, tasksFile);
        (0, ScriptingTestHelpers_1.expectQueryErrorToMentionDisabledJavaScript)(query, instruction);
    }
    it('"{{query.file.path}}" should work when JS execution disabled', () => {
        const instruction = 'path includes {{query.file.path}}';
        worksWithoutJsExecution(instruction);
    });
    it('"{{query.file.property()}} - with existent property" should work when JS execution disabled', () => {
        const instruction = 'path includes {{query.file.property("sample_number_property")}}';
        worksWithoutJsExecution(instruction);
    });
    it('"{{query.file.hasProperty()}}" should work when JS execution disabled', () => {
        const instruction = 'description includes {{query.file.hasProperty("sample_number_property")}}';
        worksWithoutJsExecution(instruction);
    });
    it('"{{query.file.property()}} - with missing property" should preserve the existing null placeholder error when JS execution disabled', () => {
        const instruction = 'path includes {{query.file.property("non_existent_property")}}';
        const query = new Query_1.Query(instruction, tasksFile);
        expect(query.error).toContain("Invalid placeholder result 'null'");
        expect(query.error).toContain(instruction);
    });
    it('"{{query.file.property()}} - with expression argument" should have meaningful parse-time error when JS execution disabled', () => {
        const instruction = 'path includes {{query.file.property("sample_" + "number_property")}}';
        failsWithoutJsExecution(instruction);
    });
    it('"{{query.file.noSuchProperty}}" should preserve the existing unknown property error when JS execution disabled', () => {
        const instruction = 'path includes {{query.file.noSuchProperty}}';
        const query = new Query_1.Query(instruction, tasksFile);
        expect(query.error).toContain('Unknown property: query.file.noSuchProperty');
        expect(query.error).toContain(instruction);
    });
    it('"{{query.file.path.toUpperCase()}}" should have meaningful parse-time error', () => {
        const instruction = 'path includes {{query.file.path.toUpperCase()}}';
        failsWithoutJsExecution(instruction);
    });
    it('"{{4 + 6}}" should have meaningful parse-time error', () => {
        const instruction = 'path includes {{4 + 6}}';
        failsWithoutJsExecution(instruction);
    });
});
describe('ExpandTemplate', () => {
    const tasksFile = (0, TasksFileHelpers_1.createTestTasksFile)('a/b/path with space.md');
    it('hard-coded call', () => {
        const view = {
            title: 'Joe',
            calc: () => 2 + 4,
        };
        const output = (0, ExpandPlaceholders_1.expandPlaceholders)('{{ title }} spends {{ calc() }}', view);
        expect(output).toEqual('Joe spends 6');
    });
    it('fake query - with file path', () => {
        const rawString = `path includes {{query.file.path}}
filename includes {{query.file.filename}}`;
        const queryContext = (0, QueryContext_1.makeQueryContext)(tasksFile);
        expect((0, ExpandPlaceholders_1.expandPlaceholders)(rawString, queryContext)).toMatchInlineSnapshot(`
            "path includes a/b/path with space.md
            filename includes path with space.md"
        `);
    });
    it('fake query - with method call on path', () => {
        // I discovered by chance that adding support for properties in query placeholders enabled the following to work
        const rawString = 'path includes {{query.file.path.toUpperCase()}}';
        const queryContext = (0, QueryContext_1.makeQueryContext)(tasksFile);
        expect((0, ExpandPlaceholders_1.expandPlaceholders)(rawString, queryContext)).toEqual('path includes A/B/PATH WITH SPACE.MD');
    });
    it('fake query - with hasProperty', () => {
        // TODO We really must prevent use of booleans as strings in property placeholders
        const rawString = '{{query.file.hasProperty("no-such-property")}}';
        const queryContext = (0, QueryContext_1.makeQueryContext)(tasksFile);
        // I think converting a bool to a string is unhelpful here.
        expect((0, ExpandPlaceholders_1.expandPlaceholders)(rawString, queryContext)).toEqual('false');
    });
    it('fake query - with expression', () => {
        const rawString = '{{query.file.property("show-tree") ? "show tree" : "hide tree"}}';
        const queryContext = (0, QueryContext_1.makeQueryContext)(tasksFile);
        expect((0, ExpandPlaceholders_1.expandPlaceholders)(rawString, queryContext)).toEqual('hide tree');
    });
    it('should return the input string if no {{ in line', function () {
        const queryContext = (0, QueryContext_1.makeQueryContext)(tasksFile);
        const line = 'no braces here';
        const result = (0, ExpandPlaceholders_1.expandPlaceholders)(line, queryContext);
        // This test revealed that Mustache itself returns the input string if no {{ present.
        expect(Object.is(line, result)).toEqual(true);
    });
    it('should throw an error if unknown template field used', () => {
        const view = {
            title: 'Joe',
        };
        const source = '{{ title }} spends {{ unknownField }}';
        expect(() => (0, ExpandPlaceholders_1.expandPlaceholders)(source, view)).toThrow(`There was an error expanding one or more placeholders.

The error message was:
    unknownField is not defined

The problem is in:
    {{ title }} spends {{ unknownField }}`);
    });
    it('should throw an error if unknown template nested field used', () => {
        const queryContext = (0, QueryContext_1.makeQueryContext)((0, TasksFileHelpers_1.createTestTasksFile)('stuff.md'));
        const source = '{{ query.file.nonsense }}';
        expect(() => (0, ExpandPlaceholders_1.expandPlaceholders)(source, queryContext)).toThrow(`There was an error expanding one or more placeholders.

The error message was:
    Unknown property: query.file.nonsense

The problem is in:
    {{ query.file.nonsense }}`);
    });
    it('should not treat absent property values as string, but report the error ', () => {
        const rawString = '{{ query.file.property("non-existent")}}';
        const queryContext = (0, QueryContext_1.makeQueryContext)(tasksFile);
        expect(() => (0, ExpandPlaceholders_1.expandPlaceholders)(rawString, queryContext)).toThrow(`There was an error expanding one or more placeholders.

The error message was:
    Invalid placeholder result 'null'.
    Check for missing file property in this expression:
        {{ query.file.property("non-existent")}}

The problem is in:
    {{ query.file.property("non-existent")}}`);
    });
});
describe('ExpandTemplate with functions', () => {
    describe('Basic Functionality', () => {
        it('Simple property access', () => {
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)('Hello, {{name}}!', { name: 'World' });
            expect(output).toEqual('Hello, World!');
        });
        it('Valid function call', () => {
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)("Result: {{math.square('4')}}", {
                math: { square: (x) => parseInt(x) ** 2 },
            });
            expect(output).toEqual('Result: 16');
        });
        it('Objects use JSON stringification format', () => {
            // Note: This is not necessarily the "correct" behaviour:
            //       it is just demonstrating the "current" behaviour.
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)('{{ { path: "x.md" } }}', {});
            expect(output).toEqual('{"path":"x.md"}');
        });
    });
    describe('Complex Nested Paths', () => {
        it('Nested object function access', () => {
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)("Value: {{data.subData.func('arg')}}", {
                data: {
                    subData: {
                        func: (x) => `Result for ${x}`,
                    },
                },
            });
            expect(output).toEqual('Value: Result for arg');
        });
    });
    describe('Special Characters in Arguments', () => {
        it('Mixed quotes in arguments', () => {
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)("Command: {{cmd.run('Hello, \\'world\\'')}}", {
                cmd: { run: (x) => `Running ${x}` },
            });
            expect(output).toEqual("Command: Running Hello, 'world'");
        });
        it('Whitespace in arguments', () => {
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)("Path: {{file.get('   /my path/   ')}}", {
                file: { get: (x) => x.trim() },
            });
            expect(output).toEqual('Path: /my path/');
        });
    });
    describe('Error Handling', () => {
        it('Non-existent function', () => {
            expect(() => {
                (0, ExpandPlaceholders_1.expandPlaceholders)('Call: {{invalid.func()}}', { invalid: {} });
            }).toThrow('invalid.func is not a function');
        });
        it('Missing arguments', () => {
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)('Result: {{calc.add()}}', {
                calc: { add: () => 'No args' },
            });
            expect(output).toEqual('Result: No args');
        });
        it('Function that throws an error', () => {
            expect(() => {
                (0, ExpandPlaceholders_1.expandPlaceholders)('Test: {{bug.trigger()}}', {
                    bug: {
                        trigger: () => {
                            throw new Error('Something broke');
                        },
                    },
                });
            }).toThrow('Something broke');
        });
    });
    describe('Edge Cases', () => {
        it('Empty template', () => {
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)('', { key: 'value' });
            expect(output).toEqual('');
        });
        it('Function with no arguments', () => {
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)('Version: {{sys.getVersion()}}', {
                sys: { getVersion: () => '1.0.0' },
            });
            expect(output).toEqual('Version: 1.0.0');
        });
        it('Template with no placeholders', () => {
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)('Static text.', { anything: 'irrelevant' });
            expect(output).toEqual('Static text.');
        });
        it('Reserved characters', () => {
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)("Escape: {{text.replace('&')}}", {
                text: { replace: (x) => x.replace('&', '&amp;') },
            });
            expect(output).toEqual('Escape: &amp;');
        });
    });
    describe('Multiple Placeholders', () => {
        it('Mixed property and function calls', () => {
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)("{{user.name}}: {{math.square('5')}}", {
                user: { name: 'Alice' },
                math: { square: (x) => parseInt(x) ** 2 },
            });
            expect(output).toEqual('Alice: 25');
        });
        it('Two function calls', () => {
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)("{{math.square('3')}} - and - {{math.square('5')}}", {
                math: { square: (x) => parseInt(x) ** 2 },
            });
            expect(output).toEqual('9 - and - 25');
        });
    });
    describe('More Supported Syntaxes', () => {
        it('Object property access using key syntax', () => {
            const result = (0, ExpandPlaceholders_1.expandPlaceholders)("Valid: {{supported.func['key']}}", {
                supported: { func: { key: 'value' } },
            });
            expect(result).toEqual('Valid: value');
        });
    });
    describe('Security and Performance', () => {
        it('Prototype pollution prevention', () => {
            expect(() => {
                (0, ExpandPlaceholders_1.expandPlaceholders)('{{__proto__.polluted}}', {});
            }).toThrow(`There was an error expanding one or more placeholders.

The error message was:
    Unknown property: __proto__.polluted

The problem is in:
    {{__proto__.polluted}}`);
        });
        it('Large templates', () => {
            const largeTemplate = Array(1001).fill('{{value}}').join(' and ');
            const output = (0, ExpandPlaceholders_1.expandPlaceholders)(largeTemplate, { value: 'test' });
            expect(output).toEqual('test and '.repeat(1000).trim() + ' test');
        });
    });
});
//# sourceMappingURL=ExpandPlaceholders.test.js.map