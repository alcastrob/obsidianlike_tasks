"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskLineModal = void 0;
const editTaskLineModal_1 = require("./editTaskLineModal");
/**
 * Opens the Tasks UI and returns the Markdown string for the task entered.
 *
 * @param app - The Obsidian App
 * @param allTasks - All Tasks Plugin tasks in the vault
 * @param onSaveSettings - function to save the plugin settings
 * @returns {Promise<string>} A promise that contains the Markdown string for the task entered or
 * an empty string, if data entry was cancelled.
 */
const createTaskLineModal = (app, allTasks, onSaveSettings) => {
    return (0, editTaskLineModal_1.editTaskLineModal)(app, '', allTasks, onSaveSettings);
};
exports.createTaskLineModal = createTaskLineModal;
//# sourceMappingURL=createTaskLineModal.js.map