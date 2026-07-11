import { Task } from './Task';

/**
 * Port of Obsidian Tasks' `src/Task/TaskDependency.ts`, trimmed to the four helpers the
 * "Create or edit Task" dialog needs for its Before this/After this fields. `addDependencyToParent`
 * and `removeDependency` only ever read `.id` off their second argument in the original, so that
 * parameter is typed loosely here (`{ id: string }`) instead of requiring a full `Task` — useful
 * when the caller only has a freshly generated id in hand for the task currently being edited,
 * not a full `Task` object for it yet.
 */
export function generateUniqueId(existingIds: string[]): string {
    let id = '';
    let keepGenerating = true;

    while (keepGenerating) {
        // from https://www.codemzy.com/blog/random-unique-id-javascript
        id = Math.random().toString(36).substring(2, 6 + 2);

        if (!existingIds.includes(id)) {
            keepGenerating = false;
        }
    }
    return id;
}

export function ensureTaskHasId(child: Task, existingIds: string[]): Task {
    if (child.id !== '') return child;

    return new Task({ ...child, id: generateUniqueId(existingIds) });
}

export function addDependencyToParent(parent: Task, child: { id: string }): Task {
    if (parent.dependsOn.includes(child.id)) {
        return parent;
    }
    return new Task({ ...parent, dependsOn: [...parent.dependsOn, child.id] });
}

export function removeDependency(parent: Task, child: { id: string }): Task {
    if (!parent.dependsOn.includes(child.id)) {
        return parent;
    }
    return new Task({ ...parent, dependsOn: parent.dependsOn.filter((id) => id !== child.id) });
}
