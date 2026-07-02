"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrEdit = void 0;
const obsidian_1 = require("obsidian");
const TaskModal_1 = require("../Obsidian/TaskModal");
const DateFallback_1 = require("../DateTime/DateFallback");
const CreateOrEditTaskParser_1 = require("./CreateOrEditTaskParser");
const createOrEdit = (checking, editor, view, app, allTasks, onSaveSettings) => {
    if (checking) {
        return view instanceof obsidian_1.MarkdownView;
    }
    if (!(view instanceof obsidian_1.MarkdownView)) {
        // Should never happen due to check above.
        return;
    }
    const path = view.file?.path;
    if (path === undefined) {
        return;
    }
    const cursorPosition = editor.getCursor();
    const lineNumber = cursorPosition.line;
    const line = editor.getLine(lineNumber);
    const task = (0, CreateOrEditTaskParser_1.taskFromLine)({ line, path });
    const onSubmit = (updatedTasks) => {
        const serialized = DateFallback_1.DateFallback.removeInferredStatusIfNeeded(task, updatedTasks)
            .map((task) => task.toFileLineString())
            .join('\n');
        editor.setLine(lineNumber, serialized);
    };
    // Need to create a new instance every time, as cursor/task can change.
    const taskModal = new TaskModal_1.TaskModal({
        app,
        task,
        onSaveSettings,
        onSubmit,
        allTasks,
    });
    taskModal.open();
};
exports.createOrEdit = createOrEdit;
//# sourceMappingURL=CreateOrEdit.js.map