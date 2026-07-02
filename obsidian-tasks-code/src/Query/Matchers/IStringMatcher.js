"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IStringMatcher = void 0;
/**
 * An interface for determining whether a string value matches a particular condition.
 *
 * This is used to hide away the details of various text searches, such as the
 * simple inclusion of a sub-string, or the more complex regular expression searches.
 */
class IStringMatcher {
    /**
     * Return whether any of the given strings matches this condition.
     * @param stringsToSearch
     */
    matchesAnyOf(stringsToSearch) {
        return stringsToSearch.some((s) => this.matches(s));
    }
}
exports.IStringMatcher = IStringMatcher;
//# sourceMappingURL=IStringMatcher.js.map