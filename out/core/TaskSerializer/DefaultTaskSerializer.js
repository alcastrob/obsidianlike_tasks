"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultTaskSerializer = exports.DEFAULT_SYMBOLS = exports.taskIdSequenceRegex = exports.taskIdRegex = void 0;
const moment_1 = __importDefault(require("moment"));
const TaskLayoutOptions_1 = require("../Layout/TaskLayoutOptions");
const OnCompletion_1 = require("../Task/OnCompletion");
const Occurrence_1 = require("../Task/Occurrence");
const Recurrence_1 = require("../Task/Recurrence");
const Task_1 = require("../Task/Task");
const Priority_1 = require("../Task/Priority");
const TaskRegularExpressions_1 = require("../Task/TaskRegularExpressions");
// The allowed characters in a single task id:
exports.taskIdRegex = /[a-zA-Z0-9-_]+/;
// The allowed characters in a comma-separated sequence of task ids:
exports.taskIdSequenceRegex = new RegExp(exports.taskIdRegex.source + '( *, *' + exports.taskIdRegex.source + ' *)*');
function dateFieldRegex(symbols) {
    return fieldRegex(symbols, '(\\d{4}-\\d{2}-\\d{2})');
}
function fieldRegex(symbols, valueRegexString) {
    // \uFE0F? allows an optional Variant Selector 16 on emojis.
    let source = symbols + '\uFE0F?';
    if (valueRegexString !== '') {
        source += ' *' + valueRegexString;
    }
    // The regexes end with `$` because they will be matched and removed from the end until none
    // are left.
    source += '$';
    return new RegExp(source);
}
/**
 * A symbol map for Obsidian Tasks' default task style. Uses emojis to concisely convey meaning.
 */
exports.DEFAULT_SYMBOLS = {
    prioritySymbols: {
        Highest: '🔺',
        High: '⏫',
        Medium: '🔼',
        Low: '🔽',
        Lowest: '⏬',
        None: '',
    },
    startDateSymbol: '🛫',
    createdDateSymbol: '➕',
    scheduledDateSymbol: '⏳',
    dueDateSymbol: '📅',
    doneDateSymbol: '✅',
    cancelledDateSymbol: '❌',
    recurrenceSymbol: '🔁',
    onCompletionSymbol: '🏁',
    dependsOnSymbol: '⛔',
    idSymbol: '🆔',
    TaskFormatRegularExpressions: {
        priorityRegex: fieldRegex('(🔺|⏫|🔼|🔽|⏬)', ''),
        startDateRegex: dateFieldRegex('🛫'),
        createdDateRegex: dateFieldRegex('➕'),
        scheduledDateRegex: dateFieldRegex('(?:⏳|⌛)'),
        dueDateRegex: dateFieldRegex('(?:📅|📆|🗓)'),
        doneDateRegex: dateFieldRegex('✅'),
        cancelledDateRegex: dateFieldRegex('❌'),
        recurrenceRegex: fieldRegex('🔁', '([a-zA-Z0-9, !]+)'),
        onCompletionRegex: fieldRegex('🏁', '([a-zA-Z]+)'),
        dependsOnRegex: fieldRegex('⛔', '(' + exports.taskIdSequenceRegex.source + ')'),
        idRegex: fieldRegex('🆔', '(' + exports.taskIdRegex.source + ')'),
    },
};
function symbolAndStringValue(shortMode, symbol, value) {
    if (!value)
        return '';
    return shortMode ? ' ' + symbol : ` ${symbol} ${value}`;
}
function symbolAndDateValue(shortMode, symbol, date) {
    if (!date)
        return '';
    return shortMode ? ' ' + symbol : ` ${symbol} ${date.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat)}`;
}
class DefaultTaskSerializer {
    constructor(symbols) {
        this.symbols = symbols;
    }
    /**
     * Convert a task to its string representation (everything after the checkbox).
     */
    serialize(task) {
        const taskLayoutOptions = new TaskLayoutOptions_1.TaskLayoutOptions();
        let taskString = '';
        const shortMode = false;
        for (const component of taskLayoutOptions.shownComponents) {
            taskString += this.componentToString(task, shortMode, component);
        }
        return taskString;
    }
    /**
     * Renders a specific TaskLayoutComponent of the task (its description, priority, etc) as a string.
     */
    componentToString(task, shortMode, component) {
        const { prioritySymbols, startDateSymbol, createdDateSymbol, scheduledDateSymbol, doneDateSymbol, cancelledDateSymbol, recurrenceSymbol, onCompletionSymbol, dueDateSymbol, dependsOnSymbol, idSymbol, } = this.symbols;
        switch (component) {
            case TaskLayoutOptions_1.TaskLayoutComponent.Description:
                return task.description;
            case TaskLayoutOptions_1.TaskLayoutComponent.Priority: {
                let priority = '';
                if (task.priority === Priority_1.Priority.Highest) {
                    priority = ' ' + prioritySymbols.Highest;
                }
                else if (task.priority === Priority_1.Priority.High) {
                    priority = ' ' + prioritySymbols.High;
                }
                else if (task.priority === Priority_1.Priority.Medium) {
                    priority = ' ' + prioritySymbols.Medium;
                }
                else if (task.priority === Priority_1.Priority.Low) {
                    priority = ' ' + prioritySymbols.Low;
                }
                else if (task.priority === Priority_1.Priority.Lowest) {
                    priority = ' ' + prioritySymbols.Lowest;
                }
                return priority;
            }
            case TaskLayoutOptions_1.TaskLayoutComponent.StartDate:
                return symbolAndDateValue(shortMode, startDateSymbol, task.startDate);
            case TaskLayoutOptions_1.TaskLayoutComponent.CreatedDate:
                return symbolAndDateValue(shortMode, createdDateSymbol, task.createdDate);
            case TaskLayoutOptions_1.TaskLayoutComponent.ScheduledDate:
                if (task.scheduledDateIsInferred)
                    return '';
                return symbolAndDateValue(shortMode, scheduledDateSymbol, task.scheduledDate);
            case TaskLayoutOptions_1.TaskLayoutComponent.DoneDate:
                return symbolAndDateValue(shortMode, doneDateSymbol, task.doneDate);
            case TaskLayoutOptions_1.TaskLayoutComponent.CancelledDate:
                return symbolAndDateValue(shortMode, cancelledDateSymbol, task.cancelledDate);
            case TaskLayoutOptions_1.TaskLayoutComponent.DueDate:
                return symbolAndDateValue(shortMode, dueDateSymbol, task.dueDate);
            case TaskLayoutOptions_1.TaskLayoutComponent.RecurrenceRule:
                if (!task.recurrence)
                    return '';
                return symbolAndStringValue(shortMode, recurrenceSymbol, task.recurrence.toText());
            case TaskLayoutOptions_1.TaskLayoutComponent.OnCompletion:
                if (task.onCompletion === OnCompletion_1.OnCompletion.Ignore)
                    return '';
                return symbolAndStringValue(shortMode, onCompletionSymbol, task.onCompletion);
            case TaskLayoutOptions_1.TaskLayoutComponent.DependsOn: {
                if (task.dependsOn.length === 0)
                    return '';
                return symbolAndStringValue(shortMode, dependsOnSymbol, task.dependsOn.join(','));
            }
            case TaskLayoutOptions_1.TaskLayoutComponent.Id:
                return symbolAndStringValue(shortMode, idSymbol, task.id);
            case TaskLayoutOptions_1.TaskLayoutComponent.BlockLink:
                return task.blockLink ?? '';
            default:
                throw new Error(`Don't know how to render task component of type '${component}'`);
        }
    }
    /**
     * Given the string captured by {@link priorityRegex}'s first capture group, returns the
     * corresponding Priority level.
     */
    parsePriority(p) {
        const { prioritySymbols } = this.symbols;
        switch (p) {
            case prioritySymbols.Lowest:
                return Priority_1.Priority.Lowest;
            case prioritySymbols.Low:
                return Priority_1.Priority.Low;
            case prioritySymbols.Medium:
                return Priority_1.Priority.Medium;
            case prioritySymbols.High:
                return Priority_1.Priority.High;
            case prioritySymbols.Highest:
                return Priority_1.Priority.Highest;
            default:
                return Priority_1.Priority.None;
        }
    }
    extractDateField(state, regex, setter) {
        this.extractField(state, regex, (match) => {
            setter((0, moment_1.default)(match[1], TaskRegularExpressions_1.TaskRegularExpressions.dateFormat));
        });
    }
    extractField(state, regex, setter) {
        const match = state.line.match(regex);
        if (match !== null) {
            setter(match);
            state.line = state.line.replace(regex, '').trim();
            state.matched = true;
        }
    }
    /**
     * Parse {@link TaskDetails} from the textual description of a {@link Task}.
     */
    deserialize(line) {
        const { TaskFormatRegularExpressions } = this.symbols;
        // Keep matching and removing special strings from the end of the description in any
        // order. The loop should only run once if the strings are in the expected order after
        // the description.
        const state = { line, matched: false };
        let priority = Priority_1.Priority.None;
        let startDate = null;
        let scheduledDate = null;
        let dueDate = null;
        let doneDate = null;
        let cancelledDate = null;
        let createdDate = null;
        let recurrenceRule = '';
        let recurrence = null;
        let onCompletion = OnCompletion_1.OnCompletion.Ignore;
        let id = '';
        let dependsOn = [];
        // Tags removed from the end while parsing, added back to the description at the end.
        let trailingTags = '';
        // Add a "max runs" failsafe to never end in an endless loop:
        const maxRuns = 20;
        let runs = 0;
        do {
            state.matched = false;
            this.extractField(state, TaskFormatRegularExpressions.priorityRegex, (match) => {
                priority = this.parsePriority(match[1]);
            });
            this.extractDateField(state, TaskFormatRegularExpressions.doneDateRegex, (d) => (doneDate = d));
            this.extractDateField(state, TaskFormatRegularExpressions.cancelledDateRegex, (d) => (cancelledDate = d));
            this.extractDateField(state, TaskFormatRegularExpressions.dueDateRegex, (d) => (dueDate = d));
            this.extractDateField(state, TaskFormatRegularExpressions.scheduledDateRegex, (d) => (scheduledDate = d));
            this.extractDateField(state, TaskFormatRegularExpressions.startDateRegex, (d) => (startDate = d));
            this.extractDateField(state, TaskFormatRegularExpressions.createdDateRegex, (d) => (createdDate = d));
            this.extractField(state, TaskFormatRegularExpressions.recurrenceRegex, (match) => {
                // Save the recurrence rule, but *do not parse it yet*: creating the Recurrence
                // object requires a reference date (e.g. a due date), which might appear in the
                // next (earlier in the line) tokens to parse.
                recurrenceRule = match[1].trim();
            });
            this.extractField(state, TaskFormatRegularExpressions.onCompletionRegex, (match) => {
                onCompletion = (0, OnCompletion_1.parseOnCompletionValue)(match[1]);
            });
            // Match tags from the end to allow users to mix the various task components with
            // tags. These tags will be added back to the description below.
            this.extractField(state, TaskRegularExpressions_1.TaskRegularExpressions.hashTagsFromEnd, (match) => {
                const tagName = match[0].trim();
                trailingTags = trailingTags.length > 0 ? [tagName, trailingTags].join(' ') : tagName;
            });
            this.extractField(state, TaskFormatRegularExpressions.idRegex, (match) => {
                id = match[1].trim();
            });
            this.extractField(state, TaskFormatRegularExpressions.dependsOnRegex, (match) => {
                dependsOn = match[1]
                    .replace(/ /g, '')
                    .split(',')
                    .filter((item) => item !== '');
            });
            runs++;
        } while (state.matched && runs <= maxRuns);
        // Now that we have all the task details, parse the recurrence rule if we found any.
        if (recurrenceRule.length > 0) {
            recurrence = Recurrence_1.Recurrence.fromText({
                recurrenceRuleText: recurrenceRule,
                occurrence: new Occurrence_1.Occurrence({ startDate, scheduledDate, dueDate }),
            });
        }
        // Add back any trailing tags to the description.
        if (trailingTags.length > 0)
            state.line += ' ' + trailingTags;
        return {
            description: state.line,
            priority,
            startDate,
            createdDate,
            scheduledDate,
            dueDate,
            doneDate,
            cancelledDate,
            recurrence,
            onCompletion,
            id,
            dependsOn,
            tags: Task_1.Task.extractHashtags(state.line),
        };
    }
}
exports.DefaultTaskSerializer = DefaultTaskSerializer;
//# sourceMappingURL=DefaultTaskSerializer.js.map