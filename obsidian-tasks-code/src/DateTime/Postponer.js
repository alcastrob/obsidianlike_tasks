"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldShowPostponeButton = shouldShowPostponeButton;
exports.getDateFieldToPostpone = getDateFieldToPostpone;
exports.createPostponedTask = createPostponedTask;
exports.createFixedDateTask = createFixedDateTask;
exports.createTaskWithDateRemoved = createTaskWithDateRemoved;
exports.postponementSuccessMessage = postponementSuccessMessage;
exports.postponeButtonTitle = postponeButtonTitle;
exports.postponeMenuItemTitle = postponeMenuItemTitle;
exports.fixedDateMenuItemTitle = fixedDateMenuItemTitle;
exports.removeDateMenuItemTitle = removeDateMenuItemTitle;
exports.removeDateMenuItemTitleForField = removeDateMenuItemTitleForField;
exports.splitDateText = splitDateText;
exports.postponeMenuItemTitleFromDate = postponeMenuItemTitleFromDate;
const StringHelpers_1 = require("../lib/StringHelpers");
const Task_1 = require("../Task/Task");
const DateFallback_1 = require("./DateFallback");
const TasksDate_1 = require("./TasksDate");
function shouldShowPostponeButton(task) {
    // don't postpone if any invalid dates
    for (const dateField of Task_1.Task.allDateFields()) {
        const taskElement = task[dateField];
        if (taskElement && !taskElement.isValid()) {
            return false;
        }
    }
    // require a valid happens date to postpone
    const hasAValidHappensDate = task.happensDates.some((date) => {
        return !!date?.isValid();
    });
    // only postpone not done tasks
    return !task.isDone && hasAValidHappensDate;
}
/**
 * Gets a {@link HappensDate} field from a {@link Task} with the following priority: due > scheduled > start.
 * If the task has no happens field {@link HappensDate}, null is returned.
 *
 * @param task
 */
function getDateFieldToPostpone(task) {
    if (task.dueDate) {
        return 'dueDate';
    }
    if (task.scheduledDate) {
        return 'scheduledDate';
    }
    if (task.startDate) {
        return 'startDate';
    }
    return null;
}
/**
 * Postpone a date value in a task a certain number of increments from the field's current date.
 * @param task
 * @param dateFieldToPostpone - The field whose value is to be postponed
 * @param timeUnit - the increment to postpone by (day, week, month....)
 * @param amount - the number of timeUnits to increment by.
 *
 * @see createFixedDateTask
 * @see createTaskWithDateRemoved
 */
function createPostponedTask(task, dateFieldToPostpone, timeUnit, amount) {
    const dateToPostpone = task[dateFieldToPostpone];
    return createPostponedTaskFromDate(dateToPostpone, task, dateFieldToPostpone, timeUnit, amount);
}
/**
 * Set a date value in a task a certain number of increments from today's date.
 * @param task
 * @param dateFieldToPostpone - The field whose value is to be postponed
 * @param timeUnit - the increment to postpone by (day, week, month....)
 * @param amount - the number of timeUnits to increment by.
 *
 * @see createPostponedTask
 * @see createTaskWithDateRemoved
 */
function createFixedDateTask(task, dateFieldToPostpone, timeUnit, amount) {
    const dateToPostpone = window.moment();
    return createPostponedTaskFromDate(dateToPostpone, task, dateFieldToPostpone, timeUnit, amount);
}
/**
 * Remove a date value from a task.
 * @param task
 * @param dateFieldToPostpone - The field whose value is to be removed
 * @param _timeUnit - unused
 * @param _amount - unused
 *
 * @see createPostponedTask
 * @see createFixedDateTask
 */
function createTaskWithDateRemoved(task, dateFieldToPostpone, _timeUnit, _amount) {
    return createTaskFromDate(task, dateFieldToPostpone, null);
}
function createPostponedTaskFromDate(dateToPostpone, task, dateFieldToPostpone, timeUnit, amount) {
    const postponedDate = new TasksDate_1.TasksDate(dateToPostpone).postpone(timeUnit, amount);
    return createTaskFromDate(task, dateFieldToPostpone, postponedDate);
}
function createTaskFromDate(task, dateFieldToPostpone, postponedDate) {
    const postponedTask = DateFallback_1.DateFallback.removeInferredStatusIfNeeded(task, [
        new Task_1.Task({
            ...task,
            [dateFieldToPostpone]: postponedDate,
        }),
    ])[0];
    return { postponedDate, postponedTask };
}
function postponementSuccessMessage(postponedDate, dateFieldToPostpone) {
    // TODO all logic for invalid dates
    if (postponedDate) {
        const postponedDateString = postponedDate?.format('DD MMM YYYY');
        return `Task's ${dateFieldToPostpone} changed to ${postponedDateString}`;
    }
    else {
        return `Task's ${dateFieldToPostpone} removed`;
    }
}
function postponeButtonTitle(task, amount, timeUnit) {
    const buttonText = postponeMenuItemTitle(task, amount, timeUnit);
    return `ℹ️ ${buttonText} (right-click for more options)`;
}
/**
 * Get the menu text to use when changing a task date relative to its current value.
 * @param task
 * @param amount - the number of timeUnits to increment by.
 * @param timeUnit - the increment to postpone by (day, week, month....)
 *
 * @see fixedDateMenuItemTitle
 */
function postponeMenuItemTitle(task, amount, timeUnit) {
    const updatedDateType = getDateFieldToPostpone(task);
    const dateToUpdate = task[updatedDateType];
    return postponeMenuItemTitleFromDate(updatedDateType, dateToUpdate, amount, timeUnit);
}
/**
 * Get the menu text to use when changing a task date relative to today's date.
 * @param task
 * @param amount - the number of timeUnits to increment by.
 * @param timeUnit - the increment to postpone by (day, week, month....)
 *
 * @see postponeMenuItemTitle
 */
function fixedDateMenuItemTitle(task, amount, timeUnit) {
    const updatedDateType = getDateFieldToPostpone(task);
    const dateToUpdate = window.moment().startOf('day');
    return postponeMenuItemTitleFromDate(updatedDateType, dateToUpdate, amount, timeUnit);
}
/**
 * Get the menu text to use when removing a date.
 * @param task
 * @param _amount - unused.
 * @param _timeUnit - unused
 *
 * @see postponeMenuItemTitle
 */
function removeDateMenuItemTitle(task, _amount, _timeUnit) {
    const updatedDateType = getDateFieldToPostpone(task);
    return removeDateMenuItemTitleForField(updatedDateType, task);
}
function removeDateMenuItemTitleForField(updatedDateType, task) {
    if (updatedDateType === 'scheduledDate' && task.scheduledDateIsInferred) {
        return 'Cannot remove inferred scheduled date';
    }
    else {
        return `Remove ${splitDateText(updatedDateType)}`;
    }
}
function prettyPrintDateFieldName(updatedDateType) {
    return (0, StringHelpers_1.capitalizeFirstLetter)(updatedDateType.replace('Date', ''));
}
function splitDateText(updatedDateType) {
    return updatedDateType.replace('Date', ' date');
}
function postponeMenuItemTitleFromDate(updatedDateType, dateToUpdate, amount, timeUnit) {
    const postponedDate = new TasksDate_1.TasksDate(dateToUpdate).postpone(timeUnit, amount);
    const formattedNewDate = postponedDate.format('ddd Do MMM');
    const amountOrArticle = amount != 1 ? Math.abs(amount) : 'a';
    if (dateToUpdate.isSameOrBefore(window.moment(), 'day')) {
        const updatedDateDisplayText = prettyPrintDateFieldName(updatedDateType);
        const title = amount >= 0
            ? `${updatedDateDisplayText} in ${amountOrArticle} ${timeUnit}, on ${formattedNewDate}`
            : `${updatedDateDisplayText} ${amountOrArticle} ${timeUnit} ago, on ${formattedNewDate}`;
        return title
            .replace(' 1 day ago', ' yesterday')
            .replace(' in 0 days', ' today')
            .replace('in a day', 'tomorrow');
    }
    const updatedDateDisplayText = splitDateText(updatedDateType);
    if (amount >= 0) {
        return `Postpone ${updatedDateDisplayText} by ${amountOrArticle} ${timeUnit}, to ${formattedNewDate}`;
    }
    else {
        return `Backdate ${updatedDateDisplayText} by ${amountOrArticle} ${timeUnit}, to ${formattedNewDate}`;
    }
}
//# sourceMappingURL=Postponer.js.map