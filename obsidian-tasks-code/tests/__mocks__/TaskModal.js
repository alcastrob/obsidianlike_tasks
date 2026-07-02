"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModal = void 0;
/**
 * {@link TaskModal} needs to be mocked, because it depends on {@link obsidian.Modal}, which is not available.
 */
class TaskModal {
    constructor({ app, task, onSubmit, onCancel, allTasks, }) {
        this.app = app;
        this.task = task;
        this.onSubmit = (updatedTasks) => {
            if (updatedTasks.length > 0) {
                onSubmit(updatedTasks);
            }
            else if (onCancel) {
                onCancel();
            }
        };
        this.open = jest.fn();
        this.allTasks = allTasks || [];
        TaskModal.instance = this;
    }
    cancel() {
        this.onSubmit([]);
    }
}
exports.TaskModal = TaskModal;
//# sourceMappingURL=TaskModal.js.map