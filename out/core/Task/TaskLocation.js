"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskLocation = void 0;
/**
 * Where a task line lives in the vault.
 *
 * This is a trimmed-down equivalent of Obsidian Tasks' `TaskLocation`: the original wraps a
 * `TasksFile` (Obsidian's cached-metadata/frontmatter handle), which has no equivalent outside
 * an Obsidian vault. Here a plain workspace-relative path is enough, since file contents are
 * read directly from disk / the VS Code document, not from a metadata cache.
 */
class TaskLocation {
    constructor(path, lineNumber, sectionStart = 0, sectionIndex = 0, precedingHeader = null) {
        this.path = path;
        this.lineNumber = lineNumber;
        this.sectionStart = sectionStart;
        this.sectionIndex = sectionIndex;
        this.precedingHeader = precedingHeader;
    }
    static fromUnknownPosition(path) {
        return new TaskLocation(path, 0, 0, 0, null);
    }
    get hasKnownPath() {
        return this.path !== '';
    }
    identicalTo(other) {
        return (this.path === other.path &&
            this.lineNumber === other.lineNumber &&
            this.sectionStart === other.sectionStart &&
            this.sectionIndex === other.sectionIndex &&
            this.precedingHeader === other.precedingHeader);
    }
}
exports.TaskLocation = TaskLocation;
//# sourceMappingURL=TaskLocation.js.map