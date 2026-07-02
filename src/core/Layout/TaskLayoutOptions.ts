/**
 * {@link Task} fields used for rendering. Use references to this enum instead of plain string
 * values. The order here determines the order that task fields are rendered and written to
 * markdown.
 */
export enum TaskLayoutComponent {
    Description = 'description',
    Id = 'id',
    DependsOn = 'dependsOn',
    Priority = 'priority',
    RecurrenceRule = 'recurrenceRule',
    OnCompletion = 'onCompletion',
    CreatedDate = 'createdDate',
    StartDate = 'startDate',
    ScheduledDate = 'scheduledDate',
    DueDate = 'dueDate',
    CancelledDate = 'cancelledDate',
    DoneDate = 'doneDate',
    BlockLink = 'blockLink',
}

export const taskLayoutComponents = Object.values(TaskLayoutComponent);

/**
 * Various rendering options of tasks in a query.
 */
export class TaskLayoutOptions {
    private visible: { [component: string]: boolean } = {};
    private tagsVisible: boolean = true;

    constructor() {
        taskLayoutComponents.forEach((component) => {
            this.visible[component] = true;
        });
    }

    public isShown(component: TaskLayoutComponent) {
        return this.visible[component];
    }

    public areTagsShown() {
        return this.tagsVisible;
    }

    public hide(component: TaskLayoutComponent) {
        this.visible[component] = false;
    }

    public setVisibility(component: TaskLayoutComponent, visible: boolean) {
        this.visible[component] = visible;
    }

    public setTagsVisibility(visibility: boolean) {
        this.tagsVisible = visibility;
    }

    public get shownComponents() {
        return taskLayoutComponents.filter((component) => {
            return this.visible[component];
        });
    }

    public get hiddenComponents() {
        return taskLayoutComponents.filter((component) => {
            return !this.visible[component];
        });
    }
}
