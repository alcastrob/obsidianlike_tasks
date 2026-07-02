"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryLocalStorageProvider = void 0;
/**
 * Test implementation of {@link LocalStorageProvider}.
 */
class InMemoryLocalStorageProvider {
    constructor() {
        this.values = new Map();
    }
    load(key) {
        if (!this.values.has(key)) {
            return null;
        }
        return this.values.get(key) ?? null;
    }
    save(key, value) {
        if (value === null) {
            this.values.delete(key);
            return;
        }
        this.values.set(key, value);
    }
}
exports.InMemoryLocalStorageProvider = InMemoryLocalStorageProvider;
//# sourceMappingURL=InMemoryLocalStorageProvider.js.map