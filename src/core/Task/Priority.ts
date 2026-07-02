/**
 * When sorting, make sure low always comes after none. This way any tasks with low will be below any exiting
 * tasks that have no priority which would be the default.
 *
 * @enum {number}
 */
export enum Priority {
    Highest = '0',
    High = '1',
    Medium = '2',
    None = '3',
    Low = '4',
    Lowest = '5',
}

const priorityNameMap: Record<Priority, string> = {
    [Priority.Highest]: 'Highest',
    [Priority.High]: 'High',
    [Priority.Medium]: 'Medium',
    [Priority.None]: 'Normal',
    [Priority.Low]: 'Low',
    [Priority.Lowest]: 'Lowest',
};

export function priorityNameUsingNormal(priority: Priority): string {
    return priorityNameMap[priority] ?? 'Normal';
}
