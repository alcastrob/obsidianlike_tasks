"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveTaskDate = exports.SetRelativeTaskDate = exports.SetTaskDate = void 0;
exports.allHappensDateInstructions = allHappensDateInstructions;
exports.allLifeCycleDateInstructions = allLifeCycleDateInstructions;
const Task_1 = require("../../Task/Task");
const Postponer_1 = require("../../DateTime/Postponer");
const TasksDate_1 = require("../../DateTime/TasksDate");
const MenuDividerInstruction_1 = require("./MenuDividerInstruction");
/**
 * An instruction to set a date field to an absolute date.
 *
 * See also {@link SetRelativeTaskDate} and {@link RemoveTaskDate}.
 */
class SetTaskDate {
    constructor(dateFieldToEdit, date, displayName) {
        this.newDate = date;
        this.dateFieldToEdit = dateFieldToEdit;
        this.displayName = displayName ?? `Set Date: ${this.newDate.toDateString()}`;
    }
    apply(task) {
        if (this.isCheckedForTask(task)) {
            return [task];
        }
        else {
            return [
                new Task_1.Task({
                    ...task,
                    [this.dateFieldToEdit]: window.moment(this.newDate),
                }),
            ];
        }
    }
    instructionDisplayName() {
        return this.displayName;
    }
    isCheckedForTask(task) {
        return task[this.dateFieldToEdit]?.isSame(window.moment(this.newDate)) || false;
    }
}
exports.SetTaskDate = SetTaskDate;
/**
 * An instruction to set a date field to a date relative to the current value, or
 * relative to today, if there is no current value.
 *
 * See also {@link SetTaskDate} and {@link RemoveTaskDate}.
 */
class SetRelativeTaskDate extends SetTaskDate {
    constructor(dateFieldToEdit, taskDueToday, amount, timeUnit) {
        const currentDate = taskDueToday[dateFieldToEdit] ?? window.moment();
        const title = (0, Postponer_1.postponeMenuItemTitleFromDate)(dateFieldToEdit, currentDate, amount, timeUnit);
        const newDate = new TasksDate_1.TasksDate(window.moment(currentDate)).postpone(timeUnit, amount).toDate();
        super(dateFieldToEdit, newDate, title);
    }
}
exports.SetRelativeTaskDate = SetRelativeTaskDate;
/**
 * An instruction to remove any value from a date field, if there is a current value.
 *
 * See also {@link SetTaskDate} and {@link SetRelativeTaskDate}.
 */
class RemoveTaskDate {
    constructor(dateFieldToEdit, task) {
        this.dateFieldToEdit = dateFieldToEdit;
        this.displayName = (0, Postponer_1.removeDateMenuItemTitleForField)(dateFieldToEdit, task);
    }
    apply(task) {
        // There's no point trying to remove an inferred scheduled date, as the next time
        // Tasks starts up, it will infer the scheduled date again from the file name,
        // which will be very confusing for users.
        const fieldIsInferred = this.dateFieldToEdit === 'scheduledDate' && task.scheduledDateIsInferred;
        const fieldIsAlreadyNull = task[this.dateFieldToEdit] === null;
        if (fieldIsAlreadyNull || fieldIsInferred) {
            return [task];
        }
        return [
            new Task_1.Task({
                ...task,
                [this.dateFieldToEdit]: null,
            }),
        ];
    }
    instructionDisplayName() {
        return this.displayName;
    }
    isCheckedForTask(_task) {
        return false;
    }
}
exports.RemoveTaskDate = RemoveTaskDate;
/**
 * For Starts, Scheduled, Due.
 * @param field
 * @param task
 * @see allLifeCycleDateInstructions
 */
function allHappensDateInstructions(field, task) {
    return allDateInstructions(task, field, 1);
}
/**
 * For Done, Cancelled, Created.
 * @param field
 * @param task
 * @see allHappensDateInstructions
 */
function allLifeCycleDateInstructions(field, task) {
    return allDateInstructions(task, field, -1);
}
/**
 * Add instructions to move a date either forwards or backwards
 * @param task
 * @param field
 * @param factor - +1 means today or future dates; -1 = today or earlier dates.
 */
function allDateInstructions(task, field, factor) {
    const today = window.moment().startOf('day');
    const todayAsDate = today.toDate();
    const todayAsTasksDate = new TasksDate_1.TasksDate(today.clone());
    return [
        new SetTaskDate(field, todayAsDate, (0, Postponer_1.postponeMenuItemTitleFromDate)(field, today, 0, 'days')),
        // TODO Fix this confusing mixture of Date, Moment and TasksDate!!!
        //      Preferably convert everything to use TasksDate.
        new SetTaskDate(field, todayAsTasksDate.postpone('day', factor).toDate(), (0, Postponer_1.postponeMenuItemTitleFromDate)(field, today, factor, 'day')),
        new MenuDividerInstruction_1.MenuDividerInstruction(),
        new SetRelativeTaskDate(field, task, factor * 2, 'days'),
        new SetRelativeTaskDate(field, task, factor * 3, 'days'),
        new SetRelativeTaskDate(field, task, factor * 4, 'days'),
        new SetRelativeTaskDate(field, task, factor * 5, 'days'),
        new SetRelativeTaskDate(field, task, factor * 6, 'days'),
        new MenuDividerInstruction_1.MenuDividerInstruction(),
        new SetRelativeTaskDate(field, task, factor, 'week'),
        new SetRelativeTaskDate(field, task, factor * 2, 'weeks'),
        new SetRelativeTaskDate(field, task, factor * 3, 'weeks'),
        new SetRelativeTaskDate(field, task, factor, 'month'),
        new MenuDividerInstruction_1.MenuDividerInstruction(),
        new RemoveTaskDate(field, task),
    ];
}
//# sourceMappingURL=DateInstructions.js.map