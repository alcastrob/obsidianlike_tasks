"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskLayout = void 0;
const LayoutHelpers_1 = require("./LayoutHelpers");
const TaskLayoutOptions_1 = require("./TaskLayoutOptions");
/**
 * This class generates a list of hidden task components' classes.
 * The output depends on {@link TaskLayoutOptions} objects.
 */
class TaskLayout {
    constructor(taskLayoutOptions) {
        if (taskLayoutOptions) {
            this.taskLayoutOptions = taskLayoutOptions;
        }
        else {
            this.taskLayoutOptions = new TaskLayoutOptions_1.TaskLayoutOptions();
        }
    }
    generateHiddenClasses() {
        const hiddenClasses = [];
        this.taskLayoutOptions.toggleableComponents.forEach((component) => {
            (0, LayoutHelpers_1.generateHiddenClassForTaskList)(hiddenClasses, !this.taskLayoutOptions.isShown(component), component);
        });
        // Tags are hidden, rather than removed. See tasks-layout-hide-tags in styles.css.
        (0, LayoutHelpers_1.generateHiddenClassForTaskList)(hiddenClasses, !this.taskLayoutOptions.areTagsShown(), 'tags');
        return hiddenClasses;
    }
}
exports.TaskLayout = TaskLayout;
//# sourceMappingURL=TaskLayout.js.map