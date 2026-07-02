"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Status = void 0;
const StatusConfiguration_1 = require("./StatusConfiguration");
/**
 * Tracks the possible states that a task can be in.
 *
 * @class Status
 */
class Status {
    get symbol() {
        return this.configuration.symbol;
    }
    get name() {
        return this.configuration.name;
    }
    get nextStatusSymbol() {
        return this.configuration.nextStatusSymbol;
    }
    get nextSymbol() {
        return this.configuration.nextStatusSymbol;
    }
    get availableAsCommand() {
        return this.configuration.availableAsCommand;
    }
    get type() {
        return this.configuration.type;
    }
    /**
     * Returns the text to be used to represent the {@link StatusType} in group headings.
     */
    get typeGroupText() {
        const type = this.type;
        let prefix;
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
        return `%%${prefix}%%${type}`;
    }
    constructor(configuration) {
        this.configuration = configuration;
    }
    /**
     * Return the StatusType to use for a symbol, if it is not in the StatusRegistry.
     * The core symbols are recognised. Other symbols are treated as StatusType.TODO
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
    static getTypeFromStatusTypeString(statusTypeAsString) {
        return StatusConfiguration_1.StatusType[statusTypeAsString] || StatusConfiguration_1.StatusType.TODO;
    }
    /**
     * Create a Status representing the given, unknown symbol.
     * The type is set to TODO.
     */
    static createUnknownStatus(unknownSymbol) {
        return new Status(new StatusConfiguration_1.StatusConfiguration(unknownSymbol, 'Unknown', 'x', false, StatusConfiguration_1.StatusType.TODO));
    }
    static createFromImportedValue(imported) {
        const symbol = imported[0];
        const type = Status.getTypeFromStatusTypeString(imported[3]);
        return new Status(new StatusConfiguration_1.StatusConfiguration(symbol, imported[1], imported[2], false, type));
    }
    /**
     * Returns the completion status for a task, this is only supported
     * when the task is done/x.
     */
    isCompleted() {
        return this.type === StatusConfiguration_1.StatusType.DONE;
    }
    /**
     * Whether the task status type is {@link StatusType.CANCELLED}.
     */
    isCancelled() {
        return this.type === StatusConfiguration_1.StatusType.CANCELLED;
    }
    /**
     * Compare all the fields in another Status, to detect any differences from this one.
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
}
exports.Status = Status;
/** The default Done status. Goes to Todo when toggled. */
Status.DONE = new Status(new StatusConfiguration_1.StatusConfiguration('x', 'Done', ' ', true, StatusConfiguration_1.StatusType.DONE));
/** A default status of empty, used when things go wrong. */
Status.EMPTY = new Status(new StatusConfiguration_1.StatusConfiguration('', 'EMPTY', '', true, StatusConfiguration_1.StatusType.EMPTY));
/** The default Todo status. Goes to Done when toggled. */
Status.TODO = new Status(new StatusConfiguration_1.StatusConfiguration(' ', 'Todo', 'x', true, StatusConfiguration_1.StatusType.TODO));
/** The default Cancelled status. Goes to Todo when toggled. */
Status.CANCELLED = new Status(new StatusConfiguration_1.StatusConfiguration('-', 'Cancelled', ' ', true, StatusConfiguration_1.StatusType.CANCELLED));
/** The default In Progress status. Goes to Done when toggled. */
Status.IN_PROGRESS = new Status(new StatusConfiguration_1.StatusConfiguration('/', 'In Progress', 'x', true, StatusConfiguration_1.StatusType.IN_PROGRESS));
/** The default On Hold status. Goes to Todo when toggled. */
Status.ON_HOLD = new Status(new StatusConfiguration_1.StatusConfiguration('h', 'On Hold', ' ', true, StatusConfiguration_1.StatusType.ON_HOLD));
/** A sample Non-Task status. Goes to NON_TASK when toggled. */
Status.NON_TASK = new Status(new StatusConfiguration_1.StatusConfiguration('Q', 'Non-Task', 'A', true, StatusConfiguration_1.StatusType.NON_TASK));
//# sourceMappingURL=Status.js.map