"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksApiV1 = void 0;
const ToggleDone_1 = require("../Commands/ToggleDone");
const createTaskLineModal_1 = require("./createTaskLineModal");
const editTaskLineModal_1 = require("./editTaskLineModal");
/**
 * Factory method for API v1
 *
 * @param plugin - Tasks Plugin instance
 */
const tasksApiV1 = (plugin) => {
    const app = plugin.app;
    const onSaveSettings = async () => await plugin.saveSettings();
    return {
        createTaskLineModal: () => {
            return (0, createTaskLineModal_1.createTaskLineModal)(app, plugin.getTasks(), onSaveSettings);
        },
        editTaskLineModal: (taskLine) => {
            return (0, editTaskLineModal_1.editTaskLineModal)(app, taskLine, plugin.getTasks(), onSaveSettings);
        },
        executeToggleTaskDoneCommand: (line, path) => (0, ToggleDone_1.toggleLine)(line, path).text,
    };
};
exports.tasksApiV1 = tasksApiV1;
//# sourceMappingURL=index.js.map