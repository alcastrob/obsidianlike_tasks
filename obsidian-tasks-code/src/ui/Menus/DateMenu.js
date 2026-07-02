"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateMenu = void 0;
const DateFieldTypes_1 = require("../../DateTime/DateFieldTypes");
const DateInstructions_1 = require("../EditInstructions/DateInstructions");
const TaskEditingMenu_1 = require("./TaskEditingMenu");
class DateMenu extends TaskEditingMenu_1.TaskEditingMenu {
    /**
     * Constructor, which sets up the menu items.
     * @param field - the Date field to edit
     * @param task - the Task to be edited.
     * @param taskSaver - an optional {@link TaskSaver} function. For details, see {@link TaskEditingMenu}.
     */
    constructor(field, task, taskSaver = TaskEditingMenu_1.defaultTaskSaver) {
        super(taskSaver);
        const instructions = (0, DateFieldTypes_1.isAHappensDate)(field)
            ? (0, DateInstructions_1.allHappensDateInstructions)(field, task)
            : (0, DateInstructions_1.allLifeCycleDateInstructions)(field, task);
        this.addItemsForInstructions(instructions, task);
    }
}
exports.DateMenu = DateMenu;
//# sourceMappingURL=DateMenu.js.map