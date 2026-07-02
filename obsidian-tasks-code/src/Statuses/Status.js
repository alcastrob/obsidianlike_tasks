"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Status = void 0;
const StatusConfiguration_1 = require("./StatusConfiguration");
/**
 * Tracks the possible states that a task can be in.
 *
 * Related classes:
 * @see StatusConfiguration
 * @see StatusRegistry
 * @see StatusSettings
 * @see StatusSettingsHelpers.ts
 * @see CustomStatusModal
 *
 * @class Status
 */
class Status {
    /**
     * The symbol used between the two square brackets in the markdown task.
     *
     * @type {string}
     */
    get symbol() {
        return this.configuration.symbol;
    }
    /**
     * Returns the name of the status for display purposes.
     *
     * @type {string}
     */
    get name() {
        return this.configuration.name;
    }
    /**
     * Returns the next status for a task when toggled.
     *
     * @type {string}
     * @see nextSymbol
     */
    get nextStatusSymbol() {
        return this.configuration.nextStatusSymbol;
    }
    /**
     * Returns the next status for a task when toggled.
     * This is an alias for {@link nextStatusSymbol} which is provided for brevity in user scripts.
     *
     * @type {string}
     * @see nextStatusSymbol
     */
    get nextSymbol() {
        return this.configuration.nextStatusSymbol;
    }
    /**
     * If true then it is registered as a command that the user can map to.
     *
     * @type {boolean}
     */
    get availableAsCommand() {
        return this.configuration.availableAsCommand;
    }
    /**
     * Returns the status type. See {@link StatusType} for details.
     */
    get type() {
        return this.configuration.type;
    }
    /**
     * Returns the text to be used to represent the {@link StatusType} in group headings.
     *
     * The status types are in the same order as given by 'group by status.type'.
     * This is provided as a convenience for use in custom grouping.
     */
    get typeGroupText() {
        const type = this.type;
        let prefix;
        // Add a numeric prefix to sort in to a meaningful order for users
        switch (type) {
            case StatusConfiguration_1.StatusType.IN_PROGRESS:
                prefix = '1';
                break;
            case StatusConfiguration_1.StatusType.TODO:
                prefix = '2';
                break;
            case StatusConfiguration_1.StatusType.ON_HOLD:
                prefix = '3';
                break;
            case StatusConfiguration_1.StatusType.DONE:
                prefix = '4';
                break;
            case StatusConfiguration_1.StatusType.CANCELLED:
                prefix = '5';
                break;
            case StatusConfiguration_1.StatusType.NON_TASK:
                prefix = '6';
                break;
            case StatusConfiguration_1.StatusType.EMPTY:
                prefix = '7';
                break;
        }
        // Text inside the %%..%% comments is used to control the sorting in both sorting of tasks and naming of groups.
        // The comments are hidden by Obsidian when the headings are rendered.
        return `%%${prefix}%%${type}`;
    }
    /**
     * Creates an instance of Status. The registry will be added later in the case
     * of the default statuses.
     *
     * @param {StatusConfiguration} configuration
     */
    constructor(configuration) {
        this.configuration = configuration;
    }
    /**
     * Return the StatusType to use for a symbol, if it is not in the StatusRegistry.
     * The core symbols are recognised.
     * Other symbols are treated as StatusType.TODO
     * @param symbol
     */
    static getTypeForUnknownSymbol(symbol) {
        switch (symbol) {
            case 'x':
            case 'X':
                return StatusConfiguration_1.StatusType.DONE;
            case '/':
                return StatusConfiguration_1.StatusType.IN_PROGRESS;
            case '-':
                return StatusConfiguration_1.StatusType.CANCELLED;
            case '':
                return StatusConfiguration_1.StatusType.EMPTY;
            case ' ':
            default:
                return StatusConfiguration_1.StatusType.TODO;
        }
    }
    /**
     * Convert text that was saved from a StatusType value back to a StatusType.
     * Returns StatusType.TODO if the string is not valid.
     * @param statusTypeAsString
     */
    static getTypeFromStatusTypeString(statusTypeAsString) {
        return StatusConfiguration_1.StatusType[statusTypeAsString] || StatusConfiguration_1.StatusType.TODO;
    }
    /**
     * Create a Status representing the given, unknown symbol.
     *
     * This can be useful when StatusRegistry does not recognise a symbol,
     * and we do not want to expose the user's data to the Status.EMPTY status.
     *
     * The type is set to TODO.
     * @param unknownSymbol
     */
    static createUnknownStatus(unknownSymbol) {
        return new Status(new StatusConfiguration_1.StatusConfiguration(unknownSymbol, 'Unknown', 'x', false, StatusConfiguration_1.StatusType.TODO));
    }
    /**
     * Helper function for bulk-importing settings from arrays of strings.
     *
     * @param imported An array of symbol, name, next symbol, status type
     */
    static createFromImportedValue(imported) {
        const symbol = imported[0];
        const type = Status.getTypeFromStatusTypeString(imported[3]);
        return new Status(new StatusConfiguration_1.StatusConfiguration(symbol, imported[1], imported[2], false, type));
    }
    /**
     * Returns the completion status for a task, this is only supported
     * when the task is done/x.
     *
     * @return {*}  {boolean}
     */
    isCompleted() {
        return this.type === StatusConfiguration_1.StatusType.DONE;
    }
    /**
     * Whether the task status type is {@link CANCELLED}.
     */
    isCancelled() {
        return this.type === StatusConfiguration_1.StatusType.CANCELLED;
    }
    /**
     * Compare all the fields in another Status, to detect any differences from this one.
     *
     * If any field is different in any way, it will return false.
     *
     * @param other
     */
    identicalTo(other) {
        const args = [
            'symbol',
            'name',
            'nextStatusSymbol',
            'availableAsCommand',
            'type',
        ];
        for (const el of args) {
            if (this[el] !== other[el])
                return false;
        }
        return true;
    }
    /**
     * Return a one-line summary of the status, for presentation to users.
     */
    previewText() {
        let commandNotice = '';
        if (Status.tasksPluginCanCreateCommandsForStatuses() && this.availableAsCommand) {
            commandNotice = ' Available as a command.';
        }
        return (`- [${this.symbol}]` + // comment to break line
            ` => [${this.nextStatusSymbol}],` +
            ` name: '${this.name}',` +
            ` type: '${this.configuration.type}'.` +
            `${commandNotice}`);
    }
    /**
     * Whether Tasks can yet create 'Toggle Status' commands for statuses
     *
     * This is not yet possible, and so some UI features are temporarily hidden.
     * See https://github.com/obsidian-tasks-group/obsidian-tasks/issues/1486
     * Once that issue is addressed, this method can be removed.
     */
    static tasksPluginCanCreateCommandsForStatuses() {
        return false;
    }
}
exports.Status = Status;
/**
 * The default Done status. Goes to Todo when toggled.
 *
 * @static
 * @type {Status}
 */
Status.DONE = new Status(new StatusConfiguration_1.StatusConfiguration('x', 'Done', ' ', true, StatusConfiguration_1.StatusType.DONE));
/**
 * A default status of empty, used when things go wrong.
 *
 * @static
 * @type {Status}
 */
Status.EMPTY = new Status(new StatusConfiguration_1.StatusConfiguration('', 'EMPTY', '', true, StatusConfiguration_1.StatusType.EMPTY));
/**
 * The default Todo status. Goes to Done when toggled.
 * User may later be able to override this to go to In Progress instead.
 *
 * @static
 * @type {Status}
 */
Status.TODO = new Status(new StatusConfiguration_1.StatusConfiguration(' ', 'Todo', 'x', true, StatusConfiguration_1.StatusType.TODO));
/**
 * The default Cancelled status. Goes to Todo when toggled.
 *
 * @static
 * @type {Status}
 */
Status.CANCELLED = new Status(new StatusConfiguration_1.StatusConfiguration('-', 'Cancelled', ' ', true, StatusConfiguration_1.StatusType.CANCELLED));
/**
 * The default In Progress status. Goes to Done when toggled.
 *
 * @static
 * @type {Status}
 */
Status.IN_PROGRESS = new Status(new StatusConfiguration_1.StatusConfiguration('/', 'In Progress', 'x', true, StatusConfiguration_1.StatusType.IN_PROGRESS));
/**
 * The default On Hold status. Goes to Todo when toggled.
 *
 * @static
 * @type {Status}
 */
Status.ON_HOLD = new Status(new StatusConfiguration_1.StatusConfiguration('h', 'On Hold', ' ', true, StatusConfiguration_1.StatusType.ON_HOLD));
/**
 * A sample Non-Task status. Goes to NON_TASK when toggled.
 *
 * @static
 * @type {Status}
 */
Status.NON_TASK = new Status(new StatusConfiguration_1.StatusConfiguration('Q', 'Non-Task', 'A', true, StatusConfiguration_1.StatusType.NON_TASK));
//# sourceMappingURL=Status.js.map