"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const TaskSerializer_1 = require("../../src/TaskSerializer");
const RecurrenceBuilder_1 = require("../TestingTools/RecurrenceBuilder");
const DefaultTaskSerializer_1 = require("../../src/TaskSerializer/DefaultTaskSerializer");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const OnCompletion_1 = require("../../src/Task/OnCompletion");
const Priority_1 = require("../../src/Task/Priority");
const StringHelpers_1 = require("../../src/lib/StringHelpers");
jest.mock('obsidian');
window.moment = moment_1.default;
// A map that facilitates parameterizing the tests over symbols
const symbolMap = [{ taskFormat: 'tasksPluginEmoji', symbols: DefaultTaskSerializer_1.DEFAULT_SYMBOLS }];
/**
 * Since Variant Selectors are invisible, any tests whose behaviour is dependent on the
 * presence or absence of one MUST 'expect' on the result of this function,
 * to confirm that the test is doing what it claims to be doing.
 * @param text
 */
function hasVariantSelector16(text) {
    const vs16Regex = /\uFE0F/u;
    return text.match(vs16Regex) !== null;
}
describe('validate emojis', () => {
    // If these tests fail, paste the problem emoji in to https://apps.timwhitlock.info/unicode/inspect
    it.each((0, DefaultTaskSerializer_1.allTaskPluginEmojis)())('emoji does not contain Variant Selector 16: "%s"', (emoji) => {
        expect(hasVariantSelector16(emoji)).toBe(false);
    });
});
describe('validate emoji regular expressions', () => {
    /**
     * Generate a string representation of all regular expressions
     * in TaskFormatRegularExpressions by concatenating their source and flags.
     */
    function generateRegexApprovalTest() {
        const regexMap = DefaultTaskSerializer_1.DEFAULT_SYMBOLS.TaskFormatRegularExpressions;
        const regexDetails = Object.entries(regexMap).map(([key, regex]) => {
            // Get the source and flags for each regex
            if (regex instanceof RegExp) {
                return `${key}: /${regex.source}/${regex.flags}`;
            }
            else {
                throw new Error(`Unexpected value for ${key}: Not a regular expression.`);
            }
        });
        // Concatenate all entries into a single string, with any Variation Selectors made visible
        return (0, StringHelpers_1.escapeInvisibleCharacters)('\n' + regexDetails.join('\n') + '\n');
    }
    it('regular expressions should have expected source', () => {
        expect(generateRegexApprovalTest()).toMatchInlineSnapshot(`
            "
            priorityRegex: /(🔺|⏫|🔼|🔽|⏬)\\ufe0f?$/
            startDateRegex: /🛫\\ufe0f? *(\\d{4}-\\d{2}-\\d{2})$/
            createdDateRegex: /➕\\ufe0f? *(\\d{4}-\\d{2}-\\d{2})$/
            scheduledDateRegex: /(?:⏳|⌛)\\ufe0f? *(\\d{4}-\\d{2}-\\d{2})$/
            dueDateRegex: /(?:📅|📆|🗓)\\ufe0f? *(\\d{4}-\\d{2}-\\d{2})$/
            doneDateRegex: /✅\\ufe0f? *(\\d{4}-\\d{2}-\\d{2})$/
            cancelledDateRegex: /❌\\ufe0f? *(\\d{4}-\\d{2}-\\d{2})$/
            recurrenceRegex: /🔁\\ufe0f? *([a-zA-Z0-9, !]+)$/
            onCompletionRegex: /🏁\\ufe0f? *([a-zA-Z]+)$/
            dependsOnRegex: /⛔\\ufe0f? *([a-zA-Z0-9-_]+( *, *[a-zA-Z0-9-_]+ *)*)$/
            idRegex: /🆔\\ufe0f? *([a-zA-Z0-9-_]+)$/
            "
        `);
    });
});
// NEW_TASK_FIELD_EDIT_REQUIRED
describe.each(symbolMap)("DefaultTaskSerializer with '$taskFormat' symbols", ({ symbols }) => {
    const taskSerializer = new TaskSerializer_1.DefaultTaskSerializer(symbols);
    const serialize = taskSerializer.serialize.bind(taskSerializer);
    const deserialize = taskSerializer.deserialize.bind(taskSerializer);
    const { startDateSymbol, createdDateSymbol, recurrenceSymbol, onCompletionSymbol, scheduledDateSymbol, dueDateSymbol, doneDateSymbol, idSymbol, dependsOnSymbol, } = symbols;
    describe('deserialize', () => {
        it('should parse an empty string', () => {
            const taskDetails = deserialize('');
            expect(taskDetails).toMatchTaskDetails({});
        });
        describe('should parse dates', () => {
            it.each([
                { what: 'startDate', symbol: startDateSymbol },
                { what: 'createdDate', symbol: createdDateSymbol },
                { what: 'scheduledDate', symbol: scheduledDateSymbol },
                { what: 'dueDate', symbol: dueDateSymbol },
                { what: 'doneDate', symbol: doneDateSymbol },
            ])('should parse a $what', ({ what, symbol }) => {
                const taskDetails = deserialize(`${symbol} 2021-06-20`);
                expect(taskDetails).toMatchTaskDetails({ [what]: (0, moment_1.default)('2021-06-20', 'YYYY-MM-DD') });
            });
            it('should parse a scheduledDate - with non-standard emoji', () => {
                const taskDetails = deserialize('⌛ 2021-06-20');
                expect(taskDetails).toMatchTaskDetails({ ['scheduledDate']: (0, moment_1.default)('2021-06-20', 'YYYY-MM-DD') });
            });
            it('should parse a scheduledDate - with Variation Selector', () => {
                // This test showed the existence of https://github.com/obsidian-tasks-group/obsidian-tasks/issues/3179
                const input = '⏳️ 2024-11-18';
                expect(hasVariantSelector16(input)).toBe(true);
                const taskDetails = deserialize(input);
                expect(taskDetails).toMatchTaskDetails({ ['scheduledDate']: (0, moment_1.default)('2024-11-18', 'YYYY-MM-DD') });
            });
            it('should parse a dueDate - with non-standard emoji 1', () => {
                const taskDetails = deserialize('📆 2021-06-20');
                expect(taskDetails).toMatchTaskDetails({ ['dueDate']: (0, moment_1.default)('2021-06-20', 'YYYY-MM-DD') });
            });
            it('should parse a dueDate - with non-standard emoji 2', () => {
                const taskDetails = deserialize('🗓 2021-06-20');
                expect(taskDetails).toMatchTaskDetails({ ['dueDate']: (0, moment_1.default)('2021-06-20', 'YYYY-MM-DD') });
            });
        });
        describe('should parse priorities', () => {
            it('should parse a priority', () => {
                const priorities = ['Highest', 'High', 'None', 'Medium', 'Low', 'Lowest'];
                for (const p of priorities) {
                    const prioritySymbol = symbols.prioritySymbols[p];
                    const priority = Priority_1.Priority[p];
                    const taskDetails = deserialize(`${prioritySymbol}`);
                    expect(taskDetails).toMatchTaskDetails({ priority });
                }
            });
            it('should parse a high priority without Variant Selector 16', () => {
                const line = '⏫';
                expect(hasVariantSelector16(line)).toBe(false);
                const taskDetails = deserialize(line);
                expect(taskDetails).toMatchTaskDetails({ priority: Priority_1.Priority.High });
            });
            it('should parse a high priority with Variant Selector 16', () => {
                // This test showed the existence of https://github.com/obsidian-tasks-group/obsidian-tasks/issues/2273
                const line = '⏫️'; // There is a hidden Variant Selector 16 character at the end of this string
                expect(hasVariantSelector16(line)).toBe(true);
                const taskDetails = deserialize(line);
                expect(taskDetails).toMatchTaskDetails({ priority: Priority_1.Priority.High });
            });
        });
        it('should parse a recurrence', () => {
            const taskDetails = deserialize(`${recurrenceSymbol} every day`);
            expect(taskDetails).toMatchTaskDetails({
                recurrence: new RecurrenceBuilder_1.RecurrenceBuilder().rule('every day').build(),
            });
        });
        describe('should parse onCompletion', () => {
            it('should parse delete action', () => {
                const onCompletion = `${onCompletionSymbol} Delete`;
                const taskDetails = deserialize(onCompletion);
                expect(taskDetails).toMatchTaskDetails({ onCompletion: OnCompletion_1.OnCompletion.Delete });
            });
            it('should allow multiple spaces', () => {
                const onCompletion = `${onCompletionSymbol}  Keep`;
                const taskDetails = deserialize(onCompletion);
                expect(taskDetails).toMatchTaskDetails({ onCompletion: OnCompletion_1.OnCompletion.Keep });
            });
        });
        describe('should parse depends on', () => {
            it('should parse depends on one task', () => {
                const id = `${dependsOnSymbol} F12345`;
                const taskDetails = deserialize(id);
                expect(taskDetails).toMatchTaskDetails({ dependsOn: ['F12345'] });
            });
            it('should parse depends on one task - without Variant Selector 16', () => {
                // This test showed the existence of https://github.com/obsidian-tasks-group/obsidian-tasks/issues/2693
                const id = '⛔ F12345';
                expect(hasVariantSelector16(id)).toBe(false);
                const taskDetails = deserialize(id);
                expect(taskDetails).toMatchTaskDetails({ dependsOn: ['F12345'] });
            });
            it('should parse depends on one task - with Variant Selector 16', () => {
                const id = '⛔️ F12345'; // There is a hidden Variant Selector 16 character at the end of this string
                expect(hasVariantSelector16(id)).toBe(true);
                const taskDetails = deserialize(id);
                expect(taskDetails).toMatchTaskDetails({ dependsOn: ['F12345'] });
            });
            it('should parse depends on two tasks', () => {
                const id = `${dependsOnSymbol} 123456,abC123`;
                const taskDetails = deserialize(id);
                expect(taskDetails).toMatchTaskDetails({ dependsOn: ['123456', 'abC123'] });
            });
            it('should parse depends on multiple tasks with varying spaces tasks', () => {
                const id = `${dependsOnSymbol} ab , CD ,  EF  ,    GK`;
                const taskDetails = deserialize(id);
                expect(taskDetails).toMatchTaskDetails({ dependsOn: ['ab', 'CD', 'EF', 'GK'] });
            });
        });
        describe('should parse id', () => {
            it('should parse id with lower-case and numbers', () => {
                const id = `${idSymbol} pqrd0f`;
                const taskDetails = deserialize(id);
                expect(taskDetails).toMatchTaskDetails({ id: 'pqrd0f' });
            });
            it('should parse id with capitals', () => {
                const id = `${idSymbol} Abcd0f`;
                const taskDetails = deserialize(id);
                expect(taskDetails).toMatchTaskDetails({ id: 'Abcd0f' });
            });
            it('should parse id with hyphen', () => {
                const id = `${idSymbol} Abcd0f-`;
                const taskDetails = deserialize(id);
                expect(taskDetails).toMatchTaskDetails({ id: 'Abcd0f-' });
            });
            it('should parse id with underscore', () => {
                const id = `${idSymbol} Ab_cd0f`;
                const taskDetails = deserialize(id);
                expect(taskDetails).toMatchTaskDetails({ id: 'Ab_cd0f' });
            });
            it('should not parse id with asterisk, so id is left in description', () => {
                const id = `${idSymbol} A*bcd0f`;
                const taskDetails = deserialize(id);
                expect(taskDetails).toMatchTaskDetails({ description: id, id: '' });
            });
        });
        it('should parse tags', () => {
            const description = ' #hello #world #task';
            const taskDetails = deserialize(description);
            expect(taskDetails).toMatchTaskDetails({ tags: ['#hello', '#world', '#task'], description });
        });
    });
    describe('serialize', () => {
        it('should serialize an "Empty" Task as the empty string', () => {
            const serialized = serialize(new TaskBuilder_1.TaskBuilder().description('').build());
            expect(serialized).toEqual('');
        });
        it.each([
            { what: 'startDate', symbol: startDateSymbol },
            { what: 'createdDate', symbol: createdDateSymbol },
            { what: 'scheduledDate', symbol: scheduledDateSymbol },
            { what: 'dueDate', symbol: dueDateSymbol },
            { what: 'doneDate', symbol: doneDateSymbol },
        ])('should serialize a $what', ({ what, symbol }) => {
            const serialized = serialize(new TaskBuilder_1.TaskBuilder()[what]('2021-06-20').description('').build());
            expect(serialized).toEqual(` ${symbol} 2021-06-20`);
        });
        it('should serialize a Highest, High, Medium, Low and Lowest priority', () => {
            const priorities = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];
            for (const p of priorities) {
                const task = new TaskBuilder_1.TaskBuilder().priority(Priority_1.Priority[p]).description('').build();
                const serialized = serialize(task);
                expect(serialized).toEqual(` ${symbols.prioritySymbols[p]}`);
            }
        });
        it('should serialize a None priority', () => {
            const task = new TaskBuilder_1.TaskBuilder().priority(Priority_1.Priority.None).description('').build();
            const serialized = serialize(task);
            expect(serialized).toEqual('');
        });
        it('should serialize a recurrence', () => {
            const task = new TaskBuilder_1.TaskBuilder()
                .recurrence(new RecurrenceBuilder_1.RecurrenceBuilder().rule('every day').build())
                .description('')
                .build();
            const serialized = serialize(task);
            expect(serialized).toEqual(` ${recurrenceSymbol} every day`);
        });
        it('should serialize onCompletion', () => {
            const task = new TaskBuilder_1.TaskBuilder().onCompletion(OnCompletion_1.OnCompletion.Delete).description('').build();
            const serialized = serialize(task);
            expect(serialized).toEqual(` ${onCompletionSymbol} delete`);
        });
        it('should serialize depends on', () => {
            const task = new TaskBuilder_1.TaskBuilder().description('').dependsOn(['123456', 'abc123']).build();
            const serialized = serialize(task);
            expect(serialized).toEqual(` ${dependsOnSymbol} 123456,abc123`);
        });
        it('should serialize id', () => {
            const task = new TaskBuilder_1.TaskBuilder().description('').id('abcdef').build();
            const serialized = serialize(task);
            expect(serialized).toEqual(` ${idSymbol} abcdef`);
        });
        it('should serialize tags', () => {
            const task = new TaskBuilder_1.TaskBuilder().description('').tags(['#hello', '#world', '#task']).build();
            const serialized = serialize(task);
            expect(serialized).toEqual(' #hello #world #task');
        });
    });
});
//# sourceMappingURL=DefaultTaskSerializer.test.js.map