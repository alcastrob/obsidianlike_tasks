"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptForDate = promptForDate;
const flatpickr_1 = __importDefault(require("flatpickr"));
const DateInstructions_1 = require("../EditInstructions/DateInstructions");
/**
 * A calendar date picker which edits a date value in a {@link Task} object.
 * @param parentElement
 * @param task
 * @param dateFieldToEdit
 * @param taskSaver
 */
function promptForDate(parentElement, task, dateFieldToEdit, taskSaver) {
    const currentValue = task[dateFieldToEdit];
    // TODO figure out how Today's date is determined: if Obsidian is left
    //      running overnight, the flatpickr modal shows the previous day as Today.
    const fp = (0, flatpickr_1.default)(parentElement, {
        defaultDate: currentValue ? currentValue.format('YYYY-MM-DD') : new Date(),
        disableMobile: true,
        enableTime: false, // Optional: Enable time picker
        dateFormat: 'Y-m-d', // Adjust the date and time format as needed
        locale: {
            // Try to determine the first day of the week based on the locale, or use Monday
            // if unavailable
            firstDayOfWeek: new Intl.Locale(navigator.language).weekInfo?.firstDay ?? 1,
        },
        onClose: async (selectedDates, _dateStr, instance) => {
            if (selectedDates.length > 0) {
                const date = selectedDates[0];
                const newTask = new DateInstructions_1.SetTaskDate(dateFieldToEdit, date).apply(task);
                await taskSaver(task, newTask);
            }
            instance.destroy();
        },
        onReady: (_selectedDates, _dateStr, instance) => {
            // Add custom buttons dynamically
            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('tasks-date-picker-buttons');
            // Create "Clear" button
            addButton(buttonContainer, instance, task, taskSaver, 'Clear', () => {
                return new DateInstructions_1.RemoveTaskDate(dateFieldToEdit, task).apply(task);
            });
            // Create "Today" button
            addButton(buttonContainer, instance, task, taskSaver, 'Today', () => {
                const today = new Date();
                return new DateInstructions_1.SetTaskDate(dateFieldToEdit, today).apply(task);
            });
            // Append the button container to the Flatpickr calendar container
            const calendarContainer = instance.calendarContainer;
            calendarContainer.appendChild(buttonContainer);
        },
    });
    // Open the calendar programmatically
    fp.open();
}
function addButton(buttonContainer, instance, task, taskSaver, buttonName, applyDate) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = buttonName;
    button.classList.add('flatpickr-button');
    button.addEventListener('click', async () => {
        const newTask = applyDate();
        await taskSaver(task, newTask);
        instance.destroy();
    });
    buttonContainer.appendChild(button);
}
//# sourceMappingURL=DatePicker.js.map