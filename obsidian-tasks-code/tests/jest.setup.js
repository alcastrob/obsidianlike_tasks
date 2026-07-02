"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EnableJsInTasksQueries_1 = require("../src/Config/EnableJsInTasksQueries");
const InMemoryLocalStorageProvider_1 = require("../src/Config/InMemoryLocalStorageProvider");
const i18n_1 = require("../src/i18n/i18n");
// Tests should default to allowing JavaScript in Tasks queries.
// Production code initialises this singleton separately in main.ts, using Obsidian local storage.
EnableJsInTasksQueries_1.EnableJsInTasksQueries.initialise(new InMemoryLocalStorageProvider_1.InMemoryLocalStorageProvider());
EnableJsInTasksQueries_1.EnableJsInTasksQueries.getInstance().set(true);
beforeAll(async () => {
    await (0, i18n_1.initializeI18n)();
});
//# sourceMappingURL=jest.setup.js.map