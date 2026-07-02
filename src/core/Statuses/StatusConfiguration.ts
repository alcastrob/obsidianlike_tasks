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
