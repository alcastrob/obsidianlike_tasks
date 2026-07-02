"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalFilter = void 0;
const RegExpTools = __importStar(require("../lib/RegExpTools"));
/**
 * GlobalFilter has its own data, independent of {@link Settings.globalFilter} value in {@link Settings}.
 *
 * See https://publish.obsidian.md/tasks/Getting+Started/Global+Filter
 *
 * Limitations:
 * - All methods are static, so it is a collection of multiple static things
 *     - This is in contrast to {@link GlobalQuery} what has just the one static method, {@link GlobalQuery.getInstance}.
 *     - These static methods will be made non-static in a future change.
 */
class GlobalFilter {
    constructor() {
        this._globalFilter = '';
        this._removeGlobalFilter = false;
    }
    /**
     * Provides access to the single global instance of GlobalFilter.
     * This should eventually only be used in the plugin code.
     */
    static getInstance() {
        if (!GlobalFilter.instance) {
            GlobalFilter.instance = new GlobalFilter();
        }
        return GlobalFilter.instance;
    }
    get() {
        return this._globalFilter;
    }
    set(value) {
        this._globalFilter = value;
    }
    reset() {
        this.set(GlobalFilter.empty);
    }
    isEmpty() {
        return this.get() === GlobalFilter.empty;
    }
    equals(tag) {
        return this.get() === tag;
    }
    includedIn(description) {
        const globalFilter = this.get();
        return description.includes(globalFilter);
    }
    prependTo(description) {
        return this.get() + ' ' + description;
    }
    removeAsWordFromDependingOnSettings(description) {
        const removeGlobalFilter = this.getRemoveGlobalFilter();
        if (removeGlobalFilter) {
            return this.removeAsWordFrom(description);
        }
        return description;
    }
    /**
     * @see setRemoveGlobalFilter
     */
    getRemoveGlobalFilter() {
        return this._removeGlobalFilter;
    }
    /**
     * @see getRemoveGlobalFilter
     */
    setRemoveGlobalFilter(removeGlobalFilter) {
        this._removeGlobalFilter = removeGlobalFilter;
    }
    /**
     * Search for the global filter for the purpose of removing it from the description, but do so only
     * if it is a separate word (preceding the beginning of line or a space and followed by the end of line
     * or a space), because we don't want to cut-off nested tags like #task/subtag.
     * If the global filter exists as part of a nested tag, we keep it untouched.
     */
    removeAsWordFrom(description) {
        if (this.isEmpty()) {
            return description;
        }
        // This matches the global filter (after escaping it) only when it's a complete word
        const theRegExp = RegExp('(^|\\s)' + RegExpTools.escapeRegExp(this.get()) + '($|\\s)', 'ug');
        if (description.search(theRegExp) > -1) {
            description = description.replace(theRegExp, '$1$2').replace('  ', ' ').trim();
        }
        return description;
    }
    removeAsSubstringFrom(description) {
        const globalFilter = this.get();
        return description.replace(globalFilter, '').trim();
    }
}
exports.GlobalFilter = GlobalFilter;
GlobalFilter.empty = '';
//# sourceMappingURL=GlobalFilter.js.map