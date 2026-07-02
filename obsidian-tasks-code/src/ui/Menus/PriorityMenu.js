"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityMenu = void 0;
const PriorityInstructions_1 = require("../EditInstructions/PriorityInstructions");
const TaskEditingMenu_1 = require("./TaskEditingMenu");
/**
 * A Menu of options for editing the status of a Task object.
 *
 * @example
 *     editTaskPencil.addEventListener('contextmenu', (ev: MouseEvent) => {
 *         showMenu(ev, new PriorityMenu(task));
 *     });
 *     editTaskPencil.setAttribute('title', 'Right-click for options');
 */
class PriorityMenu extends TaskEditingMenu_1.TaskEditingMenu {
    /**
     * Constructor, which sets up the menu items.
     * @param task - the Task to be edited.
     * @param taskSaver - an optional {@link TaskSaver} function. For details, see {@link TaskEditingMenu}.
     */
    constructor(task, taskSaver = TaskEditingMenu_1.defaultTaskSaver) {
        super(taskSaver);
        this.addItemsForInstructions((0, PriorityInstructions_1.allPriorityInstructions)(), task);
    }
}
exports.PriorityMenu = PriorityMenu;
//# sourceMappingURL=PriorityMenu.js.map