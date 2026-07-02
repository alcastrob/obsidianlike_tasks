"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsStore = void 0;
const store_1 = require("svelte/store");
const Settings_1 = require("../Config/Settings");
// This store is to be used by the UI only
exports.settingsStore = (0, store_1.writable)((0, Settings_1.getSettings)());
exports.settingsStore.subscribe((settings) => {
    (0, Settings_1.updateSettings)(settings);
});
//# sourceMappingURL=SettingsStore.js.map