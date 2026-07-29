import { StatusConfiguration, StatusType } from './StatusConfiguration';
import type { StatusCollectionEntry } from './StatusCollection';

/**
 * Tracks the possible states that a task can be in.
 *
 * @class Status
 */
export class Status {
    /** The default Done status. Goes to Todo when toggled. */
    public static readonly DONE: Status = new Status(new StatusConfiguration('x', 'Done', ' ', true, StatusType.DONE));

    /** A default status of empty, used when things go wrong. */
    public static readonly EMPTY: Status = new Status(new StatusConfiguration('', 'EMPTY', '', true, StatusType.EMPTY));

    /** The default Todo status. Goes to Done when toggled. */
    public static readonly TODO: Status = new Status(new StatusConfiguration(' ', 'Todo', 'x', true, StatusType.TODO));

    /** The default Cancelled status. Goes to Todo when toggled. */
    public static readonly CANCELLED: Status = new Status(
        new StatusConfiguration('-', 'Cancelled', ' ', true, StatusType.CANCELLED),
    );

    /** The default In Progress status. Goes to Done when toggled. */
    public static readonly IN_PROGRESS: Status = new Status(
        new StatusConfiguration('/', 'In Progress', 'x', true, StatusType.IN_PROGRESS),
    );

    /** The default On Hold status. Goes to Todo when toggled. */
    public static readonly ON_HOLD: Status = new Status(
        new StatusConfiguration('h', 'On Hold', ' ', true, StatusType.ON_HOLD),
    );

    /** A sample Non-Task status. Goes to NON_TASK when toggled. */
    public static readonly NON_TASK: Status = new Status(
        new StatusConfiguration('Q', 'Non-Task', 'A', true, StatusType.NON_TASK),
    );

    /** This port's own "En espera" convention (see CLAUDE.md's "Notas adicionales" section and
     * `STATUS_ICON_EMOJI`/`STATUS_ICON` in the two consuming repos, which render this symbol as
     * ⏳). Uses its own {@link StatusType.WAITING} rather than reusing upstream's
     * {@link StatusType.ON_HOLD} — added alongside {@link Status.DELEGATED}'s own
     * {@link StatusType.DELEGATED} for the same reason and for consistency between the two.
     * Goes to Done when toggled. */
    public static readonly WAITING: Status = new Status(
        new StatusConfiguration('w', 'Waiting', 'x', true, StatusType.WAITING),
    );

    /** This port's own "Delegada" convention (rendered as 👤 — see `WAITING` above for the same
     * reasoning). Uses its own {@link StatusType.DELEGATED} rather than reusing TODO — reusing
     * TODO used to mean `status.type is TODO` (or `task.status.type === "TODO"` in a `filter by
     * function`) silently matched delegated tasks too, which is rarely what "not started" is
     * meant to select. Goes to Done when toggled. */
    public static readonly DELEGATED: Status = new Status(
        new StatusConfiguration('d', 'Delegated', 'x', true, StatusType.DELEGATED),
    );

    public readonly configuration: StatusConfiguration;

    public get symbol(): string {
        return this.configuration.symbol;
    }

    public get name(): string {
        return this.configuration.name;
    }

    public get nextStatusSymbol(): string {
        return this.configuration.nextStatusSymbol;
    }

    public get nextSymbol(): string {
        return this.configuration.nextStatusSymbol;
    }

    public get availableAsCommand(): boolean {
        return this.configuration.availableAsCommand;
    }

    public get type(): StatusType {
        return this.configuration.type;
    }

    /**
     * Returns the text to be used to represent the {@link StatusType} in group headings.
     */
    public get typeGroupText(): string {
        const type = this.type;
        let prefix: string;
        switch (type) {
            case StatusType.IN_PROGRESS:
                prefix = '1';
                break;
            case StatusType.TODO:
                prefix = '2';
                break;
            case StatusType.ON_HOLD:
                prefix = '3';
                break;
            case StatusType.WAITING:
                prefix = '4';
                break;
            case StatusType.DELEGATED:
                prefix = '5';
                break;
            case StatusType.DONE:
                prefix = '6';
                break;
            case StatusType.CANCELLED:
                prefix = '7';
                break;
            case StatusType.NON_TASK:
                prefix = '8';
                break;
            case StatusType.EMPTY:
                prefix = '9';
                break;
        }
        return `%%${prefix}%%${type}`;
    }

    constructor(configuration: StatusConfiguration) {
        this.configuration = configuration;
    }

    /**
     * Return the StatusType to use for a symbol, if it is not in the StatusRegistry.
     * The core symbols are recognised. Other symbols are treated as StatusType.TODO
     */
    static getTypeForUnknownSymbol(symbol: string): StatusType {
        switch (symbol) {
            case 'x':
            case 'X':
                return StatusType.DONE;
            case '/':
                return StatusType.IN_PROGRESS;
            case '-':
                return StatusType.CANCELLED;
            case '':
                return StatusType.EMPTY;
            case ' ':
            default:
                return StatusType.TODO;
        }
    }

    static getTypeFromStatusTypeString(statusTypeAsString: string): StatusType {
        return StatusType[statusTypeAsString as keyof typeof StatusType] || StatusType.TODO;
    }

    /**
     * Create a Status representing the given, unknown symbol.
     * The type is set to TODO.
     */
    static createUnknownStatus(unknownSymbol: string) {
        return new Status(new StatusConfiguration(unknownSymbol, 'Unknown', 'x', false, StatusType.TODO));
    }

    static createFromImportedValue(imported: StatusCollectionEntry) {
        const symbol = imported[0];
        const type = Status.getTypeFromStatusTypeString(imported[3]);
        return new Status(new StatusConfiguration(symbol, imported[1], imported[2], false, type));
    }

    /**
     * Returns the completion status for a task, this is only supported
     * when the task is done/x.
     */
    public isCompleted(): boolean {
        return this.type === StatusType.DONE;
    }

    /**
     * Whether the task status type is {@link StatusType.CANCELLED}.
     */
    public isCancelled(): boolean {
        return this.type === StatusType.CANCELLED;
    }

    /**
     * Compare all the fields in another Status, to detect any differences from this one.
     */
    public identicalTo(other: Status): boolean {
        const args: Array<keyof StatusConfiguration> = [
            'symbol',
            'name',
            'nextStatusSymbol',
            'availableAsCommand',
            'type',
        ];
        for (const el of args) {
            if (this[el] !== other[el]) return false;
        }
        return true;
    }
}
