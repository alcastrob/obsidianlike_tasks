"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryLayout = void 0;
const LayoutHelpers_1 = require("./LayoutHelpers");
const QueryLayoutOptions_1 = require("./QueryLayoutOptions");
/**
 * This class generates a list of hidden query components' classes.
 * The output depends on {@link QueryLayoutOptions} objects.
 */
class QueryLayout {
    constructor(queryLayoutOptions) {
        if (queryLayoutOptions) {
            this.queryLayoutOptions = queryLayoutOptions;
        }
        else {
            this.queryLayoutOptions = new QueryLayoutOptions_1.QueryLayoutOptions();
        }
    }
    getHiddenClasses() {
        const hiddenClasses = [];
        const componentsToGenerateClassesOnly = [
            // The following components are handled in QueryRenderer.ts and thus are not part of the same flow that
            // hides TaskLayoutComponent items. However, we still want to have 'tasks-layout-hide' items for them
            // (see https://github.com/obsidian-tasks-group/obsidian-tasks/issues/1866).
            // This can benefit from some refactoring, i.e. render these components in a similar flow rather than
            // separately.
            [this.queryLayoutOptions.hideUrgency, 'urgency'],
            [this.queryLayoutOptions.hideBacklinks, 'backlinks'],
            [this.queryLayoutOptions.hideEditButton, 'edit-button'],
            [this.queryLayoutOptions.hidePostponeButton, 'postpone-button'],
        ];
        for (const [hide, component] of componentsToGenerateClassesOnly) {
            (0, LayoutHelpers_1.generateHiddenClassForTaskList)(hiddenClasses, hide, component);
        }
        if (this.queryLayoutOptions.shortMode)
            hiddenClasses.push('tasks-layout-short-mode');
        return hiddenClasses;
    }
}
exports.QueryLayout = QueryLayout;
//# sourceMappingURL=QueryLayout.js.map