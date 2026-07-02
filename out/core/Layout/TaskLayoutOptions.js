"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskLayoutOptions = exports.taskLayoutComponents = exports.TaskLayoutComponent = void 0;
/**
 * {@link Task} fields used for rendering. Use references to this enum instead of plain string
 * values. The order here determines the order that task fields are rendered and written to
 * markdown.
 */
var TaskLayoutComponent;
(function (TaskLayoutComponent) {
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
}
exports.TaskLayoutOptions = TaskLayoutOptions;
//# sourceMappingURL=TaskLayoutOptions.js.map