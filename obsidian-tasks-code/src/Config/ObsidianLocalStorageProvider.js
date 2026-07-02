"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObsidianLocalStorageProvider = void 0;
/**
 * Implementation of {@link LocalStorageProvider} backed by Obsidian's vault-local app storage.
 */
class ObsidianLocalStorageProvider {
    constructor(app) {
        this.app = app;
    }
    load(key) {
        return this.app.loadLocalStorage(key);
    }
    save(key, value) {
        this.app.saveLocalStorage(key, value);
    }
}
exports.ObsidianLocalStorageProvider = ObsidianLocalStorageProvider;
//# sourceMappingURL=ObsidianLocalStorageProvider.js.map