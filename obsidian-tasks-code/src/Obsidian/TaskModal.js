"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModal = void 0;
const obsidian_1 = require("obsidian");
const obsidian_2 = require("obsidian");
const EditTask_svelte_1 = __importDefault(require("../ui/EditTask.svelte"));
const StatusRegistry_1 = require("../Statuses/StatusRegistry");
const Status_1 = require("../Statuses/Status");
const OptionsModal_1 = require("./OptionsModal");
class TaskModal extends obsidian_2.Modal {
    constructor({ app, task, onSaveSettings, onSubmit, onCancel, allTasks }) {
        super(app);
        this.task = task;
        this.allTasks = allTasks;
        this.onSaveSettings = onSaveSettings;
        this.onSubmit = (updatedTasks) => {
            if (updatedTasks.length > 0) {
                onSubmit(updatedTasks);
            }
            else if (onCancel) {
                onCancel();
            }
            this.close();
        };
    }
    onOpen() {
        this.titleEl.setText('Create or edit Task');
        this.modalEl.addClass('tasks-edit-modal-container');
        const optionsButton = document.createElement('button');
        // Add same classes as the default Obsidian modal close button.
        optionsButton.addClasses(['modal-close-button', 'mod-raised', 'clickable-icon']);
        // But overload the 'inset-inline-end' property for a correct position.
        optionsButton.addClass('modal-option-button');
        (0, obsidian_1.setIcon)(optionsButton, 'settings');
        optionsButton.onclick = () => {
            const optionsModal = new OptionsModal_1.OptionsModal({
                app: this.app,
                onSave: () => this.onSaveSettings(),
            });
            optionsModal.open();
        };
        this.modalEl.appendChild(optionsButton);
        const { contentEl } = this;
        const statusOptions = this.getKnownStatusesAndCurrentTaskStatusIfNotKnown();
        new EditTask_svelte_1.default({
            target: contentEl,
            props: {
                task: this.task,
                statusOptions: statusOptions,
                onSubmit: this.onSubmit,
                allTasks: this.allTasks,
            },
        });
    }
    /**
     * If the task being edited has an unknown status, make sure it is added
     * to the dropdown list.
     * This allows the user to switch to a different status and then change their
     * mind and return to the initial status.
     */
    getKnownStatusesAndCurrentTaskStatusIfNotKnown() {
        const statusOptions = StatusRegistry_1.StatusRegistry.getInstance().registeredStatuses;
        if (StatusRegistry_1.StatusRegistry.getInstance().bySymbol(this.task.status.symbol) === Status_1.Status.EMPTY) {
            statusOptions.push(this.task.status);
        }
        return statusOptions;
    }
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
exports.TaskModal = TaskModal;
//# sourceMappingURL=TaskModal.js.map