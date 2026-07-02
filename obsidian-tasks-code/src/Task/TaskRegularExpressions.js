"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRegularExpressions = void 0;
class TaskRegularExpressions {
}
exports.TaskRegularExpressions = TaskRegularExpressions;
_a = TaskRegularExpressions;
TaskRegularExpressions.dateFormat = 'YYYY-MM-DD';
TaskRegularExpressions.dateTimeFormat = 'YYYY-MM-DD HH:mm';
// Matches indentation before a list marker (including > for potentially nested blockquotes or Obsidian callouts)
TaskRegularExpressions.indentationRegex = /^([\s\t>]*)/;
// Matches - * and + list markers, or numbered list markers, for example 1. and 1)
TaskRegularExpressions.listMarkerRegex = /([-*+]|[0-9]+[.)])/;
// Matches a checkbox and saves the status character inside
TaskRegularExpressions.checkboxRegex = /\[(.)\]/u;
// Matches the rest of the task after the checkbox.
TaskRegularExpressions.afterCheckboxRegex = / *(.*)/u;
// Main regex for parsing a line. It matches the following:
// - Indentation
// - List marker
// - Status character
// - Rest of task after checkbox markdown
// See Task.extractTaskComponents() for abstraction around this regular expression.
// That is private for now, but could be made public in future if needed.
TaskRegularExpressions.taskRegex = new RegExp(_a.indentationRegex.source +
    _a.listMarkerRegex.source +
    ' +' +
    _a.checkboxRegex.source +
    _a.afterCheckboxRegex.source, 'u');
// Used with the "Create or Edit Task" command to parse indentation and status if present
// It matches the following:
// - Indentation
// - List marker
// - Checkbox with status character
// - Status character
// - Rest of task after checkbox markdown
TaskRegularExpressions.nonTaskRegex = new RegExp(_a.indentationRegex.source +
    _a.listMarkerRegex.source +
    '? *(' +
    _a.checkboxRegex.source +
    ')?' +
    _a.afterCheckboxRegex.source, 'u');
// Used with "Toggle Done" command to detect a list item that can get a checkbox added to it.
TaskRegularExpressions.listItemRegex = new RegExp(_a.indentationRegex.source + _a.listMarkerRegex.source);
// Match on block link at end.
TaskRegularExpressions.blockLinkRegex = / \^[a-zA-Z0-9-]+$/u;
// Regex to match all hash tags, basically hash followed by anything but the characters in the negation.
// To ensure URLs are not caught it is looking of beginning of string tag and any
// tag that has a space in front of it. Any # that has a character in front
// of it will be ignored.
// EXAMPLE:
// description: '#dog #car http://www/ddd#ere #house'
// matches: #dog, #car, #house
// MAINTENANCE NOTE:
//  If hashTags is modified, please update 'Recognising Tags' in Tags.md in the docs.
TaskRegularExpressions.hashTags = /(^|\s)#[^ !@#$%^&*(),.?":{}|<>]+/g;
TaskRegularExpressions.hashTagsFromEnd = new RegExp(_a.hashTags.source + '$');
//# sourceMappingURL=TaskRegularExpressions.js.map