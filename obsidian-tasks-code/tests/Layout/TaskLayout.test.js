"use strict";
/**
 * @jest-environment jsdom
 */
Object.defineProperty(exports, "__esModule", { value: true });
const QueryLayout_1 = require("../../src/Layout/QueryLayout");
const TaskLayoutOptions_1 = require("../../src/Layout/TaskLayoutOptions");
const QueryLayoutOptions_1 = require("../../src/Layout/QueryLayoutOptions");
const TaskLayout_1 = require("../../src/Layout/TaskLayout");
describe('TaskLayout tests', () => {
    it('should generate expected CSS classes for default layout', () => {
        const taskLayout = new TaskLayout_1.TaskLayout();
        const queryLayout = new QueryLayout_1.QueryLayout();
        const hiddenClasses = [...taskLayout.generateHiddenClasses(), ...queryLayout.getHiddenClasses()];
        expect(hiddenClasses.join('\n')).toMatchInlineSnapshot('"tasks-layout-hide-urgency"');
    });
    it('should generate expected CSS classes with all default options reversed', () => {
        const taskLayoutOptions = new TaskLayoutOptions_1.TaskLayoutOptions();
        taskLayoutOptions.toggleVisibilityExceptDescriptionAndBlockLink();
        const queryLayoutOptions = new QueryLayoutOptions_1.QueryLayoutOptions();
        // Negate all the query layout boolean values:
        Object.keys(queryLayoutOptions).forEach((key) => {
            const key2 = key;
            queryLayoutOptions[key2] = !queryLayoutOptions[key2];
        });
        const taskLayout = new TaskLayout_1.TaskLayout(taskLayoutOptions);
        const queryLayout = new QueryLayout_1.QueryLayout(queryLayoutOptions);
        const hiddenClasses = [...taskLayout.generateHiddenClasses(), ...queryLayout.getHiddenClasses()];
        expect(hiddenClasses.join('\n')).toMatchInlineSnapshot(`
            "tasks-layout-hide-id
            tasks-layout-hide-dependsOn
            tasks-layout-hide-priority
            tasks-layout-hide-recurrenceRule
            tasks-layout-hide-onCompletion
            tasks-layout-hide-createdDate
            tasks-layout-hide-startDate
            tasks-layout-hide-scheduledDate
            tasks-layout-hide-dueDate
            tasks-layout-hide-cancelledDate
            tasks-layout-hide-doneDate
            tasks-layout-hide-tags
            tasks-layout-hide-backlinks
            tasks-layout-hide-edit-button
            tasks-layout-hide-postpone-button
            tasks-layout-short-mode"
        `);
    });
});
//# sourceMappingURL=TaskLayout.test.js.map