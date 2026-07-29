/**
 * Collection of status types supported by the plugin.
 */
export enum StatusType {
    TODO = 'TODO',
    DONE = 'DONE',
    IN_PROGRESS = 'IN_PROGRESS',
    ON_HOLD = 'ON_HOLD',
    CANCELLED = 'CANCELLED',
    NON_TASK = 'NON_TASK',
    EMPTY = 'EMPTY',
    /** This port's own addition — not part of upstream Obsidian Tasks' {@link StatusType}. Gives
     * {@link Status.DELEGATED} ('d') a type distinct from {@link StatusType.TODO}, so `filter by
     * function task.status.type === "TODO"` (or `status.type is TODO`) doesn't silently match
     * delegated tasks too. See {@link Status.DELEGATED} for the history — it used to reuse TODO
     * on the theory that "delegated" was close enough to "not personally done", but that made
     * `status.type is TODO` an unreliable way to mean "not started". */
    DELEGATED = 'DELEGATED',
    /** This port's own addition, for the same reason as {@link StatusType.DELEGATED} and added
     * alongside it for consistency: gives {@link Status.WAITING} ('w') a type of its own instead
     * of reusing upstream's {@link StatusType.ON_HOLD}, so `status.type is WAITING` reads as
     * precisely what it selects instead of borrowing a same-ish-but-not-quite upstream concept. */
    WAITING = 'WAITING',
}

/**
 * This is the object used to create the status objects for the session.
 *
 * @class StatusConfiguration
 */
export class StatusConfiguration {
    /**
     * The character used between the two square brackets in the markdown task.
     */
    public readonly symbol: string;

    /**
     * Returns the name of the status for display purposes.
     */
    public readonly name: string;

    /**
     * Returns the next status for a task when toggled.
     */
    public readonly nextStatusSymbol: string;

    /**
     * If true then it is registered as a command that the user can map to.
     */
    public readonly availableAsCommand: boolean;

    /**
     * Returns the status type. See {@link StatusType} for details.
     */
    public readonly type: StatusType;

    constructor(
        symbol: string,
        name: string,
        nextStatusSymbol: string,
        availableAsCommand: boolean,
        type: StatusType = StatusType.TODO,
    ) {
        this.symbol = symbol;
        this.name = name;
        this.nextStatusSymbol = nextStatusSymbol;
        this.availableAsCommand = availableAsCommand;
        this.type = type;
    }
}
