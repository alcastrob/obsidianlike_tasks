"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusMenu = void 0;
const StatusInstructions_1 = require("../EditInstructions/StatusInstructions");
const TaskEditingMenu_1 = require("./TaskEditingMenu");
/**
 * A Menu of options for editing the status of a Task object.
 *
 * @example
 *     checkbox.addEventListener('contextmenu', (ev: MouseEvent) => {
 *         showMenu(ev, new StatusMenu(StatusRegistry.getInstance(), task));
 *     });
 *     checkbox.setAttribute('title', 'Right-click for options');
 */
class StatusMenu extends TaskEditingMenu_1.TaskEditingMenu {
    /**
     * Constructor, which sets up the menu items.
     * @param statusRegistry - the statuses to be shown in the menu.
     * @param task - the Task to be edited.
     * @param taskSaver - an optional {@link TaskSaver} function. For details, see {@link TaskEditingMenu}.
     */
    constructor(statusRegistry, task, taskSaver = TaskEditingMenu_1.defaultTaskSaver) {
        super(taskSaver);
        const instructions = (0, StatusInstructions_1.allStatusInstructions)(statusRegistry);
        this.addItemsForInstructions(instructions, task);
    }
}
exports.StatusMenu = StatusMenu;
//# sourceMappingURL=StatusMenu.js.map