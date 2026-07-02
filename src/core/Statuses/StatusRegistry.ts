import { Status } from './Status';
import { StatusConfiguration, StatusType } from './StatusConfiguration';

/**
 * Tracks all the registered statuses a task can have.
 *
 * Use `StatusRegistry.getInstance()` to obtain the single global instance.
 *
 * @class StatusRegistry
 */
export class StatusRegistry {
    private static instance: StatusRegistry;

    private _registeredStatuses: Status[] = [];

    public constructor() {
        this.addDefaultStatusTypes();
    }

    /**
     * Reset this instance to contain only the given status list, in the supplied order.
     * Duplicate status symbols are ignored.
     */
    public set(statuses: StatusConfiguration[] | Status[]) {
        this.clearStatuses();
        statuses.forEach((status) => {
            this.add(status);
        });
    }

    /**
     * Returns all the registered statuses minus the empty status.
     */
    public get registeredStatuses(): Status[] {
        return this._registeredStatuses.filter(({ symbol }) => symbol !== Status.EMPTY.symbol);
    }

    public static getInstance(): StatusRegistry {
        if (!StatusRegistry.instance) {
            StatusRegistry.instance = new StatusRegistry();
        }

        return StatusRegistry.instance;
    }

    /**
     * Adds a new Status to the registry if not already registered.
     */
    public add(status: StatusConfiguration | Status): void {
        if (!this.hasSymbol(status.symbol)) {
            if (status instanceof Status) {
                this._registeredStatuses.push(status);
            } else {
                this._registeredStatuses.push(new Status(status));
            }
        }
    }

    /**
     * Returns the registered status by the symbol between the square braces in the markdown task.
     * Returns an EMPTY status if symbol is unknown.
     */
    public bySymbol(symbol: string): Status {
        if (this.hasSymbol(symbol)) {
            return this.getSymbol(symbol);
        }

        return Status.EMPTY;
    }

    /**
     * Returns the registered status by symbol, creating a usable new Status with this given
     * symbol if it is unknown. Note: an unknown symbol is not added to the registry.
     */
    public bySymbolOrCreate(symbol: string): Status {
        if (this.hasSymbol(symbol)) {
            return this.getSymbol(symbol);
        }

        return Status.createUnknownStatus(symbol);
    }

    public byName(nameToFind: string): Status {
        if (this._registeredStatuses.filter(({ name }) => name === nameToFind).length > 0) {
            return this._registeredStatuses.filter(({ name }) => name === nameToFind)[0];
        }

        return Status.EMPTY;
    }

    public resetToDefaultStatuses(): void {
        this.clearStatuses();
        this.addDefaultStatusTypes();
    }

    public clearStatuses(): void {
        this._registeredStatuses = [];
    }

    /**
     * To allow custom progression of task status each status knows which status can come after it
     * as a state transition.
     */
    public getNextStatus(status: Status): Status {
        if (status.nextStatusSymbol !== '') {
            const nextStatus = this.bySymbol(status.nextStatusSymbol);
            if (nextStatus !== null) {
                return nextStatus;
            }
        }
        return Status.EMPTY;
    }

    /**
     * Return the next status if it exists, and if not, create a new TODO status using the
     * requested next symbol.
     */
    public getNextStatusOrCreate(status: Status): Status {
        const nextStatus = this.getNextStatus(status);
        if (nextStatus.type !== StatusType.EMPTY) {
            return nextStatus;
        }
        return Status.createUnknownStatus(status.nextStatusSymbol);
    }

    /**
     * Return the status to use for a recurring task that has just been completed.
     */
    public getNextRecurrenceStatusOrCreate(newStatus: Status) {
        const nextStatus = this.getNextStatusOrCreate(newStatus);

        const result1 = this.getNextRecurrenceStatusOfType(nextStatus, StatusType.TODO);
        if (result1) {
            return result1;
        }

        const result2 = this.getNextRecurrenceStatusOfType(nextStatus, StatusType.IN_PROGRESS);
        if (result2) {
            return result2;
        }

        return this.bySymbolOrCreate(' ');
    }

    private getNextRecurrenceStatusOfType(nextStatus: Status, wanted: StatusType) {
        if (nextStatus.type === wanted) {
            return nextStatus;
        }
        let searchStatus = nextStatus;
        for (let i = 0; i < this.registeredStatuses.length - 1; i++) {
            searchStatus = this.getNextStatusOrCreate(searchStatus);
            if (searchStatus.type === wanted) {
                return searchStatus;
            }
        }
        return undefined;
    }

    private getSymbol(symbolToFind: string): Status {
        return this._registeredStatuses.filter(({ symbol }) => symbol === symbolToFind)[0];
    }

    private hasSymbol(symbolToFind: string): boolean {
        return (
            this._registeredStatuses.find((element) => {
                return element.symbol === symbolToFind;
            }) !== undefined
        );
    }

    private addDefaultStatusTypes(): void {
        const defaultStatuses = [Status.TODO, Status.IN_PROGRESS, Status.DONE, Status.CANCELLED];

        defaultStatuses.forEach((status) => {
            this.add(status);
        });
    }
}
