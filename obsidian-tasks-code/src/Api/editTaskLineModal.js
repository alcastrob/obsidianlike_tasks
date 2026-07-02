"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editTaskLineModal = editTaskLineModal;
const CreateOrEditTaskParser_1 = require("../Commands/CreateOrEditTaskParser");
const TaskModal_1 = require("../Obsidian/TaskModal");
/**
 * Opens the Tasks UI and returns the Markdown string for the task entered.
 * If the optional Markdown string for a task is passed, the form will be
 * populated with that task's properties.
 *
 * @param app - The Obsidian App
 * @param taskLine - Markdown string of the task to edit.
 * @param allTasks - An array of all tasks, used to populate the modal dependencies fields
 * @param onSaveSettings - function to save the plugin settings
 *
 * @returns {Promise<string>} A promise that contains the Markdown string for the task entered or
 * an empty string, if data entry was cancelled.
 */
function editTaskLineModal(app, taskLine, allTasks, onSaveSettings) {
    let resolvePromise;
    const waitForClose = new Promise((resolve, _) => {
        resolvePromise = resolve;
    });
    const onSubmit = (updatedTasks) => {
        const line = updatedTasks.map((task) => task.toFileLineString()).join('\n');
        resolvePromise(line);
    };
    const onCancel = () => {
        resolvePromise('');
    };
    const task = (0, CreateOrEditTaskParser_1.taskFromLine)({ line: taskLine ?? '', path: '' });
    const taskModal = new TaskModal_1.TaskModal({
        app,
        task,
        onSaveSettings,
        onSubmit,
        onCancel,
        allTasks,
    });
    taskModal.open();
    return waitForClose;
}
//# sourceMappingURL=editTaskLineModal.js.map