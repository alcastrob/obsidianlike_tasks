"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const JestApprovals_1 = require("approvals/lib/Providers/Jest/JestApprovals");
const moment_1 = __importDefault(require("moment"));
const chrono = __importStar(require("chrono-node"));
const Settings_1 = require("../../src/Config/Settings");
const Suggestor_1 = require("../../src/Suggestor/Suggestor");
const DefaultTaskSerializer_1 = require("../../src/TaskSerializer/DefaultTaskSerializer");
const DataviewTaskSerializer_1 = require("../../src/TaskSerializer/DataviewTaskSerializer");
const VerifyMarkdown_1 = require("../TestingTools/VerifyMarkdown");
const GlobalFilter_1 = require("../../src/Config/GlobalFilter");
const MarkdownTable_1 = require("../../src/lib/MarkdownTable");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const StatusRegistry_1 = require("../../src/Statuses/StatusRegistry");
const StatusConfiguration_1 = require("../../src/Statuses/StatusConfiguration");
window.moment = moment_1.default;
// Set predictable date for all tests in this file
const mockDate = new Date((0, moment_1.default)('2022-07-11 15:00').valueOf());
const chronoSpy = jest
    .spyOn(chrono, 'parseDate')
    .mockImplementation((text, _, options) => chrono.en.casual.parseDate(text, mockDate, options));
const CAN_SAVE_EDITS = true;
afterAll(() => {
    chronoSpy.mockRestore();
});
/**
 * Given a string with **exactly** one vertical bar (`|`), returns the string with the vertical bar removed
 * and the index of the bar.
 *
 * This is used as a helper when writing tests, since it provides a less error prone
 * and more readable way to represent a cursor's position, denoted by the vertical bar, and the string.
 *
 * @param line - A string that contains exactly one vertical bar (`|`)
 * @returns A tuple of the line without the vertical bar, and the index of the vertical bar.
 */
function cursorPosition(line) {
    const line_without_cursor = line.replace(/\|/g, '');
    // Check that the cursor marker appears exactly once in each input string:
    expect(line_without_cursor.length).toEqual(line.length - 1);
    return [line_without_cursor, line.indexOf('|')];
}
/**
 * IDs are randomly generated when a new Task is generated
 * Too make acceptance Tests not fail Everytime, its masked with a, fixed ID Placeholder: "******"
 * @param idSymbol - A string that contains the Definition of the ID Symbol
 * @param suggestions - Suggestion that contain the ID Definition, which should be Replaced
 * @returns the SuggestInfo, with all ID's Masked
 */
function maskIDSuggestionForTesting(idSymbol, suggestions) {
    const idRegex = new RegExp(`${idSymbol}( [0-9a-zA-Z]+)`, 'ug');
    suggestions.forEach((element) => {
        element.appendText = element.appendText.replace(idRegex, `${idSymbol} ******`);
    });
    return suggestions;
}
const MAX_GENERIC_SUGGESTIONS_FOR_TESTS = 50;
describe('default auto-complete settings', () => {
    it('should offer correct default values', () => {
        (0, Settings_1.resetSettings)();
        const settings = (0, Settings_1.getSettings)();
        expect(settings.autoSuggestInEditor).toEqual(true);
        expect(settings.autoSuggestMinMatch).toEqual(0);
        expect(settings.autoSuggestMaxItems).toEqual(20);
    });
});
// NEW_TASK_FIELD_EDIT_REQUIRED
describe.each([
    { name: 'emoji', symbols: DefaultTaskSerializer_1.DEFAULT_SYMBOLS },
    { name: 'dataview', symbols: DataviewTaskSerializer_1.DATAVIEW_SYMBOLS },
])("auto-complete with '$name' symbols", ({ name, symbols }) => {
    const buildSuggestions = (0, Suggestor_1.makeDefaultSuggestionBuilder)(symbols, MAX_GENERIC_SUGGESTIONS_FOR_TESTS, name === 'dataview');
    beforeEach(() => {
        // Note: Dependency suggestions are temporarily turned off in the released plugin,
        //       but turned on in tests so that we continue to check the behaviour.
        global.SHOW_DEPENDENCY_SUGGESTIONS = true;
    });
    afterEach(() => {
        global.SHOW_DEPENDENCY_SUGGESTIONS = false;
    });
    /** Build suggestions for the simple case where the cursor is at the very end of the line.
     */
    function buildSuggestionsForEndOfLine(line, allTasks = []) {
        const originalSettings = (0, Settings_1.getSettings)();
        return buildSuggestions(line, line.length - 1, originalSettings, allTasks, CAN_SAVE_EDITS);
    }
    /**
     * Assert that the suggestions generated from the given line **contain** substrings specified in the
     * {@link expectedSubstrings} array.
     *
     * Each suggestion must contain the corresponding substring from the {@link expectedSubstrings} array.
     *
     * @note Additional suggestions are allowed. This only tests the initial suggestions, as defined
     *       by the number of elements in {@link expectedSubstrings}.
     *
     * @param line - The line to generate suggestions from, when the cursor is at the end of the line.
     * @param expectedSubstrings - The array of substrings that the suggestions should **contain**.
     * @param allTasks - Optional array of tasks to consider while generating suggestions.
     *
     * @returns An array of {@link SuggestInfo} suggestions generated from the line, to allow for additional testing.
     * @see shouldStartWithSuggestionsEqualling
     */
    function shouldStartWithSuggestionsContaining(line, expectedSubstrings, allTasks = []) {
        const useEqual = false;
        return shouldStartWithSuggestions(line, expectedSubstrings, useEqual, allTasks);
    }
    /**
     * Assert that the suggestions generated from the given line **equal** the strings specified in the
     * {@link expectedSuggestions} array.
     *
     * Each suggestion must equal the corresponding string from the {@link expectedSuggestions} array.
     *
     * @note Additional suggestions are allowed. This only tests the initial suggestions, as defined
     *       by the number of elements in {@link expectedSuggestions}.
     *
     * @param line - The line to generate suggestions from, when the cursor is at the end of the line.
     * @param expectedSuggestions - The array of strings that the suggestions should **equal**.
     * @param allTasks - Optional array of tasks to consider while generating suggestions.
     *
     * @returns An array of {@link SuggestInfo} suggestions generated from the line, to allow for additional testing.
     * @see shouldStartWithSuggestionsContaining
     */
    function shouldStartWithSuggestionsEqualling(line, expectedSuggestions, allTasks = []) {
        const useEqual = true;
        return shouldStartWithSuggestions(line, expectedSuggestions, useEqual, allTasks);
    }
    /**
     * @note This is in implementation detail of {@link shouldStartWithSuggestionsContaining}
     *       and {@link shouldStartWithSuggestionsEqualling}. Use them instead.
     */
    function shouldStartWithSuggestions(line, expectedSuggestions, useEqual, allTasks = []) {
        // Validate the test itself:
        expect(expectedSuggestions).not.toHaveLength(0);
        const suggestions = buildSuggestionsForEndOfLine(line, allTasks);
        expectedSuggestions.forEach((expectedSuggestion, index) => {
            const displayText = suggestions[index].displayText;
            if (useEqual) {
                expect(displayText).toEqual(expectedSuggestion);
            }
            else {
                expect(displayText).toContain(expectedSuggestion);
            }
        });
        // return the suggestions, to allow for further validation
        return suggestions;
    }
    function shouldOnlyOfferDefaultSuggestions(suggestions) {
        if (name === 'emoji') {
            expect(suggestions[0].displayText).toEqual('⏎');
        }
        else if (name === 'dataview') {
            expect(suggestions[0].displayText).toEqual('due:: due date');
        }
        else {
            // we should never reach here
            // add a new case above if adding a new format
            expect(1).toEqual(2);
        }
    }
    function shouldOnlyOfferDefaultSuggestionsForEndOfLine(line, allTasks = []) {
        const suggestions = buildSuggestionsForEndOfLine(line, allTasks);
        shouldOnlyOfferDefaultSuggestions(suggestions);
    }
    function verifyFirstSuggestions(lines, title) {
        (0, JestApprovals_1.verifyAll)(title, lines, (line) => {
            const suggestions = buildSuggestionsForEndOfLine(line, []);
            return `For this markdown line:
"${line}"

The first suggestion is:
${JSON.stringify(suggestions[0], null, 4)}
--------------------------------------------------------------------------------
`;
        });
    }
    const { dueDateSymbol, scheduledDateSymbol, startDateSymbol, createdDateSymbol, recurrenceSymbol, idSymbol, dependsOnSymbol, onCompletionSymbol, } = symbols;
    it('offers basic completion options for an empty task', () => {
        // Arrange
        const line = '- [ ] ';
        const suggestions = buildSuggestionsForEndOfLine(line);
        (0, JestApprovals_1.verifyAsJson)(suggestions);
    });
    it('offers generic due date completions', () => {
        // Arrange
        const line = `- [ ] some task ${dueDateSymbol}`;
        shouldStartWithSuggestionsContaining(line, ['today', 'tomorrow']);
    });
    it('offers specific due date completions', () => {
        // Arrange
        const line = `- [ ] some task ${dueDateSymbol} to`;
        shouldStartWithSuggestionsContaining(line, ['today', 'tomorrow']);
    });
    it('offers correct options for partial due date lines', () => {
        const lines = [
            `- [ ] some task ${dueDateSymbol}`, // just the due date symbol
            `- [ ] some task ${dueDateSymbol} 27 oct`, // an absolute date
            `- [ ] some task ${dueDateSymbol} 1 year`, // a relative date
        ];
        verifyFirstSuggestions(lines, 'How due date suggestions are affected by what the user has typed:');
    });
    it('offers generic recurrence completions', () => {
        const line = `- [ ] some task ${recurrenceSymbol}`;
        shouldStartWithSuggestionsEqualling(line, ['every', 'every day', 'every week']);
    });
    it('offers specific recurrence completions', () => {
        // Arrange
        const line = `- [ ] some task ${recurrenceSymbol} every w`;
        shouldStartWithSuggestionsEqualling(line, ['every week', 'every week on Sunday', 'every week on Monday']);
    });
    it('offers correct options for partial recurrence lines', () => {
        const lines = [
            `- [ ] some task ${recurrenceSymbol}`,
            `- [ ] some task ${recurrenceSymbol} ev`,
            `- [ ] some task ${recurrenceSymbol} every day`,
            `- [ ] some task ${recurrenceSymbol} every day when done`,
            `- [ ] some task ${recurrenceSymbol} something else that ends with a space `,
        ];
        verifyFirstSuggestions(lines, 'How due date suggestions are affected by what the user has typed:');
    });
    it('offers OnCompletion completions', () => {
        const line = `- [ ] some task ${onCompletionSymbol}`;
        shouldStartWithSuggestionsEqualling(line, ['delete', 'keep']);
    });
    it('respects the minimal match setting', () => {
        // Arrange
        const originalSettings = (0, Settings_1.getSettings)();
        originalSettings.autoSuggestMinMatch = 2;
        let line = `- [ ] some task ${recurrenceSymbol} e`;
        let suggestions = buildSuggestions(line, 19, originalSettings, [], CAN_SAVE_EDITS);
        expect(suggestions.length).toEqual(0);
        line = `- [ ] some task ${recurrenceSymbol} ev`;
        suggestions = buildSuggestions(line, 20, originalSettings, [], CAN_SAVE_EDITS);
        expect(suggestions[0].displayText).toEqual('every');
        expect(suggestions[1].displayText).toEqual('every day');
    });
    it('matches created property suggestion when user types "created" but not "today"', () => {
        // Arrange
        let line = '- [ ] some task cr';
        shouldStartWithSuggestionsEqualling(line, [`${createdDateSymbol} created today (2022-07-11)`]);
        line = '- [ ] some task tod';
        const suggestions = buildSuggestionsForEndOfLine(line);
        if (name === 'emoji') {
            // The first suggestion is new line
            expect(suggestions[0].suggestionType).toEqual('empty');
        }
        else if (name === 'dataview') {
            // the new line suggestion is not offered for dataview
            expect(suggestions[0].suggestionType).toEqual(undefined);
        }
        else {
            // we should never reach here
            // add a new case above if adding a new format
            expect(1).toEqual(2);
        }
        expect(suggestions[0].displayText).not.toContain('created today');
    });
    describe('suggestions for dependency field ID', () => {
        it('should offer "id" then "depends on" if user typed "id"', () => {
            const line = '- [ ] some task id';
            shouldStartWithSuggestionsEqualling(line, [`${idSymbol} id`, `${dependsOnSymbol} depends on id`]);
        });
        it('should not offer "id" then "depends on" if user typed "id" if cannot save the file', () => {
            const line = '- [ ] some task id';
            const canSaveEdits = false;
            const suggestions = buildSuggestions(line, line.length - 1, (0, Settings_1.getSettings)(), [], canSaveEdits);
            shouldOnlyOfferDefaultSuggestions(suggestions);
        });
        it('should offer to generate unique id if the id symbol is already present', () => {
            const line = `- [ ] some task ${idSymbol}`;
            shouldStartWithSuggestionsEqualling(line, ['generate unique id']);
        });
        it('should offer to generate unique id if the id symbol is already present', () => {
            const line = `- [ ] some task ${idSymbol} 1234`;
            shouldOnlyOfferDefaultSuggestionsForEndOfLine(line);
        });
    });
    describe('suggestions for dependency field ', () => {
        // Make tests more thorough by allowing tests to ensure that there are no more dependency suggestions
        // after the ones we supply to shouldStartWithSuggestionsEqualling():
        const defaultSuggestion = `${dueDateSymbol} due date`;
        function shouldStartWithSuggestedTasks(line, selectedTasks, allTasks) {
            const selectedTaskLabels = selectedTasks.map((task) => suggestionLabel(task));
            shouldStartWithSuggestionsEqualling(line, [...selectedTaskLabels, defaultSuggestion], allTasks);
        }
        function suggestionLabel(task) {
            return `${task.descriptionWithoutTags} - From: ${task.file.filename}`;
        }
        it('should offer to depend on only task in vault, and include its filename in suggestion if user typed "id"', () => {
            const line = `- [ ] some task ${dependsOnSymbol} `;
            const taskToDependOn = TaskBuilder_1.TaskBuilder.createFullyPopulatedTask();
            shouldStartWithSuggestionsEqualling(line, [suggestionLabel(taskToDependOn)], [taskToDependOn]);
        });
        // TODO should not offer to depend on self
        // TODO should offer tasks in current file before those in other files
        // TODO should not offer id or dependsOn if cursor is in the middle of the line
        // TODO test that it uses the same regex for Task IDs as the rest of the code
        // TODO confirm it does not unnecessarily rewrite tasks that already have an ID
        describe('suggesting additional dependencies', () => {
            const taskBuilder = new TaskBuilder_1.TaskBuilder().path('root/dir 1/dir 2/file-name.md');
            const allTasks = [];
            // Function to create a task and append it to the allTasks array
            function createAndAddTask(description, id) {
                const task = taskBuilder.description(description).id(id).build();
                allTasks.push(task);
                return task;
            }
            // Create tasks and add them to allTasks
            // Variable names based on ID, not description:
            const taskxy = createAndAddTask('x_y', 'xy');
            const task1234 = createAndAddTask('1', '1234');
            const task5678 = createAndAddTask('2', '5678');
            it('should suggest all tasks when there is no existing ID after dependsOn', () => {
                const line = `- [ ] some task ${dependsOnSymbol} `;
                shouldStartWithSuggestedTasks(line, [taskxy, task1234, task5678], allTasks);
            });
            it('should offer tasks containing the search string, if given a partial ID', () => {
                // 1 does not match any of the existing IDs, so is presumed to be a substring to search for.
                const line = `- [ ] some task ${dependsOnSymbol} 1`;
                shouldStartWithSuggestedTasks(line, [task1234], allTasks);
            });
            it('should offer tasks containing the search string, if given a partial ID even when no space between symbol and ID', () => {
                // 1 does not match any of the existing IDs, so is presumed to be a substring to search for.
                const line = `- [ ] some task ${dependsOnSymbol}1`;
                shouldStartWithSuggestedTasks(line, [task1234], allTasks);
            });
            it('should offer tasks containing underscore in description, if given as partial ID', () => {
                // x_ does not match any of the existing IDs, so is presumed to be a substring to search for.
                const line = `- [ ] some task ${dependsOnSymbol} x_`;
                shouldStartWithSuggestedTasks(line, [taskxy], allTasks);
            });
            it('should offer tasks containing underscore in description, if given as second partial ID', () => {
                // x_ does not match any of the existing IDs, so is presumed to be a substring to search for.
                const line = `- [ ] some task ${dependsOnSymbol} 1234,x_`;
                shouldStartWithSuggestedTasks(line, [taskxy], allTasks);
            });
            it('should only offer tasks not already depended upon - with 1 existing dependency', () => {
                const line = `- [ ] some task ${dependsOnSymbol} 1234,`;
                shouldStartWithSuggestedTasks(line, [taskxy, task5678], allTasks);
            });
            it('should offer tasks when first existing dependency id has hyphen and underscore', () => {
                const line = `- [ ] some task ${dependsOnSymbol} 1_2-3,`;
                shouldStartWithSuggestedTasks(line, [taskxy, task1234, task5678], allTasks);
            });
            it('should only offer tasks not already depended upon - and allows spaces around commas', () => {
                const line = `- [ ] some task ${dependsOnSymbol} xy , 5678 , `;
                shouldStartWithSuggestedTasks(line, [task1234], allTasks);
            });
            it('should only offer tasks not already depended upon - with all tasks already depended on', () => {
                const line = `- [ ] some task ${dependsOnSymbol} xy,1234,5678,`;
                shouldOnlyOfferDefaultSuggestionsForEndOfLine(line, allTasks);
            });
            it('should use equality to check for existing IDs, not containment', () => {
                const taskWithId123 = taskBuilder.description('3').id('123').build();
                const line = `- [ ] some task ${dependsOnSymbol} xy,1234,5678,`;
                // 123 is only a substring of one of the ID 1234 which is already depended on, not an exat match.
                // So it should not count as already matched.
                shouldStartWithSuggestedTasks(line, [taskWithId123], [taskWithId123, ...allTasks]);
            });
            it('should find non-exact matches for multi-word search strings', () => {
                const feedBaby = taskBuilder.description('Feed the baby').id('bby').build();
                const feedCat = taskBuilder.description('Feed the cat').id('ct').build();
                const line = `- [ ] some task ${dependsOnSymbol} xy,1234,5678,feed baby`;
                // Search string 'feed baby' should match only 'Feed the baby':
                shouldStartWithSuggestedTasks(line, [feedBaby], [feedBaby, feedCat, ...allTasks]);
            });
            it('should allow punctuation in search strings', () => {
                const peace1 = taskBuilder.description('World peace!').id('peace1').build();
                // Don't match a task that has peace present, but without the exclamation mark
                const peace2 = taskBuilder.description('Peacefulness').id('peace2').build();
                const line = `- [ ] some task ${dependsOnSymbol} xy,1234,5678,peace!`;
                shouldStartWithSuggestedTasks(line, [peace1], [peace1, peace2, ...allTasks]);
            });
            it('should not offer any tasks if there is not a comma after existing depends IDs', () => {
                const line = `- [ ] some task ${dependsOnSymbol} 1234,5678`;
                shouldOnlyOfferDefaultSuggestionsForEndOfLine(line, allTasks);
            });
            it('should not offer tasks if "IDs" are separated by spaces', () => {
                const line = `- [ ] some task ${dependsOnSymbol} 1234 5678`;
                shouldOnlyOfferDefaultSuggestionsForEndOfLine(line, allTasks);
            });
        });
    });
    it('show all suggested text', () => {
        // Turn off dependency suggestions for now, as per default value,
        // as the outputs of this test are embedded in the documentation,
        // and I wish to hide ID and dependsOn there.
        global.SHOW_DEPENDENCY_SUGGESTIONS = Suggestor_1.showDependencySuggestionsDefault;
        const originalSettings = (0, Settings_1.getSettings)();
        originalSettings.autoSuggestMaxItems = 200;
        // NEW_TASK_FIELD_EDIT_REQUIRED
        const lines = [
            '- [ ] some task',
            `- [ ] some task ${recurrenceSymbol} `,
            `- [ ] some task ${dueDateSymbol} `,
            `- [ ] some task ${scheduledDateSymbol} `,
            `- [ ] some task ${startDateSymbol} `,
            `- [ ] some task ${onCompletionSymbol} `,
        ];
        if (global.SHOW_DEPENDENCY_SUGGESTIONS) {
            lines.push(`- [ ] some task ${idSymbol} `);
            lines.push(`- [ ] some task ${dependsOnSymbol} `);
        }
        const markdownTable = new MarkdownTable_1.MarkdownTable(['Searchable Text', 'Text that is added']);
        for (const line of lines) {
            let suggestions = buildSuggestions(line, line.length - 1, originalSettings, [], CAN_SAVE_EDITS);
            suggestions = maskIDSuggestionForTesting(idSymbol, suggestions);
            for (const suggestion of suggestions) {
                // The 'new line' replacement adds a trailing space at the end of a line,
                // which causes auto-formatting to then make the test fail.
                // So we replace the 'new line' character with some fixed text,
                // that displays nicely when the output Markdown table is viewed.
                let replacementText = `${suggestion.appendText}`;
                if (replacementText === '\n') {
                    replacementText = '&lt;new line>';
                }
                markdownTable.addRowIfNew([suggestion.displayText, replacementText]);
            }
        }
        // For help if this test fails and you are new to Approval Tests, see:
        //    https://publish.obsidian.md/tasks-contributing/Testing/Approval+Tests
        (0, VerifyMarkdown_1.verifyMarkdown)(markdownTable.markdown);
    });
});
describe('onlySuggestIfBracketOpen', () => {
    const buildSuggestions = (0, Suggestor_1.onlySuggestIfBracketOpen)(
    // A dummy SuggestionBuilder. Just used to validate that results are returned, results aren't meaningful
    () => [{}], [
        ['(', ')'],
        ['[', ']'],
    ]);
    const emptySuggestion = [];
    it('should suggest if cursor at end of line with an open pair', () => {
        const settings = (0, Settings_1.getSettings)();
        let suggestions = buildSuggestions(...cursorPosition('(hello world|'), settings, [], CAN_SAVE_EDITS);
        expect(suggestions).not.toEqual(emptySuggestion);
        suggestions = buildSuggestions(...cursorPosition('[hello world|'), settings, [], CAN_SAVE_EDITS);
        expect(suggestions).not.toEqual(emptySuggestion);
    });
    it('should suggest if cursor at end of line with an nested open pairs', () => {
        const settings = (0, Settings_1.getSettings)();
        let suggestions = buildSuggestions(...cursorPosition('(((hello world))|'), settings, [], CAN_SAVE_EDITS);
        expect(suggestions).not.toEqual(emptySuggestion);
        suggestions = buildSuggestions(...cursorPosition('[[[hello world]]|'), settings, [], CAN_SAVE_EDITS);
        expect(suggestions).not.toEqual(emptySuggestion);
    });
    it('should suggest if cursor in middle of closed pair', () => {
        const settings = (0, Settings_1.getSettings)();
        let suggestions = buildSuggestions(...cursorPosition('(hello world|)'), settings, [], CAN_SAVE_EDITS);
        expect(suggestions).not.toEqual(emptySuggestion);
        suggestions = buildSuggestions(...cursorPosition('[hello world|]'), settings, [], CAN_SAVE_EDITS);
        expect(suggestions).not.toEqual(emptySuggestion);
    });
    it('should suggest if there is an opening bracket after many closing brackets', () => {
        const suggestions = buildSuggestions(...cursorPosition(']]]]]]](hello|'), (0, Settings_1.getSettings)(), [], CAN_SAVE_EDITS);
        expect(suggestions).not.toEqual(emptySuggestion);
    });
    it('should not suggest on an empty line', () => {
        const suggestions = buildSuggestions(...cursorPosition('|'), (0, Settings_1.getSettings)(), [], CAN_SAVE_EDITS);
        expect(suggestions).toEqual(emptySuggestion);
    });
    it("should not suggest if there's no open bracket at cursor position", () => {
        const suggestions = buildSuggestions(...cursorPosition('(hello world)|'), (0, Settings_1.getSettings)(), [], CAN_SAVE_EDITS);
        expect(suggestions).toEqual(emptySuggestion);
    });
});
describe('canSuggestForLine', () => {
    afterEach(() => {
        GlobalFilter_1.GlobalFilter.getInstance().reset();
        (0, Settings_1.resetSettings)();
    });
    function canSuggestForLineWithCursor(line, editor = {}) {
        const [testLine, cursorIndex] = cursorPosition(line);
        return (0, Suggestor_1.canSuggestForLine)(testLine, { line: 0, ch: cursorIndex }, editor);
    }
    it('should not suggest if there is no checkbox', () => {
        GlobalFilter_1.GlobalFilter.getInstance().reset();
        expect(canSuggestForLineWithCursor('- not a task line|')).toEqual(false);
    });
    it('should suggest if there is no global filter and cursor is in the description', () => {
        GlobalFilter_1.GlobalFilter.getInstance().reset();
        expect(canSuggestForLineWithCursor('- [ ] global filter is not set|')).toEqual(true);
    });
    it('should suggest if global filter missing from line', () => {
        GlobalFilter_1.GlobalFilter.getInstance().set('#todo');
        expect(canSuggestForLineWithCursor('- [ ] #todo has global filter|')).toEqual(true);
    });
    it('should not suggest if global filter missing from line', () => {
        GlobalFilter_1.GlobalFilter.getInstance().set('#todo');
        expect(canSuggestForLineWithCursor('- [ ] no global filter|')).toEqual(false);
    });
    it('should not suggest when cursor is in empty line', () => {
        expect(canSuggestForLineWithCursor('|')).toEqual(false);
    });
    it('should not suggest when cursor is in the checkbox', () => {
        expect(canSuggestForLineWithCursor('- [ |] ')).toEqual(false);
        expect(canSuggestForLineWithCursor('- [ ]| ')).toEqual(false);
    });
    it('should not suggest if cursor is on a task with NON_TASK status', () => {
        // With the default statuses, ? is TODO, so we should suggest:
        expect(canSuggestForLineWithCursor('- [?] question|')).toEqual(true);
        StatusRegistry_1.StatusRegistry.getInstance().add(new StatusConfiguration_1.StatusConfiguration('?', 'Question', '_', true, StatusConfiguration_1.StatusType.NON_TASK));
        // Now ? is NON_TASK, so we should NOT suggest (issue #1509):
        expect(canSuggestForLineWithCursor('- [?] question|')).toEqual(false);
    });
    it('should suggest when the cursor is at least one character past the checkbox', () => {
        expect(canSuggestForLineWithCursor('- [ ] |')).toEqual(true);
    });
    it('should suggest correctly when task is in a numbered list', () => {
        expect(canSuggestForLineWithCursor('1. [ ]|')).toEqual(false);
        expect(canSuggestForLineWithCursor('1. [ ] |')).toEqual(true);
    });
    it('should suggest correctly when task is indented', () => {
        expect(canSuggestForLineWithCursor('    - [ ]|')).toEqual(false);
        expect(canSuggestForLineWithCursor('    - [ ] |')).toEqual(true);
    });
    it('should display when the editor requests the suggest', () => {
        GlobalFilter_1.GlobalFilter.getInstance().reset();
        let shouldShow = true;
        const mockEditor = {
            editorComponent: {
                showTasksPluginAutoSuggest: () => shouldShow,
            },
        };
        shouldShow = true;
        expect(canSuggestForLineWithCursor('- not a task line|', mockEditor)).toEqual(true);
        shouldShow = false;
        expect(canSuggestForLineWithCursor('- [ ] this *is* a task line|', mockEditor)).toEqual(false);
        shouldShow = undefined;
        expect(canSuggestForLineWithCursor('- [ ] this *is* a task line|', mockEditor)).toEqual(true);
    });
});
describe('lastOpenBracket', () => {
    it('should return null if there are no open brackets', () => {
        expect((0, Suggestor_1.lastOpenBracket)('hello world', [])).toEqual(null);
        expect((0, Suggestor_1.lastOpenBracket)('hello world', [
            ['(', ')'],
            ['[', ']'],
        ])).toEqual(null);
        expect((0, Suggestor_1.lastOpenBracket)('(hello world) [Hello world]', [
            ['(', ')'],
            ['[', ']'],
        ])).toEqual(null);
        expect((0, Suggestor_1.lastOpenBracket)('([hello world)]', [
            ['(', ')'],
            ['[', ']'],
        ])).toEqual(null);
    });
    it('should return the last open bracket', () => {
        expect((0, Suggestor_1.lastOpenBracket)('(hello world', [['(', ')']])).toEqual('(');
        expect((0, Suggestor_1.lastOpenBracket)('[hello world', [['[', ']']])).toEqual('[');
        expect((0, Suggestor_1.lastOpenBracket)('([hello world)', [
            ['(', ')'],
            ['[', ']'],
        ])).toEqual('[');
        expect((0, Suggestor_1.lastOpenBracket)('))))(', [['(', ')']])).toEqual('(');
    });
});
//# sourceMappingURL=Suggestor.test.js.map