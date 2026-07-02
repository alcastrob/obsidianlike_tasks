"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = exports.Notice = exports.Menu = exports.MenuItem = exports.mockApp = void 0;
exports.getAllTags = getAllTags;
exports.parseFrontMatterTags = parseFrontMatterTags;
exports.getFirstLinkpathDest = getFirstLinkpathDest;
exports.getFirstLinkpathDestFromData = getFirstLinkpathDestFromData;
exports.prepareSimpleSearch = prepareSimpleSearch;
exports.setIcon = setIcon;
exports.setTooltip = setTooltip;
exports.debounce = debounce;
exports.getLanguage = getLanguage;
const MockDataLoader_1 = require("../TestingTools/MockDataLoader");
/**
 * Since we don't use the app object's method or properties directly,
 * and just treat it as an "opaque object" for markdown rendering, there is
 * not a lot to mock in particular.
 */
exports.mockApp = {};
class MenuItem {
    constructor() {
        this.title = '';
        this.checked = false;
        this.callback = (_evt) => console.log('callback not defined');
    }
    setTitle(title) {
        this.title = title;
        return this;
    }
    onClick(callback) {
        this.callback = callback;
        return this;
    }
    setChecked(checked) {
        this.checked = checked ? checked : false;
        return this;
    }
}
exports.MenuItem = MenuItem;
class Menu {
    constructor() {
        this.items = [];
    }
    /**
     * Adds a menu item. Only works when menu is not shown yet.
     * @public
     */
    addItem(cb) {
        const item = new MenuItem();
        cb(item);
        this.items.push(item);
        return this;
    }
    /**
     * Adds a separator. Only works when menu is not shown yet.
     */
    addSeparator() {
        const getMenuItemCallback = (item) => {
            item.setTitle('---');
        };
        return this.addItem(getMenuItemCallback);
    }
}
exports.Menu = Menu;
class Notice {
    /**
     * @public
     */
    constructor(_message, _timeout) { }
    /**
     * Change the message of this notice.
     * @public
     */
    setMessage(_message) {
        return this;
    }
    /**
     * @public
     */
    hide() { }
}
exports.Notice = Notice;
/**
 * An implementation detail of our fake {@link prepareSimpleSearch} - see below.
 *
 * See https://docs.obsidian.md/Reference/TypeScript+API/prepareSimpleSearch
 * @param searchTerm
 * @param phrase
 */
function caseInsensitiveSubstringSearch(searchTerm, phrase) {
    // Don't try and search for empty strings or just spaces:
    if (!searchTerm.trim()) {
        return null;
    }
    // Support multi-word search terms:
    const searchTerms = searchTerm.split(/\s+/);
    let matches = [];
    for (const term of searchTerms) {
        const regex = new RegExp(term, 'gi');
        let match;
        let termFound = false;
        while ((match = regex.exec(phrase)) !== null) {
            matches.push([match.index, match.index + match[0].length]);
            termFound = true;
        }
        // We require all search terms to be found.
        if (!termFound) {
            return null;
        }
    }
    // Sort matches by start index and then by end index
    matches = matches.sort((a, b) => {
        if (a[0] === b[0]) {
            return a[1] - b[1];
        }
        return a[0] - b[0];
    });
    return matches.length > 0
        ? {
            score: 0, // this fake implementation does not support calculating scores.
            matches: matches,
        }
        : null;
}
/**
 * Fake implementation of Obsidian's `getAllTags()`.
 *
 * See https://docs.obsidian.md/Reference/TypeScript+API/getAllTags
 *
 * @param cachedMetadata - the CachedMetadata instance from a SimulatedFile that has
 *                         already been loaded via MockDataLoader.get().
 * @throws Error if no matching CachedMetadata is found in the MockDataLoader cache.
 */
function getAllTags(cachedMetadata) {
    const simulatedFile = MockDataLoader_1.MockDataLoader.findCachedMetaData(cachedMetadata);
    return simulatedFile.getAllTags;
}
/**
 * Fake implementation of Obsidian's `parseFrontMatterTags()`.
 *
 * See https://docs.obsidian.md/Reference/TypeScript+API/parseFrontMatterTags
 *
 * @example
 * This works:
 * ```typescript
 *     const tags = parseFrontMatterTags(tasksFile.cachedMetadata.frontmatter);
 * ```
 *
 * @example
 * This does not work:
 * ```typescript
 *     const tags = parseFrontMatterTags(tasksFile.frontmatter);
 * ```
 *
 * @param frontmatter - the raw CachedMetadata.frontmatter instance from a SimulatedFile that has
 *                      already been loaded via MockDataLoader.get().
 * @throws Error if no matching frontmatter is found in the MockDataLoader cache,
 *               or a `tasksFile.frontmatter` was supplied.
 */
function parseFrontMatterTags(frontmatter) {
    const simulatedFile = MockDataLoader_1.MockDataLoader.findFrontmatter(frontmatter);
    return simulatedFile.parseFrontMatterTags;
}
/**
 * Fake implementation of calling Obsidian's `getLinkpath()` and `app.metadataCache.getFirstLinkpathDest()`
 * This reads saved the {@link SimulatedFile} JSON files.
 *
 * See https://docs.obsidian.md/Reference/TypeScript+API/getLinkpath
 * See https://docs.obsidian.md/Reference/TypeScript+API/MetadataCache/getFirstLinkpathDest
 *
 * @param rawLink
 * @param sourcePath - the path to a Markdown file in the test vault whose SimulatedFile has already
 *                     been loaded via MockDataLoader.get(). For example, 'Test Data/callout.md'
 *
 * @example
 * ```typescript
 *     beforeAll(() => {
 *         LinkResolver.getInstance().setGetFirstLinkpathDestFn((rawLink: Reference, sourcePath: string) => {
 *             return getFirstLinkpathDest(rawLink, sourcePath);
 *         });
 *     });
 * ```
 */
function getFirstLinkpathDest(rawLink, sourcePath) {
    const simulatedFile = MockDataLoader_1.MockDataLoader.findDataFromMarkdownPath(sourcePath);
    return getFirstLinkpathDestFromData(simulatedFile, rawLink);
}
function getFirstLinkpathDestFromData(data, rawLink) {
    if (!(rawLink.link in data.resolveLinkToPath)) {
        console.log(`Cannot find resolved path for ${rawLink.link} in ${data.filePath} in mock getFirstLinkpathDest()`);
    }
    return data.resolveLinkToPath[rawLink.link];
}
/**
 * A fake implementation of prepareSimpleSearch(),
 * so we can write tests of code that calls that function.
 * Note that the returned score is always 0.
 *
 * See https://docs.obsidian.md/Reference/TypeScript+API/prepareSimpleSearch
 * @param query - the search term
 */
function prepareSimpleSearch(query) {
    return function (text) {
        return caseInsensitiveSubstringSearch(query, text);
    };
}
function setIcon(element, iconId) {
    element.setAttribute('test-icon', iconId);
}
function setTooltip(element, text) {
    element.setAttribute('test-tooltip', text);
}
function debounce(cb, _timeout, _resetTimer) {
    const debouncer = ((..._args) => debouncer);
    debouncer.cancel = () => debouncer;
    debouncer.run = () => {
        return cb(...[]);
    };
    return debouncer;
}
function getLanguage() {
    return 'en';
}
/**
 * A mock implementation of the Obsidian Modal class.
 * Without this testing the TaskModal throws an error attempting to extend Modal
 */
class Modal {
    open() {
        // Mocked interface, no-op
    }
    close() {
        // Mocked interface, no-op
    }
    onOpen() { }
    onClose() { }
}
exports.Modal = Modal;
//# sourceMappingURL=obsidian.js.map