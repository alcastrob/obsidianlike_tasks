"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryLayoutOptions = void 0;
exports.parseQueryShowHideOptions = parseQueryShowHideOptions;
/**
 * Options to control {@link QueryRenderer} behaviour.
 *
 * @see LayoutOptions
 */
class QueryLayoutOptions {
    constructor() {
        this.hideToolbar = false;
        this.hidePostponeButton = false;
        this.hideTaskCount = false;
        this.hideBacklinks = false;
        this.hideEditButton = false;
        this.hideUrgency = true;
        this.hideTree = true;
        this.shortMode = false;
        this.explainQuery = false;
    }
}
exports.QueryLayoutOptions = QueryLayoutOptions;
/**
 * Parse show/hide options for Query Layout options
 * @param queryLayoutOptions
 * @param option - must already have been lower-cased
 * @param hide - whether the option should be hidden
 * @return True if the option was recognised, and false otherwise
 * @see parseTaskShowHideOptions
 */
function parseQueryShowHideOptions(queryLayoutOptions, option, hide) {
    const optionMap = new Map([
        // Alphabetical order
        ['backlink', 'hideBacklinks'],
        ['edit button', 'hideEditButton'],
        ['postpone button', 'hidePostponeButton'],
        ['task count', 'hideTaskCount'],
        ['toolbar', 'hideToolbar'],
        ['tree', 'hideTree'],
        ['urgency', 'hideUrgency'],
    ]);
    for (const [key, property] of optionMap.entries()) {
        if (option.startsWith(key)) {
            queryLayoutOptions[property] = hide;
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=QueryLayoutOptions.js.map