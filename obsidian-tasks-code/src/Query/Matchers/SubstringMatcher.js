"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubstringMatcher = void 0;
const Explanation_1 = require("../Explain/Explanation");
const IStringMatcher_1 = require("./IStringMatcher");
/**
 * Substring-based implementation of IStringMatcher.
 *
 * This does a case-insensitive search for the given string.
 */
class SubstringMatcher extends IStringMatcher_1.IStringMatcher {
    /**
     * Construct a SubstringMatcher object
     *
     * @param {string} stringToFind - The string to search for.
     *                                Searches will be case-insensitive.
     */
    constructor(stringToFind) {
        super();
        this.stringToFind = stringToFind;
    }
    matches(stringToSearch) {
        return SubstringMatcher.stringIncludesCaseInsensitive(stringToSearch, this.stringToFind);
    }
    static stringIncludesCaseInsensitive(haystack, needle) {
        return haystack.toLocaleLowerCase().includes(needle.toLocaleLowerCase());
    }
    explanation(instruction) {
        // We don't currently have any specific explanation of substring-searching,
        // so just return the original instruction line.
        return new Explanation_1.Explanation(instruction);
    }
}
exports.SubstringMatcher = SubstringMatcher;
//# sourceMappingURL=SubstringMatcher.js.map