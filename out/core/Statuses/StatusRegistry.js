"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusRegistry = void 0;
const Status_1 = require("./Status");
const StatusConfiguration_1 = require("./StatusConfiguration");
/**
 * Tracks all the registered statuses a task can have.
 *
 * Use `StatusRegistry.getInstance()` to obtain the single global instance.
 *
 * @class StatusRegistry
 */
class StatusRegistry {
    constructor() {
        this._registeredStatuses = [];
        this.addDefaultStatusTypes();
    }
    /**
     * Reset this instance to contain only the given status list, in the supplied order.
     * Duplicate status symbols are ignored.
     */
    set(statuses) {
        this.clearStatuses();
        statuses.forEach((status) => {
            this.add(status);
        });
    }
    /**
     * Returns all the registered statuses minus the empty status.
     */
    get registeredStatuses() {
        return this._registeredStatuses.filter(({ symbol }) => symbol !== Status_1.Status.EMPTY.symbol);
    }
    static getInstance() {
        if (!StatusRegistry.instance) {
            StatusRegistry.instance = new StatusRegistry();
        }
        return StatusRegistry.instance;
    }
    /**
     * Adds a new Status to the registry if not already registered.
     */
    add(status) {
        if (!this.hasSymbol(status.symbol)) {
            if (status instanceof Status_1.Status) {
                this._registeredStatuses.push(status);
            }
            else {
                this._registeredStatuses.push(new Status_1.Status(status));
            }
        }
    }
    /**
     * Returns the registered status by the symbol between the square braces in the markdown task.
     * Returns an EMPTY status if symbol is unknown.
     */
    bySymbol(symbol) {
        if (this.hasSymbol(symbol)) {
            return this.getSymbol(symbol);
        }
        return Status_1.Status.EMPTY;
    }
    /**
     * Returns the registered status by symbol, creating a usable new Status with this given
     * symbol if it is unknown. Note: an unknown symbol is not added to the registry.
     */
    bySymbolOrCreate(symbol) {
        if (this.hasSymbol(symbol)) {
            return this.getSymbol(symbol);
        }
        return Status_1.Status.createUnknownStatus(symbol);
    }
    byName(nameToFind) {
        if (this._registeredStatuses.filter(({ name }) => name === nameToFind).length > 0) {
            return this._registeredStatuses.filter(({ name }) => name === nameToFind)[0];
        }
        return Status_1.Status.EMPTY;
    }
    resetToDefaultStatuses() {
        this.clearStatuses();
        this.addDefaultStatusTypes();
    }
    clearStatuses() {
        this._registeredStatuses = [];
    }
    /**
     * To allow custom progression of task status each status knows which status can come after it
     * as a state transition.
     */
    getNextStatus(status) {
        if (status.nextStatusSymbol !== '') {
            const nextStatus = this.bySymbol(status.nextStatusSymbol);
            if (nextStatus !== null) {
                return nextStatus;
            }
        }
        return Status_1.Status.EMPTY;
    }
    /**
     * Return the next status if it exists, and if not, create a new TODO status using the
     * requested next symbol.
     */
    getNextStatusOrCreate(status) {
        const nextStatus = this.getNextStatus(status);
        if (nextStatus.type !== StatusConfiguration_1.StatusType.EMPTY) {
            return nextStatus;
        }
        return Status_1.Status.createUnknownStatus(status.nextStatusSymbol);
    }
    /**
     * Return the status to use for a recurring task that has just been completed.
     */
    getNextRecurrenceStatusOrCreate(newStatus) {
        const nextStatus = this.getNextStatusOrCreate(newStatus);
        const result1 = this.getNextRecurrenceStatusOfType(nextStatus, StatusConfiguration_1.StatusType.TODO);
        if (result1) {
            return result1;
        }
        const result2 = this.getNextRecurrenceStatusOfType(nextStatus, StatusConfiguration_1.StatusType.IN_PROGRESS);
        if (result2) {
            return result2;
        }
        return this.bySymbolOrCreate(' ');
    }
    getNextRecurrenceStatusOfType(nextStatus, wanted) {
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
    getSymbol(symbolToFind) {
        return this._registeredStatuses.filter(({ symbol }) => symbol === symbolToFind)[0];
    }
    hasSymbol(symbolToFind) {
        return (this._registeredStatuses.find((element) => {
            return element.symbol === symbolToFind;
        }) !== undefined);
    }
    addDefaultStatusTypes() {
        const defaultStatuses = [Status_1.Status.TODO, Status_1.Status.IN_PROGRESS, Status_1.Status.DONE, Status_1.Status.CANCELLED];
        defaultStatuses.forEach((status) => {
            this.add(status);
        });
    }
}
exports.StatusRegistry = StatusRegistry;
//# sourceMappingURL=StatusRegistry.js.map