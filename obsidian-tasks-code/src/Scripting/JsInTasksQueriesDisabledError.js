"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsInTasksQueriesDisabledError = void 0;
class JsInTasksQueriesDisabledError extends Error {
    constructor() {
        super(JsInTasksQueriesDisabledError.helpMessage);
        this.name = 'JsInTasksQueriesDisabledError';
    }
    static message() {
        return JsInTasksQueriesDisabledError.helpMessage;
    }
}
exports.JsInTasksQueriesDisabledError = JsInTasksQueriesDisabledError;
JsInTasksQueriesDisabledError.helpMessage = 'JavaScript is now disabled in Tasks queries by default.\n' +
    '    This query uses JavaScript, for example via "filter by function", "sort by function", or "group by function".\n' +
    '    JavaScript can run inside Obsidian and access or modify vault contents, local files, or other system resources.\n' +
    '    Read the Tasks documentation page "JavaScript in Tasks Queries" before deciding whether to enable it:\n' +
    '    https://publish.obsidian.md/tasks/Scripting/JavaScript+in+Tasks+Queries';
//# sourceMappingURL=JsInTasksQueriesDisabledError.js.map