"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EnableJsInTasksQueries_1 = require("../../src/Config/EnableJsInTasksQueries");
const InMemoryLocalStorageProvider_1 = require("../../src/Config/InMemoryLocalStorageProvider");
describe('EnableJsInTasksQueries', () => {
    it('should default to false', () => {
        const storage = new InMemoryLocalStorageProvider_1.InMemoryLocalStorageProvider();
        const setting = new EnableJsInTasksQueries_1.EnableJsInTasksQueries(storage);
        expect(setting.get()).toBe(EnableJsInTasksQueries_1.DEFAULT_ENABLE_JS_IN_TASKS_QUERIES);
        expect(setting.get()).toBe(false);
    });
    it('should load the initial value from local storage', () => {
        const storage = new InMemoryLocalStorageProvider_1.InMemoryLocalStorageProvider();
        storage.save(EnableJsInTasksQueries_1.ENABLE_JS_IN_TASKS_QUERIES_KEY, true);
        const setting = new EnableJsInTasksQueries_1.EnableJsInTasksQueries(storage);
        expect(setting.get()).toBe(true);
    });
    it('should save the updated value to local storage', () => {
        const storage = new InMemoryLocalStorageProvider_1.InMemoryLocalStorageProvider();
        const setting = new EnableJsInTasksQueries_1.EnableJsInTasksQueries(storage);
        setting.set(true);
        expect(setting.get()).toBe(true);
        expect(storage.load(EnableJsInTasksQueries_1.ENABLE_JS_IN_TASKS_QUERIES_KEY)).toBe(true);
    });
    it('should save false after previously saving true', () => {
        const storage = new InMemoryLocalStorageProvider_1.InMemoryLocalStorageProvider();
        const setting = new EnableJsInTasksQueries_1.EnableJsInTasksQueries(storage);
        setting.set(true);
        setting.set(false);
        expect(setting.get()).toBe(false);
        expect(storage.load(EnableJsInTasksQueries_1.ENABLE_JS_IN_TASKS_QUERIES_KEY)).toBe(false);
    });
    it('should default to false if local storage contains a non-boolean value', () => {
        const storage = new InMemoryLocalStorageProvider_1.InMemoryLocalStorageProvider();
        storage.save(EnableJsInTasksQueries_1.ENABLE_JS_IN_TASKS_QUERIES_KEY, 'true');
        const setting = new EnableJsInTasksQueries_1.EnableJsInTasksQueries(storage);
        expect(setting.get()).toBe(false);
    });
    it('should keep the value in memory after construction', () => {
        const storage = new InMemoryLocalStorageProvider_1.InMemoryLocalStorageProvider();
        storage.save(EnableJsInTasksQueries_1.ENABLE_JS_IN_TASKS_QUERIES_KEY, true);
        const setting = new EnableJsInTasksQueries_1.EnableJsInTasksQueries(storage);
        storage.save(EnableJsInTasksQueries_1.ENABLE_JS_IN_TASKS_QUERIES_KEY, false);
        expect(setting.get()).toBe(true);
    });
    it('should provide access to the initialised global instance', () => {
        const storage = new InMemoryLocalStorageProvider_1.InMemoryLocalStorageProvider();
        storage.save(EnableJsInTasksQueries_1.ENABLE_JS_IN_TASKS_QUERIES_KEY, true);
        const setting = EnableJsInTasksQueries_1.EnableJsInTasksQueries.initialise(storage);
        expect(EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance()).toBe(setting);
        expect(EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().get()).toBe(true);
    });
    it('should replace the global instance when initialised again', () => {
        const firstStorage = new InMemoryLocalStorageProvider_1.InMemoryLocalStorageProvider();
        const secondStorage = new InMemoryLocalStorageProvider_1.InMemoryLocalStorageProvider();
        firstStorage.save(EnableJsInTasksQueries_1.ENABLE_JS_IN_TASKS_QUERIES_KEY, true);
        secondStorage.save(EnableJsInTasksQueries_1.ENABLE_JS_IN_TASKS_QUERIES_KEY, false);
        EnableJsInTasksQueries_1.EnableJsInTasksQueries.initialise(firstStorage);
        EnableJsInTasksQueries_1.EnableJsInTasksQueries.initialise(secondStorage);
        expect(EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().get()).toBe(false);
    });
});
//# sourceMappingURL=EnableJsInTasksQueries.test.js.map