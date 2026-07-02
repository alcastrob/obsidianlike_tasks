"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskLayoutOptions = exports.taskLayoutComponents = exports.TaskLayoutComponent = void 0;
exports.parseTaskShowHideOptions = parseTaskShowHideOptions;
/**
 * {@link Task} fields used for rendering. Use references to this enum ({@link TaskLayoutComponent.Id})
 * instead of plain string values (`id`).
 *
 * The order here determines the order that task fields are rendered and written to markdown.
 */
var TaskLayoutComponent;
(function (TaskLayoutComponent) {
    // NEW_TASK_FIELD_EDIT_REQUIRED
    TaskLayoutComponent["Description"] = "description";
    TaskLayoutComponent["Id"] = "id";
    TaskLayoutComponent["DependsOn"] = "dependsOn";
    TaskLayoutComponent["Priority"] = "priority";
    TaskLayoutComponent["RecurrenceRule"] = "recurrenceRule";
    TaskLayoutComponent["OnCompletion"] = "onCompletion";
    TaskLayoutComponent["CreatedDate"] = "createdDate";
    TaskLayoutComponent["StartDate"] = "startDate";
    TaskLayoutComponent["ScheduledDate"] = "scheduledDate";
    TaskLayoutComponent["DueDate"] = "dueDate";
    TaskLayoutComponent["CancelledDate"] = "cancelledDate";
    TaskLayoutComponent["DoneDate"] = "doneDate";
    TaskLayoutComponent["BlockLink"] = "blockLink";
})(TaskLayoutComponent || (exports.TaskLayoutComponent = TaskLayoutComponent = {}));
exports.taskLayoutComponents = Object.values(TaskLayoutComponent);
/**
 * Various rendering options of tasks in a query.
 *
 * See {@link TaskLayoutComponent} for the available options.
 *
 * Note that there is an additional special case, for whether tags are shown.
 *
 * @see QueryLayoutOptions
 */
class TaskLayoutOptions {
    constructor() {
        this.visible = {};
        this.tagsVisible = true;
        exports.taskLayoutComponents.forEach((component) => {
            this.visible[component] = true;
        });
    }
    isShown(component) {
        return this.visible[component];
    }
    areTagsShown() {
        return this.tagsVisible;
    }
    hide(component) {
        this.visible[component] = false;
    }
    setVisibility(component, visible) {
        this.visible[component] = visible;
    }
    setTagsVisibility(visibility) {
        this.tagsVisible = visibility;
    }
    get shownComponents() {
        return exports.taskLayoutComponents.filter((component) => {
            return this.visible[component];
        });
    }
    get hiddenComponents() {
        return exports.taskLayoutComponents.filter((component) => {
            return !this.visible[component];
        });
    }
    /**
     * These represent the existing task options, so some components (description & block link for now) are not
     * here because there are no layout options to remove them.
     */
    get toggleableComponents() {
        return exports.taskLayoutComponents.filter((component) => {
            // Description and blockLink are always shown
            return component !== TaskLayoutComponent.Description && component !== TaskLayoutComponent.BlockLink;
        });
    }
    toggleVisibilityExceptDescriptionAndBlockLink() {
        this.toggleableComponents.forEach((component) => {
            this.visible[component] = !this.visible[component];
        });
        this.setTagsVisibility(!this.areTagsShown());
    }
}
exports.TaskLayoutOptions = TaskLayoutOptions;
/**
 * Parse show/hide options for Task layout options
 * @param taskLayoutOptions
 * @param option - must already have been lower-cased
 * @param visible - whether the option should be shown
 * @return True if the option was recognised, and false otherwise
 * @see parseQueryShowHideOptions
 */
function parseTaskShowHideOptions(taskLayoutOptions, option, visible) {
    const optionMap = new Map([
        // NEW_TASK_FIELD_EDIT_REQUIRED
        // Alphabetical order
        ['cancelled date', TaskLayoutComponent.CancelledDate],
        ['created date', TaskLayoutComponent.CreatedDate],
        ['depends on', TaskLayoutComponent.DependsOn],
        ['done date', TaskLayoutComponent.DoneDate],
        ['due date', TaskLayoutComponent.DueDate],
        ['id', TaskLayoutComponent.Id],
        ['on completion', TaskLayoutComponent.OnCompletion],
        ['priority', TaskLayoutComponent.Priority],
        ['recurrence rule', TaskLayoutComponent.RecurrenceRule],
        ['scheduled date', TaskLayoutComponent.ScheduledDate],
        ['start date', TaskLayoutComponent.StartDate],
    ]);
    for (const [key, component] of optionMap.entries()) {
        if (option.startsWith(key)) {
            taskLayoutOptions.setVisibility(component, visible);
            return true;
        }
    }
    if (option.startsWith('tags')) {
        taskLayoutOptions.setTagsVisibility(visible);
        return true;
    }
    return false;
}
//# sourceMappingURL=TaskLayoutOptions.js.map