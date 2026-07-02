"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectQueryErrorToMentionDisabledJavaScript = expectQueryErrorToMentionDisabledJavaScript;
exports.formatToRepresentType = formatToRepresentType;
exports.addBackticks = addBackticks;
exports.determineExpressionType = determineExpressionType;
const moment_1 = __importDefault(require("moment"));
const TasksDate_1 = require("../../src/DateTime/TasksDate");
const TaskRegularExpressions_1 = require("../../src/Task/TaskRegularExpressions");
const Task_1 = require("../../src/Task/Task");
const Link_1 = require("../../src/Task/Link");
const JsInTasksQueriesDisabledError_1 = require("../../src/Scripting/JsInTasksQueriesDisabledError");
function expectQueryErrorToMentionDisabledJavaScript(query, instruction) {
    expect(query.error).toContain(JsInTasksQueriesDisabledError_1.JsInTasksQueriesDisabledError.helpMessage);
    expect(query.error).toContain(instruction);
}
function formatToRepresentType(x) {
    if (typeof x === 'string') {
        return "'" + x.replace(/\n/g, '\\n') + "'";
    }
    if (moment_1.default.isMoment(x)) {
        return `moment('${x.format(TaskRegularExpressions_1.TaskRegularExpressions.dateTimeFormat)}')`;
    }
    if (x instanceof Link_1.Link) {
        return formatToRepresentType(x.destinationPath);
    }
    if (x instanceof Task_1.Task) {
        return x.description;
    }
    if (x instanceof TasksDate_1.TasksDate) {
        return x.formatAsDateAndTime();
    }
    if (Array.isArray(x)) {
        return '[' + x.map((v) => formatToRepresentType(v)).join(', ') + ']';
    }
    // TODO Round numbers
    // TODO Format string arrays - can I use 'toString()'?
    // TODO Fix display of 2 spaces as `'  '` - which appears as a single space. <pre></pre> gets the spacing OK, but line is too tall
    return x;
}
function addBackticks(x) {
    const quotedText = '`' + x + '`';
    if (typeof x === 'string' && x.includes('%%')) {
        // Link to footnote that explains comments are not rendered...
        return `${quotedText} [^commented]`;
    }
    return quotedText;
}
function determineExpressionType(value) {
    if (value === null) {
        return 'null';
    }
    if (moment_1.default.isMoment(value)) {
        return 'Moment';
    }
    if (value instanceof Link_1.Link) {
        return 'Link';
    }
    if (value instanceof Task_1.Task) {
        return 'Task';
    }
    if (value instanceof TasksDate_1.TasksDate) {
        return 'TasksDate';
    }
    if (Array.isArray(value)) {
        if (value.length > 0) {
            return `${determineExpressionType(value[0])}[]`;
        }
        else {
            return 'any[]';
        }
    }
    return typeof value;
}
//# sourceMappingURL=ScriptingTestHelpers.js.map