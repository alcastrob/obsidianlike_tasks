"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextField = void 0;
const SubstringMatcher_1 = require("../Matchers/SubstringMatcher");
const RegexMatcher_1 = require("../Matchers/RegexMatcher");
const ExceptionTools_1 = require("../../lib/ExceptionTools");
const Field_1 = require("./Field");
const Filter_1 = require("./Filter");
const FilterOrErrorMessage_1 = require("./FilterOrErrorMessage");
/**
 * TextField is an abstract base class to help implement
 * all the filter instructions that act on a single type of string
 * value, such as the description or file path.
 */
class TextField extends Field_1.Field {
    createFilterOrErrorMessage(line) {
        const match = Field_1.Field.getMatch(this.filterRegExp(), line);
        if (match === null) {
            // If Field.canCreateFilterForLine() has been checked, we should never get
            // in to this block.
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, `do not understand query filter (${this.fieldName()})`);
        }
        // Construct an IStringMatcher for this filter, or return
        // if the inputs are invalid.
        const filterOperator = match[1].toLowerCase();
        const filterValue = match[2];
        let matcher = null;
        if (filterOperator.includes('include')) {
            matcher = new SubstringMatcher_1.SubstringMatcher(filterValue);
        }
        else if (filterOperator.includes('regex')) {
            try {
                matcher = RegexMatcher_1.RegexMatcher.validateAndConstruct(filterValue);
            }
            catch (e) {
                const message = (0, ExceptionTools_1.errorMessageForException)('Parsing regular expression', e) + `\n\n${RegexMatcher_1.RegexMatcher.helpMessage()}`;
                return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, message);
            }
            if (matcher === null) {
                return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, `Invalid instruction: '${line}'\n\n${RegexMatcher_1.RegexMatcher.helpMessage()}`);
            }
        }
        if (matcher === null) {
            // It's likely this can now never be reached.
            // Retained for safety, for now.
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, `do not understand query filter (${this.fieldName()})`);
        }
        // Finally, we can create the Filter, that takes a task
        // and tests if it matches the string filtering rule
        // represented by this object.
        const negate = filterOperator.match(/not/) !== null;
        const filter = new Filter_1.Filter(line, this.getFilter(matcher, negate), matcher.explanation(line));
        return FilterOrErrorMessage_1.FilterOrErrorMessage.fromFilter(filter);
    }
    /**
     * Returns a regexp pattern matching the field's name and possible aliases
     */
    fieldPattern() {
        return this.fieldNameSingularEscaped();
    }
    /**
     * Returns a regexp pattern matching all possible filter operators for this field,
     * such as "includes" or "does not include".
     */
    filterOperatorPattern() {
        return 'includes|does not include|regex matches|regex does not match';
    }
    filterRegExp() {
        return new RegExp(`^(?:${this.fieldPattern()}) (${this.filterOperatorPattern()}) (.*)`, 'i');
    }
    getFilter(matcher, negate) {
        return (task) => {
            const match = matcher.matches(this.value(task));
            return negate ? !match : match;
        };
    }
    /**
     * A default implementation of sorting, for text fields where simple locale-aware sorting is the
     * desired behaviour.
     *
     * Each class that wants to use this will need to override supportsSorting() to return true,
     * to turn on sorting.
     */
    comparator() {
        return (a, b) => {
            return this.value(a).localeCompare(this.value(b), undefined, { numeric: true });
        };
    }
    /**
     * A default implementation of grouping, for text fields where simple grouping by field value is the
     * desired behaviour.
     *
     * Each class that wants to use this will need to override supportsGrouping() to return true,
     * to turn on grouping.
     */
    grouper() {
        return (task) => {
            return [this.value(task)];
        };
    }
    static escapeMarkdownCharacters(filename) {
        // https://wilsonmar.github.io/markdown-text-for-github-from-html/#special-characters
        return filename.replace(/\\/g, '\\\\').replace(/_/g, '\\_');
    }
}
exports.TextField = TextField;
//# sourceMappingURL=TextField.js.map