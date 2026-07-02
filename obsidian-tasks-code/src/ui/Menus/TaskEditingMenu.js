"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskEditingMenu = void 0;
exports.defaultTaskSaver = defaultTaskSaver;
exports.showMenu = showMenu;
const obsidian_1 = require("obsidian");
const File_1 = require("../../Obsidian/File");
const MenuDividerInstruction_1 = require("../EditInstructions/MenuDividerInstruction");
/**
 * A default implementation of {@link TaskSaver} that calls {@link replaceTaskWithTasks}
 * @param originalTask
 * @param newTasks
 */
async function defaultTaskSaver(originalTask, newTasks) {
    await (0, File_1.replaceTaskWithTasks)({
        originalTask,
        newTasks,
    });
}
/**
 * A helper function to ensure that menus behave correctly, not overlapping or being overlapped by other menus.
 * @param ev
 * @param menu
 */
function showMenu(ev, menu) {
    ev.preventDefault(); // suppress the default click behavior
    ev.stopPropagation(); // suppress further event propagation
    menu.showAtPosition({ x: ev.clientX, y: ev.clientY });
}
/**
 * Base class for Menus that offer editing one or more properties of a Task object.
 *
 * Once created, menus should be passed to {@link showMenu}.
 *
 * A {@link TaskSaver} function must be supplied, in order for any edits to be saved.
 * Derived classes should default to using {@link defaultTaskSaver}, but allow
 * alternative implementations to be used in tests.
 */
class TaskEditingMenu extends obsidian_1.Menu {
    /**
     * Constructor, which sets up the menu items.
     * @param taskSaver - a {@link TaskSaver} function, for saving any edits.
     */
    constructor(taskSaver) {
        super();
        this.taskSaver = taskSaver;
    }
    addItemsForInstructions(instructions, task) {
        for (const instruction of instructions) {
            this.addItemForInstruction(task, instruction);
        }
    }
    addItemForInstruction(task, instruction) {
        if (instruction.instructionDisplayName() === MenuDividerInstruction_1.SEPARATOR_INSTRUCTION_DISPLAY_NAME) {
            this.addSeparator();
        }
        else {
            this.addItem((item) => this.getMenuItemCallback(task, item, instruction));
        }
    }
    getMenuItemCallback(task, item, instruction) {
        item.setTitle(instruction.instructionDisplayName())
            .setChecked(instruction.isCheckedForTask(task))
            .onClick(async () => {
            const newTask = instruction.apply(task);
            const hasEdits = newTask.length !== 1 || !Object.is(newTask[0], task);
            if (hasEdits) {
                await this.taskSaver(task, newTask);
            }
        });
    }
}
exports.TaskEditingMenu = TaskEditingMenu;
//# sourceMappingURL=TaskEditingMenu.js.map