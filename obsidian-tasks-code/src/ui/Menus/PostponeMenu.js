"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostponeMenu = void 0;
const obsidian_1 = require("obsidian");
const Postponer_1 = require("../../DateTime/Postponer");
const TaskEditingMenu_1 = require("./TaskEditingMenu");
class PostponeMenu extends TaskEditingMenu_1.TaskEditingMenu {
    constructor(button, task, taskSaver = TaskEditingMenu_1.defaultTaskSaver) {
        super(taskSaver);
        const postponeMenuItemCallback = (button, item, timeUnit, amount, itemNamingFunction, postponingFunction) => {
            // TODO some of the code below is duplicated in postponeOnClickCallback() and may be refactored
            let isCurrentValue = false;
            const dateFieldToPostpone = (0, Postponer_1.getDateFieldToPostpone)(task);
            if (dateFieldToPostpone) {
                const { postponedDate } = postponingFunction(task, dateFieldToPostpone, timeUnit, amount);
                if (task[dateFieldToPostpone]?.isSame(postponedDate, 'day')) {
                    isCurrentValue = true;
                }
            }
            const title = itemNamingFunction(task, amount, timeUnit);
            item.setChecked(isCurrentValue)
                .setTitle(title)
                .onClick(() => PostponeMenu.postponeOnClickCallback(button, task, amount, timeUnit, postponingFunction, taskSaver));
        };
        const fixedTitle = Postponer_1.fixedDateMenuItemTitle;
        const fixedDateFunction = Postponer_1.createFixedDateTask;
        this.addItem((item) => postponeMenuItemCallback(button, item, 'days', 0, fixedTitle, fixedDateFunction));
        this.addItem((item) => postponeMenuItemCallback(button, item, 'day', 1, fixedTitle, fixedDateFunction));
        this.addSeparator();
        const titlingFunction = Postponer_1.postponeMenuItemTitle;
        const postponingFunction = Postponer_1.createPostponedTask;
        if (titlingFunction(task, 1, 'day') !== fixedTitle(task, 1, 'day')) {
            this.addItem((item) => postponeMenuItemCallback(button, item, 'day', 1, titlingFunction, postponingFunction));
        }
        this.addItem((item) => postponeMenuItemCallback(button, item, 'days', 2, titlingFunction, postponingFunction));
        this.addItem((item) => postponeMenuItemCallback(button, item, 'days', 3, titlingFunction, postponingFunction));
        this.addItem((item) => postponeMenuItemCallback(button, item, 'days', 4, titlingFunction, postponingFunction));
        this.addItem((item) => postponeMenuItemCallback(button, item, 'days', 5, titlingFunction, postponingFunction));
        this.addItem((item) => postponeMenuItemCallback(button, item, 'days', 6, titlingFunction, postponingFunction));
        this.addSeparator();
        this.addItem((item) => postponeMenuItemCallback(button, item, 'week', 1, titlingFunction, postponingFunction));
        this.addItem((item) => postponeMenuItemCallback(button, item, 'weeks', 2, titlingFunction, postponingFunction));
        this.addItem((item) => postponeMenuItemCallback(button, item, 'weeks', 3, titlingFunction, postponingFunction));
        this.addItem((item) => postponeMenuItemCallback(button, item, 'month', 1, titlingFunction, postponingFunction));
        this.addSeparator();
        this.addItem((item) => postponeMenuItemCallback(button, item, 'days', 2, Postponer_1.removeDateMenuItemTitle, Postponer_1.createTaskWithDateRemoved));
    }
    static async postponeOnClickCallback(button, task, amount, timeUnit, postponingFunction = Postponer_1.createPostponedTask, taskSaver = TaskEditingMenu_1.defaultTaskSaver) {
        const dateFieldToPostpone = (0, Postponer_1.getDateFieldToPostpone)(task);
        if (dateFieldToPostpone === null) {
            const errorMessage = '⚠️ Postponement requires a date: due, scheduled or start.';
            return new obsidian_1.Notice(errorMessage, 10000);
        }
        const { postponedDate, postponedTask } = postponingFunction(task, dateFieldToPostpone, timeUnit, amount);
        if (task[dateFieldToPostpone]?.isSame(postponedDate, 'day')) {
            return;
        }
        await taskSaver(task, postponedTask);
        PostponeMenu.postponeSuccessCallback(button, dateFieldToPostpone, postponedDate);
    }
    static postponeSuccessCallback(button, updatedDateType, postponedDate) {
        // Disable the button to prevent update error due to the task not being reloaded yet.
        // (we cannot use Obsidian's addClass method because it is not available when this code is run in tests.)
        button.classList.add('tasks-no-pointer-events');
        const successMessage = (0, Postponer_1.postponementSuccessMessage)(postponedDate, updatedDateType);
        new obsidian_1.Notice(successMessage, 2000);
    }
}
exports.PostponeMenu = PostponeMenu;
//# sourceMappingURL=PostponeMenu.js.map