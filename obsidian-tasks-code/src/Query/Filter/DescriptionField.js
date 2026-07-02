"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DescriptionField = void 0;
const GlobalFilter_1 = require("../../Config/GlobalFilter");
const TextField_1 = require("./TextField");
/**
 * Support the 'description' search instruction.
 *
 * Note that DescriptionField.value() returns the description
 * with the global filter (if any) removed.
 */
class DescriptionField extends TextField_1.TextField {
    fieldName() {
        return 'description';
    }
    /**
     * Return the task's description, with any global tag removed
     *
     * Promoted to public, to enable testing.
     * @param task
     * @public
     */
    value(task) {
        // Remove global filter from description match if present.
        // This is necessary to match only on the content of the task, not
        // the global filter.
        return GlobalFilter_1.GlobalFilter.getInstance().removeAsSubstringFrom(task.description);
    }
    supportsSorting() {
        return true;
    }
    /**
     * Return a function to compare the description by how it is rendered in markdown.
     *
     * Does not use the MarkdownRenderer, but tries to match regexes instead
     * in order to be simpler, faster, and not async.
     *
     * Only searches at the start of the description. Markdown later in the tak is unchanged.
     */
    comparator() {
        return (a, b) => {
            const descriptionA = DescriptionField.cleanDescription(a.description);
            const descriptionB = DescriptionField.cleanDescription(b.description);
            return descriptionA.localeCompare(descriptionB, undefined, { numeric: true });
        };
    }
    /**
     * Removes `*`, `=`, and `[` from the beginning of the description.
     *
     * Will remove them only if they are closing.
     * Properly reads links [[like this|one]] (note pipe).
     */
    static cleanDescription(description) {
        description = GlobalFilter_1.GlobalFilter.getInstance().removeAsSubstringFrom(description);
        const startsWithLinkRegex = /^\[\[?([^\]]*)]]?/;
        const linkRegexMatch = description.match(startsWithLinkRegex);
        if (linkRegexMatch !== null) {
            const innerLinkText = linkRegexMatch[1];
            // For a link, we have to check whether it has another visible name set.
            // For example `[[this is the link|but this is actually shown]]`.
            description =
                innerLinkText.substring(innerLinkText.indexOf('|') + 1) + description.replace(startsWithLinkRegex, '');
        }
        description = this.replaceFormatting(description, /^\*\*([^*]+)\*\*/);
        description = this.replaceFormatting(description, /^\*([^*]+)\*/);
        description = this.replaceFormatting(description, /^==([^=]+)==/);
        description = this.replaceFormatting(description, /^__([^_]+)__/);
        description = this.replaceFormatting(description, /^_([^_]+)_/);
        return description;
    }
    /**
     * Remove some formatting from text
     * @param description
     * @param regExp A regular expression - all matching text is discarded except the first group
     */
    static replaceFormatting(description, regExp) {
        const italicBoldRegexMatch = description.match(regExp);
        if (italicBoldRegexMatch !== null) {
            const innerItalicBoldText = italicBoldRegexMatch[1];
            description = innerItalicBoldText + description.replace(regExp, '');
        }
        return description;
    }
}
exports.DescriptionField = DescriptionField;
//# sourceMappingURL=DescriptionField.js.map