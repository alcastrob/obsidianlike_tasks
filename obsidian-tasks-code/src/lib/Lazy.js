"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lazy = void 0;
/**
 * Lazy loaded variable : fetching the value is postponed until the first obtain()
 */
class Lazy {
    /**
     * Construct a lazy object
     * @param obtain a function that produces a value
     */
    constructor(obtain) {
        this.obtain = obtain;
        this._value = undefined;
    }
    /**
     * Retrieve the lazy value, calling the obtain function the first time.
     */
    get value() {
        if (this._value === undefined) {
            this._value = this.obtain();
        }
        return this._value;
    }
}
exports.Lazy = Lazy;
//# sourceMappingURL=Lazy.js.map