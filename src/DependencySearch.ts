import { Task } from './core/Task/Task';

export interface DependencyCandidate {
    key: string;
    description: string;
    path: string;
    statusSymbol: string;
}

const MAX_RESULTS = 20;

/** Case-insensitive substring match scores highest (earlier match wins); otherwise falls back to
 * a subsequence match so e.g. "tkrsh" still finds "take out the trash". There is no Obsidian vault
 * here to call `prepareSimpleSearch` against (the original's `src/ui/DependencyHelpers.ts` relies
 * on it), so this is a small standalone approximation rather than a direct port. */
function matchScore(query: string, text: string): number | null {
    if (query === '') return 0;
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    const idx = t.indexOf(q);
    if (idx !== -1) return 10000 - idx;

    let ti = 0;
    for (const ch of q) {
        const found = t.indexOf(ch, ti);
        if (found === -1) return null;
        ti = found + 1;
    }
    return 1000 - ti;
}

export function dependencyKey(task: Task): string {
    return `${task.path}#${task.lineNumber}`;
}

/**
 * Finds tasks to offer as "Before this"/"After this" candidates, mirroring Obsidian Tasks'
 * `searchForCandidateTasksForDependency`: not-done tasks only, excluding the task being edited and
 * anything already selected in either field, ranked by match score and then by proximity (same
 * file, closest line) to the task being edited.
 */
export function searchDependencyCandidates(
    query: string,
    allTasks: Task[],
    self: { path: string; line: number } | null,
    excludeKeys: ReadonlySet<string>,
): DependencyCandidate[] {
    const candidates = allTasks.filter((task) => {
        if (task.isDone) return false;
        if (self && task.path === self.path && task.lineNumber === self.line) return false;
        if (excludeKeys.has(dependencyKey(task))) return false;
        return true;
    });

    const scored = candidates
        .map((task) => ({ task, score: matchScore(query, task.description) }))
        .filter((entry): entry is { task: Task; score: number } => entry.score !== null);

    scored.sort((a, b) => b.score - a.score);

    if (self) {
        // Stable secondary sort: tasks in the same file as the one being edited, closest line
        // first, take priority over the match score, without disturbing the score-based order
        // within/outside that group.
        scored.sort((a, b) => {
            const aSame = a.task.path === self.path;
            const bSame = b.task.path === self.path;
            if (aSame && bSame) {
                return Math.abs(a.task.lineNumber - self.line) - Math.abs(b.task.lineNumber - self.line);
            }
            if (aSame) return -1;
            if (bSame) return 1;
            return 0;
        });
    }

    return scored.slice(0, MAX_RESULTS).map(({ task }) => ({
        key: dependencyKey(task),
        description: task.description,
        path: task.path,
        statusSymbol: task.status.symbol,
    }));
}
