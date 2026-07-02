import moment from 'moment';
import type { Moment } from 'moment';
import { TaskLayoutComponent, TaskLayoutOptions } from '../Layout/TaskLayoutOptions';
import { OnCompletion, parseOnCompletionValue } from '../Task/OnCompletion';
import { Occurrence } from '../Task/Occurrence';
import { Recurrence } from '../Task/Recurrence';
import { Task } from '../Task/Task';
import { Priority } from '../Task/Priority';
import { TaskRegularExpressions } from '../Task/TaskRegularExpressions';

/**
 * Describes the fields deserialized from a task's markdown body (everything after the
 * checkbox), before it is combined with the surrounding {@link Task} fields.
 */
export interface TaskDetails {
    description: string;
    priority: Priority;
    startDate: Moment | null;
    createdDate: Moment | null;
    scheduledDate: Moment | null;
    dueDate: Moment | null;
    doneDate: Moment | null;
    cancelledDate: Moment | null;
    recurrence: Recurrence | null;
    onCompletion: OnCompletion;
    id: string;
    dependsOn: string[];
    tags: string[];
}

export interface DefaultTaskSerializerSymbols {
    readonly prioritySymbols: {
        Highest: string;
        High: string;
        Medium: string;
        Low: string;
        Lowest: string;
        None: string;
    };
    readonly startDateSymbol: string;
    readonly createdDateSymbol: string;
    readonly scheduledDateSymbol: string;
    readonly dueDateSymbol: string;
    readonly doneDateSymbol: string;
    readonly cancelledDateSymbol: string;
    readonly recurrenceSymbol: string;
    readonly onCompletionSymbol: string;
    readonly idSymbol: string;
    readonly dependsOnSymbol: string;
    readonly TaskFormatRegularExpressions: {
        priorityRegex: RegExp;
        startDateRegex: RegExp;
        createdDateRegex: RegExp;
        scheduledDateRegex: RegExp;
        dueDateRegex: RegExp;
        doneDateRegex: RegExp;
        cancelledDateRegex: RegExp;
        recurrenceRegex: RegExp;
        onCompletionRegex: RegExp;
        idRegex: RegExp;
        dependsOnRegex: RegExp;
    };
}

interface ParsingState {
    line: string;
    matched: boolean;
}

// The allowed characters in a single task id:
export const taskIdRegex = /[a-zA-Z0-9-_]+/;

// The allowed characters in a comma-separated sequence of task ids:
export const taskIdSequenceRegex = new RegExp(taskIdRegex.source + '( *, *' + taskIdRegex.source + ' *)*');

function dateFieldRegex(symbols: string) {
    return fieldRegex(symbols, '(\\d{4}-\\d{2}-\\d{2})');
}

function fieldRegex(symbols: string, valueRegexString: string) {
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
export const DEFAULT_SYMBOLS: DefaultTaskSerializerSymbols = {
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
        dependsOnRegex: fieldRegex('⛔', '(' + taskIdSequenceRegex.source + ')'),
        idRegex: fieldRegex('🆔', '(' + taskIdRegex.source + ')'),
    },
} as const;

function symbolAndStringValue(shortMode: boolean, symbol: string, value: string) {
    if (!value) return '';
    return shortMode ? ' ' + symbol : ` ${symbol} ${value}`;
}

function symbolAndDateValue(shortMode: boolean, symbol: string, date: Moment | null) {
    if (!date) return '';
    return shortMode ? ' ' + symbol : ` ${symbol} ${date.format(TaskRegularExpressions.dateFormat)}`;
}

export class DefaultTaskSerializer {
    constructor(public readonly symbols: DefaultTaskSerializerSymbols) {}

    /**
     * Convert a task to its string representation (everything after the checkbox).
     */
    public serialize(task: Task): string {
        const taskLayoutOptions = new TaskLayoutOptions();
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
    public componentToString(task: Task, shortMode: boolean, component: TaskLayoutComponent) {
        const {
            prioritySymbols,
            startDateSymbol,
            createdDateSymbol,
            scheduledDateSymbol,
            doneDateSymbol,
            cancelledDateSymbol,
            recurrenceSymbol,
            onCompletionSymbol,
            dueDateSymbol,
            dependsOnSymbol,
            idSymbol,
        } = this.symbols;

        switch (component) {
            case TaskLayoutComponent.Description:
                return task.description;
            case TaskLayoutComponent.Priority: {
                let priority: string = '';

                if (task.priority === Priority.Highest) {
                    priority = ' ' + prioritySymbols.Highest;
                } else if (task.priority === Priority.High) {
                    priority = ' ' + prioritySymbols.High;
                } else if (task.priority === Priority.Medium) {
                    priority = ' ' + prioritySymbols.Medium;
                } else if (task.priority === Priority.Low) {
                    priority = ' ' + prioritySymbols.Low;
                } else if (task.priority === Priority.Lowest) {
                    priority = ' ' + prioritySymbols.Lowest;
                }
                return priority;
            }
            case TaskLayoutComponent.StartDate:
                return symbolAndDateValue(shortMode, startDateSymbol, task.startDate);
            case TaskLayoutComponent.CreatedDate:
                return symbolAndDateValue(shortMode, createdDateSymbol, task.createdDate);
            case TaskLayoutComponent.ScheduledDate:
                if (task.scheduledDateIsInferred) return '';
                return symbolAndDateValue(shortMode, scheduledDateSymbol, task.scheduledDate);
            case TaskLayoutComponent.DoneDate:
                return symbolAndDateValue(shortMode, doneDateSymbol, task.doneDate);
            case TaskLayoutComponent.CancelledDate:
                return symbolAndDateValue(shortMode, cancelledDateSymbol, task.cancelledDate);
            case TaskLayoutComponent.DueDate:
                return symbolAndDateValue(shortMode, dueDateSymbol, task.dueDate);
            case TaskLayoutComponent.RecurrenceRule:
                if (!task.recurrence) return '';
                return symbolAndStringValue(shortMode, recurrenceSymbol, task.recurrence.toText());
            case TaskLayoutComponent.OnCompletion:
                if (task.onCompletion === OnCompletion.Ignore) return '';
                return symbolAndStringValue(shortMode, onCompletionSymbol, task.onCompletion);
            case TaskLayoutComponent.DependsOn: {
                if (task.dependsOn.length === 0) return '';
                return symbolAndStringValue(shortMode, dependsOnSymbol, task.dependsOn.join(','));
            }
            case TaskLayoutComponent.Id:
                return symbolAndStringValue(shortMode, idSymbol, task.id);
            case TaskLayoutComponent.BlockLink:
                return task.blockLink ?? '';
            default:
                throw new Error(`Don't know how to render task component of type '${component as string}'`);
        }
    }

    /**
     * Given the string captured by {@link priorityRegex}'s first capture group, returns the
     * corresponding Priority level.
     */
    protected parsePriority(p: string): Priority {
        const { prioritySymbols } = this.symbols;
        switch (p) {
            case prioritySymbols.Lowest:
                return Priority.Lowest;
            case prioritySymbols.Low:
                return Priority.Low;
            case prioritySymbols.Medium:
                return Priority.Medium;
            case prioritySymbols.High:
                return Priority.High;
            case prioritySymbols.Highest:
                return Priority.Highest;
            default:
                return Priority.None;
        }
    }

    private extractDateField(state: ParsingState, regex: RegExp, setter: (date: Moment) => void): void {
        this.extractField(state, regex, (match) => {
            setter(moment(match[1], TaskRegularExpressions.dateFormat));
        });
    }

    private extractField(state: ParsingState, regex: RegExp, setter: (match: RegExpMatchArray) => void): void {
        const match: RegExpMatchArray | null = state.line.match(regex);
        if (match !== null) {
            setter(match);
            state.line = state.line.replace(regex, '').trim();
            state.matched = true;
        }
    }

    /**
     * Parse {@link TaskDetails} from the textual description of a {@link Task}.
     */
    public deserialize(line: string): TaskDetails {
        const { TaskFormatRegularExpressions } = this.symbols;

        // Keep matching and removing special strings from the end of the description in any
        // order. The loop should only run once if the strings are in the expected order after
        // the description.
        const state: ParsingState = { line, matched: false };
        let priority: Priority = Priority.None;
        let startDate: Moment | null = null;
        let scheduledDate: Moment | null = null;
        let dueDate: Moment | null = null;
        let doneDate: Moment | null = null;
        let cancelledDate: Moment | null = null;
        let createdDate: Moment | null = null;
        let recurrenceRule: string = '';
        let recurrence: Recurrence | null = null;
        let onCompletion: OnCompletion = OnCompletion.Ignore;
        let id: string = '';
        let dependsOn: string[] | [] = [];
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
                onCompletion = parseOnCompletionValue(match[1]);
            });

            // Match tags from the end to allow users to mix the various task components with
            // tags. These tags will be added back to the description below.
            this.extractField(state, TaskRegularExpressions.hashTagsFromEnd, (match) => {
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
            recurrence = Recurrence.fromText({
                recurrenceRuleText: recurrenceRule,
                occurrence: new Occurrence({ startDate, scheduledDate, dueDate }),
            });
        }
        // Add back any trailing tags to the description.
        if (trailingTags.length > 0) state.line += ' ' + trailingTags;

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
            tags: Task.extractHashtags(state.line),
        };
    }
}
