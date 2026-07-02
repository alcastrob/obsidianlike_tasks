"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnableJsInTasksQueries = exports.DEFAULT_ENABLE_JS_IN_TASKS_QUERIES = exports.ENABLE_JS_IN_TASKS_QUERIES_KEY = void 0;
exports.ENABLE_JS_IN_TASKS_QUERIES_KEY = 'enableJsInTasksQueries';
exports.DEFAULT_ENABLE_JS_IN_TASKS_QUERIES = false;
/**
 * In-memory representation of whether JavaScript is enabled in Tasks queries.
 *
 * There are two ways of using this class.
 * - In production code, call {@link EnableJsInTasksQueries.getInstance()} to obtain
 *   the single global instance initialised by the plugin.
 * - Tests can use `new EnableJsInTasksQueries(storage)`, which makes simpler,
 *   more readable tests that can be run in parallel.
 *
 * The value is loaded from Obsidian's vault-local app storage when this object is created,
 * then kept in memory for fast reads.
 *
 * Updates are written back to vault-local app storage, but are intentionally not persisted
 * to the plugin's data.json settings file.
 */
class EnableJsInTasksQueries {
    /**
     * Creates an instance of the JavaScript-in-Tasks-queries setting.
     *
     * Code in the plugin should use {@link getInstance} to access the global instance.
     */
    constructor(storage) {
        this.storage = storage;
        this.value = this.loadValue();
    }
    /**
     * Initialises the single global instance from Obsidian's vault-local app storage.
     *
     * This should be called once during plugin startup.
     */
    static initialise(storage) {
        EnableJsInTasksQueries.instance = new EnableJsInTasksQueries(storage);
        return EnableJsInTasksQueries.instance;
    }
    /**
     * Provides access to the single global instance of this setting.
     *
     * This should be used in plugin code after the plugin has initialised local storage.
     */
    static getInstance() {
        if (!EnableJsInTasksQueries.instance) {
            throw new Error('EnableJsInTasksQueries has not been initialised.');
        }
        return EnableJsInTasksQueries.instance;
    }
    get() {
        return this.value;
    }
    set(value) {
        this.value = value;
        this.storage.save(exports.ENABLE_JS_IN_TASKS_QUERIES_KEY, value);
    }
    loadValue() {
        const storedValue = this.storage.load(exports.ENABLE_JS_IN_TASKS_QUERIES_KEY);
        if (typeof storedValue === 'boolean') {
            return storedValue;
        }
        return exports.DEFAULT_ENABLE_JS_IN_TASKS_QUERIES;
    }
}
exports.EnableJsInTasksQueries = EnableJsInTasksQueries;
//# sourceMappingURL=EnableJsInTasksQueries.js.map