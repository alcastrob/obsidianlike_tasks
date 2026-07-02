/**
 * Where a task line lives in the vault.
 *
 * This is a trimmed-down equivalent of Obsidian Tasks' `TaskLocation`: the original wraps a
 * `TasksFile` (Obsidian's cached-metadata/frontmatter handle), which has no equivalent outside
 * an Obsidian vault. Here a plain workspace-relative path is enough, since file contents are
 * read directly from disk / the VS Code document, not from a metadata cache.
 */
export class TaskLocation {
    public constructor(
        public readonly path: string,
        public readonly lineNumber: number,
        public readonly sectionStart: number = 0,
        public readonly sectionIndex: number = 0,
        public readonly precedingHeader: string | null = null,
    ) {}

    public static fromUnknownPosition(path: string): TaskLocation {
        return new TaskLocation(path, 0, 0, 0, null);
    }

    public get hasKnownPath(): boolean {
        return this.path !== '';
    }

    public identicalTo(other: TaskLocation): boolean {
        return (
            this.path === other.path &&
            this.lineNumber === other.lineNumber &&
            this.sectionStart === other.sectionStart &&
            this.sectionIndex === other.sectionIndex &&
            this.precedingHeader === other.precedingHeader
        );
    }
}
