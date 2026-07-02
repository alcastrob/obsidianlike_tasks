"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskLayoutOptions_1 = require("../../src/Layout/TaskLayoutOptions");
describe('TaskLayoutOptions', () => {
    it('should be constructable', () => {
        const options = new TaskLayoutOptions_1.TaskLayoutOptions();
        expect(options).not.toBeNull();
        expect(options.shownComponents.join('\n')).toMatchInlineSnapshot(`
            "description
            id
            dependsOn
            priority
            recurrenceRule
            onCompletion
            createdDate
            startDate
            scheduledDate
            dueDate
            cancelledDate
            doneDate
            blockLink"
        `);
        expect(options.areTagsShown()).toEqual(true);
    });
    it('should show fields by default', () => {
        const options = new TaskLayoutOptions_1.TaskLayoutOptions();
        expect(options.isShown(TaskLayoutOptions_1.TaskLayoutComponent.Priority)).toEqual(true);
        expect(options.isShown(TaskLayoutOptions_1.TaskLayoutComponent.CreatedDate)).toEqual(true);
    });
    it('should be able to hide a field', () => {
        const options = new TaskLayoutOptions_1.TaskLayoutOptions();
        options.hide(TaskLayoutOptions_1.TaskLayoutComponent.CreatedDate);
        expect(options.isShown(TaskLayoutOptions_1.TaskLayoutComponent.CreatedDate)).toEqual(false);
    });
    it('should be settable via a boolean', () => {
        const options = new TaskLayoutOptions_1.TaskLayoutOptions();
        options.setVisibility(TaskLayoutOptions_1.TaskLayoutComponent.ScheduledDate, false);
        expect(options.isShown(TaskLayoutOptions_1.TaskLayoutComponent.ScheduledDate)).toEqual(false);
        options.setVisibility(TaskLayoutOptions_1.TaskLayoutComponent.ScheduledDate, true);
        expect(options.isShown(TaskLayoutOptions_1.TaskLayoutComponent.ScheduledDate)).toEqual(true);
    });
    it('should set tag visibility', () => {
        const options = new TaskLayoutOptions_1.TaskLayoutOptions();
        expect(options.areTagsShown()).toEqual(true);
        options.setTagsVisibility(false);
        expect(options.areTagsShown()).toEqual(false);
        options.setTagsVisibility(true);
        expect(options.areTagsShown()).toEqual(true);
    });
    it('should provide a list of shown components', () => {
        const options = new TaskLayoutOptions_1.TaskLayoutOptions();
        expect(options.shownComponents.join('\n')).toMatchInlineSnapshot(`
            "description
            id
            dependsOn
            priority
            recurrenceRule
            onCompletion
            createdDate
            startDate
            scheduledDate
            dueDate
            cancelledDate
            doneDate
            blockLink"
        `);
        options.setVisibility(TaskLayoutOptions_1.TaskLayoutComponent.DueDate, false);
        options.setVisibility(TaskLayoutOptions_1.TaskLayoutComponent.BlockLink, false);
        expect(options.shownComponents.join('\n')).toMatchInlineSnapshot(`
            "description
            id
            dependsOn
            priority
            recurrenceRule
            onCompletion
            createdDate
            startDate
            scheduledDate
            cancelledDate
            doneDate"
        `);
    });
    it('should provide a list of hidden components', () => {
        const options = new TaskLayoutOptions_1.TaskLayoutOptions();
        expect(options.hiddenComponents.join('\n')).toMatchInlineSnapshot('""');
        options.setVisibility(TaskLayoutOptions_1.TaskLayoutComponent.StartDate, false);
        options.setVisibility(TaskLayoutOptions_1.TaskLayoutComponent.DoneDate, false);
        expect(options.hiddenComponents.join('\n')).toMatchInlineSnapshot(`
            "startDate
            doneDate"
        `);
    });
    it('should toggle visibility', () => {
        const options = new TaskLayoutOptions_1.TaskLayoutOptions();
        options.setVisibility(TaskLayoutOptions_1.TaskLayoutComponent.CancelledDate, false);
        options.setVisibility(TaskLayoutOptions_1.TaskLayoutComponent.Priority, true);
        options.setTagsVisibility(true);
        options.toggleVisibilityExceptDescriptionAndBlockLink();
        expect(options.isShown(TaskLayoutOptions_1.TaskLayoutComponent.CancelledDate)).toEqual(true);
        expect(options.isShown(TaskLayoutOptions_1.TaskLayoutComponent.Priority)).toEqual(false);
        expect(options.areTagsShown()).toEqual(false);
    });
    it('should not toggle visibility of description and blockLink', () => {
        const options = new TaskLayoutOptions_1.TaskLayoutOptions();
        options.setVisibility(TaskLayoutOptions_1.TaskLayoutComponent.Description, true);
        options.setVisibility(TaskLayoutOptions_1.TaskLayoutComponent.BlockLink, true);
        options.toggleVisibilityExceptDescriptionAndBlockLink();
        expect(options.isShown(TaskLayoutOptions_1.TaskLayoutComponent.Description)).toEqual(true);
        expect(options.isShown(TaskLayoutOptions_1.TaskLayoutComponent.BlockLink)).toEqual(true);
    });
    it('should provide toggleable components', () => {
        const options = new TaskLayoutOptions_1.TaskLayoutOptions();
        expect(options.toggleableComponents.join('\n')).toMatchInlineSnapshot(`
            "id
            dependsOn
            priority
            recurrenceRule
            onCompletion
            createdDate
            startDate
            scheduledDate
            dueDate
            cancelledDate
            doneDate"
        `);
    });
});
describe('parsing task show/hide layout options', () => {
    it.each([
        // NEW_TASK_FIELD_EDIT_REQUIRED
        // Alphabetical order
        ['cancelled date', TaskLayoutOptions_1.TaskLayoutComponent.CancelledDate],
        ['created date', TaskLayoutOptions_1.TaskLayoutComponent.CreatedDate],
        ['depends on', TaskLayoutOptions_1.TaskLayoutComponent.DependsOn],
        ['done date', TaskLayoutOptions_1.TaskLayoutComponent.DoneDate],
        ['due date', TaskLayoutOptions_1.TaskLayoutComponent.DueDate],
        ['id', TaskLayoutOptions_1.TaskLayoutComponent.Id],
        ['on completion', TaskLayoutOptions_1.TaskLayoutComponent.OnCompletion],
        ['priority', TaskLayoutOptions_1.TaskLayoutComponent.Priority],
        ['recurrence rule', TaskLayoutOptions_1.TaskLayoutComponent.RecurrenceRule],
        ['scheduled date', TaskLayoutOptions_1.TaskLayoutComponent.ScheduledDate],
        ['start date', TaskLayoutOptions_1.TaskLayoutComponent.StartDate],
    ])('should parse option: %s', (option, component) => {
        const options = new TaskLayoutOptions_1.TaskLayoutOptions();
        (0, TaskLayoutOptions_1.parseTaskShowHideOptions)(options, option, false);
        expect(options.isShown(component)).toEqual(false);
        (0, TaskLayoutOptions_1.parseTaskShowHideOptions)(options, option, true);
        expect(options.isShown(component)).toEqual(true);
    });
    it('should parse tags option', () => {
        const options = new TaskLayoutOptions_1.TaskLayoutOptions();
        (0, TaskLayoutOptions_1.parseTaskShowHideOptions)(options, 'tags', false);
        expect(options.areTagsShown()).toEqual(false);
        (0, TaskLayoutOptions_1.parseTaskShowHideOptions)(options, 'tags', true);
        expect(options.areTagsShown()).toEqual(true);
    });
});
//# sourceMappingURL=TaskLayoutOptions.test.js.map