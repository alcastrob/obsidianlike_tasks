"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkResolver = void 0;
const defaultGetFirstLinkpathDestFn = (_rawLink, _sourcePath) => null;
/**
 * An abstraction to implement {@link Link.destinationPath}.
 *
 * See also:
 * - `src/main.ts` - search for `LinkResolver.getInstance()`
 * - Uses of {@link getFirstLinkpathDest} and {@link getFirstLinkpathDestFromData} in
 * `tests/__mocks__/obsidian.ts`.
 */
class LinkResolver {
    constructor() {
        this.getFirstLinkpathDestFn = defaultGetFirstLinkpathDestFn;
    }
    setGetFirstLinkpathDestFn(getFirstLinkpathDestFn) {
        this.getFirstLinkpathDestFn = getFirstLinkpathDestFn;
    }
    resetGetFirstLinkpathDestFn() {
        this.getFirstLinkpathDestFn = defaultGetFirstLinkpathDestFn;
    }
    getDestinationPath(rawLink, pathContainingLink) {
        return this.getFirstLinkpathDestFn(rawLink, pathContainingLink) ?? undefined;
    }
    /**
     * Provides access to the single global instance of the LinkResolver.
     * This should be used in the plugin code.
     */
    static getInstance() {
        if (!LinkResolver.instance) {
            LinkResolver.instance = new LinkResolver();
        }
        return LinkResolver.instance;
    }
}
exports.LinkResolver = LinkResolver;
//# sourceMappingURL=LinkResolver.js.map