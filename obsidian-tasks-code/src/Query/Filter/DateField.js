"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateField = void 0;
const DateRange_1 = require("../../DateTime/DateRange");
const DateParser_1 = require("../../DateTime/DateParser");
const Explanation_1 = require("../Explain/Explanation");
const DateTools_1 = require("../../DateTime/DateTools");
const TemplatingPluginTools_1 = require("../../lib/TemplatingPluginTools");
const Field_1 = require("./Field");
const Filter_1 = require("./Filter");
const FilterInstructions_1 = require("./FilterInstructions");
const FilterOrErrorMessage_1 = require("./FilterOrErrorMessage");
/**
 * DateField is an abstract base class to help implement
 * all the filter instructions that act on a single type of date
 * value, such as the done date.
 */
class DateField extends Field_1.Field {
    constructor(filterInstructions = null) {
        super();
        if (filterInstructions !== null) {
            this.filterInstructions = filterInstructions;
        }
        else {
            this.filterInstructions = new FilterInstructions_1.FilterInstructions();
            this.filterInstructions.add(`has ${this.fieldName()} date`, (task) => this.date(task) !== null);
            this.filterInstructions.add(`no ${this.fieldName()} date`, (task) => this.date(task) === null);
            this.filterInstructions.add(`${this.fieldName()} date is invalid`, (task) => {
                const date = this.date(task);
                return date !== null && !date.isValid();
            });
        }
    }
    canCreateFilterForLine(line) {
        if (this.filterInstructions.canCreateFilterForLine(line)) {
            return true;
        }
        return super.canCreateFilterForLine(line);
    }
    createFilterOrErrorMessage(line) {
        // There have been multiple "bug reports", where the query had un-expanded
        // template text to signify the search date.
        // Enough to explicitly trap any such text for date searches:
        const errorText = this.checkForUnexpandedTemplateText(line);
        if (errorText) {
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, errorText);
        }
        const filterResult = this.filterInstructions.createFilterOrErrorMessage(line);
        if (filterResult.isValid()) {
            return filterResult;
        }
        const fieldNameKeywordDate = Field_1.Field.getMatch(this.filterRegExp(), line);
        if (fieldNameKeywordDate === null) {
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, 'do not understand query filter (' + this.fieldName() + ' date)');
        }
        const keywordAndDateString = fieldNameKeywordDate[1]; // The whole line except the field name
        const fieldKeyword = fieldNameKeywordDate[2]?.toLowerCase(); // 'on', 'in', 'before', 'after', 'on|in or before|after' or undefined
        const fieldDateString = fieldNameKeywordDate[3]; // The remainder of the instruction
        // Try interpreting everything after the keyword as a date range:
        let fieldDates = DateParser_1.DateParser.parseDateRange(fieldDateString);
        // If the date range parsing failed, try again to parse the whole line except the field name
        // as a single date, using the pre-date-ranges parsing mechanism.
        // This is needed to keep 'due in two weeks' working, as 'two weeks' is not actually a valid date range
        // if the futureDates value passed in to chrono's parsing functions is false.
        if (!fieldDates.isValid()) {
            const date = DateParser_1.DateParser.parseDate(keywordAndDateString);
            if (date.isValid()) {
                fieldDates = new DateRange_1.DateRange(date, date);
            }
        }
        if (!fieldDates.isValid()) {
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, 'do not understand ' + this.fieldName() + ' date');
        }
        const filterFunction = this.buildFilterFunction(fieldKeyword, fieldDates);
        const explanation = DateField.buildExplanation(this.fieldNameForExplanation(), fieldKeyword, this.filterResultIfFieldMissing(), fieldDates);
        return FilterOrErrorMessage_1.FilterOrErrorMessage.fromFilter(new Filter_1.Filter(line, filterFunction, explanation));
    }
    /**
     * Builds function that actually filters the tasks depending on the date
     * @param fieldKeyword relationship to be held with the date 'before', 'after'
     * @param fieldDates the date range to be used by the filter function
     * @returns the function that filters the tasks
     */
    buildFilterFunction(fieldKeyword, fieldDates) {
        let dateFilter;
        switch (fieldKeyword) {
            case 'before':
                dateFilter = (date) => (date ? date.isBefore(fieldDates.start) : this.filterResultIfFieldMissing());
                break;
            case 'after':
                dateFilter = (date) => (date ? date.isAfter(fieldDates.end) : this.filterResultIfFieldMissing());
                break;
            case 'on or before':
            case 'in or before':
                // 'on or before'/'in or before' a date range uses the end of the range
                // as the search limit, so that it matches every date in the
                // inclusive date range, and all dates before the range.
                dateFilter = (date) => (date ? date.isSameOrBefore(fieldDates.end) : this.filterResultIfFieldMissing());
                break;
            case 'on or after':
            case 'in or after':
                // 'on or after'/'in or after' a date range uses the beginning of the range
                // as the search limit, so that it matches every date in the
                // inclusive date range, and all dates after the range.
                dateFilter = (date) => date ? date.isSameOrAfter(fieldDates.start) : this.filterResultIfFieldMissing();
                break;
            default:
                dateFilter = (date) => date
                    ? date.isSameOrAfter(fieldDates.start) && date.isSameOrBefore(fieldDates.end)
                    : this.filterResultIfFieldMissing();
        }
        return this.getFilter(dateFilter);
    }
    getFilter(dateFilterFunction) {
        return (task) => {
            return dateFilterFunction(this.date(task));
        };
    }
    filterRegExp() {
        return new RegExp(`^${this.fieldNameForFilterInstruction()} (((?:on|in) or before|before|(?:on|in) or after|after|on|in)? ?(.*))`, 'i');
    }
    /**
     * Enable support for 'starts ...' as filter where the field name is different ('start').
     */
    fieldNameForFilterInstruction() {
        return this.fieldName();
    }
    /**
     * Constructs an Explanation for a date-based filter
     * @param fieldName - for example, 'due'
     * @param fieldKeyword - one of the keywords like 'before' or 'after'
     * @param filterResultIfFieldMissing - whether the search matches tasks without the requested date value
     * @param filterDates - the date range used in the filter
     */
    static buildExplanation(fieldName, fieldKeyword, filterResultIfFieldMissing, filterDates) {
        let relationship = fieldKeyword;
        // Example of formatted date: '2024-01-02 (Tuesday 2nd January 2024)'
        const dateFormat = 'YYYY-MM-DD (dddd Do MMMM YYYY)';
        let explanationDates;
        switch (fieldKeyword) {
            case 'before':
            case 'on or after':
                // 'before <date range>' and 'on or after <date range>' reference the Start of the range:
                //  - 'before this week' is before the Monday
                //  - 'on or after this week' is starting from Monday inclusive.
                explanationDates = filterDates.start.format(dateFormat);
                break;
            case 'after':
            case 'on or before':
                // 'after <date range>' and 'on or before <date range>' reference the End of the range:
                //  - 'after this month' is after the last day of this month
                //  - 'on or before this month' is before the last day of this month inclusive.
                explanationDates = filterDates.end.format(dateFormat);
                break;
            case 'in or before':
                relationship = 'on or before';
                explanationDates = filterDates.end.format(dateFormat);
                break;
            case 'in or after':
                relationship = 'on or after';
                explanationDates = filterDates.start.format(dateFormat);
                break;
            default:
                if (!filterDates.start.isSame(filterDates.end)) {
                    // This is a special case where a multi-line explanation has to be built
                    // All other cases need only one line
                    const firstLine = `${fieldName} date is between:`;
                    // Consecutive lines
                    const subExplanations = [
                        new Explanation_1.Explanation(`${filterDates.start.format(dateFormat)} and`),
                        new Explanation_1.Explanation(`${filterDates.end.format(dateFormat)} inclusive`),
                    ];
                    // Optional line for StartDateField (so far)
                    if (filterResultIfFieldMissing) {
                        subExplanations.push(new Explanation_1.Explanation(`OR no ${fieldName} date`));
                    }
                    return new Explanation_1.Explanation(firstLine, subExplanations);
                }
                relationship = 'on';
                explanationDates = filterDates.start.format(dateFormat);
                break;
        }
        let oneLineExplanation = `${fieldName} date is ${relationship} ${explanationDates}`;
        if (filterResultIfFieldMissing) {
            oneLineExplanation += ` OR no ${fieldName} date`;
        }
        return new Explanation_1.Explanation(oneLineExplanation);
    }
    fieldNameForExplanation() {
        return this.fieldName();
    }
    supportsSorting() {
        return true;
    }
    comparator() {
        return (a, b) => {
            return (0, DateTools_1.compareByDate)(this.date(a), this.date(b));
        };
    }
    supportsGrouping() {
        return true;
    }
    grouper() {
        return (task) => {
            const date = this.date(task);
            if (date === null) {
                return ['No ' + this.fieldName() + ' date'];
            }
            if (!date.isValid()) {
                // Use comment-out text to force Invalid dates to be sorted before the other headings.
                // When the heading is rendered by Obsidian, the comment will be invisible.
                return ['%%0%% Invalid ' + this.fieldName() + ' date'];
            }
            return [date.format('YYYY-MM-DD dddd')];
        };
    }
    checkForUnexpandedTemplateText(line) {
        return new TemplatingPluginTools_1.TemplatingPluginTools().findUnexpandedDateText(line);
    }
}
exports.DateField = DateField;
//# sourceMappingURL=DateField.js.map