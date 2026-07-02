"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksFile = void 0;
const obsidian_1 = require("obsidian");
const Link_1 = require("../Task/Link");
/**
 * A simple class to provide access to file information via 'task.file' in scripting code.
 */
class TasksFile {
    constructor(path, cachedMetadata = {}, tFile) {
        // Always make TasksFile.frontmatter.tags exist and be empty, even if no frontmatter present:
        this._frontmatter = { tags: [] };
        this._tags = [];
        this._outlinksInProperties = [];
        this._outlinksInBody = [];
        this._path = path;
        this.tFile = tFile;
        this._cachedMetadata = cachedMetadata;
        const rawFrontmatter = cachedMetadata.frontmatter;
        if (rawFrontmatter !== undefined) {
            this._frontmatter = JSON.parse(JSON.stringify(rawFrontmatter));
            this._frontmatter.tags = (0, obsidian_1.parseFrontMatterTags)(rawFrontmatter) ?? [];
        }
        this._outlinksInProperties = this.createLinks(this.cachedMetadata.frontmatterLinks);
        this._outlinksInBody = this.createLinks(this.cachedMetadata.links);
        if (Object.keys(cachedMetadata).length !== 0) {
            const tags = (0, obsidian_1.getAllTags)(this.cachedMetadata) ?? [];
            this._tags = [...new Set(tags)];
        }
    }
    createLinks(obsidianRawLinks) {
        return obsidianRawLinks?.map((link) => new Link_1.Link(link, this.path)) ?? [];
    }
    /**
     * Return the path to the file.
     */
    get path() {
        return this._path;
    }
    /**
     * Return all the tags in the file, both from frontmatter and the body of the file.
     *
     * - It adds the `#` prefix to tags in the frontmatter.
     * - It removes any duplicate tag values.
     * - For now, it includes any global filter that is a tag, if there are any tasks in the file
     *   that have the global filter. This decision will be reviewed later.
     *
     * @todo Review presence of global filter tag in the results.
     */
    get tags() {
        return this._tags;
    }
    /**
     * Return an array of {@link Link} all the links in the file - both in frontmatter and in the file body.
     */
    get outlinks() {
        return [...this.outlinksInProperties, ...this.outlinksInBody];
    }
    /**
     * Return an array of {@link Link} in the file's properties/frontmatter.
     */
    get outlinksInProperties() {
        return this._outlinksInProperties;
    }
    /**
     * Return an array of {@link Link} in the body of the file.
     */
    get outlinksInBody() {
        return this._outlinksInBody;
    }
    /**
     * Return Obsidian's [CachedMetadata](https://docs.obsidian.md/Reference/TypeScript+API/CachedMetadata)
     * for this file, if available.
     *
     * Any raw frontmatter may be accessed via `cachedMetadata.frontmatter`.
     * See [FrontMatterCache](https://docs.obsidian.md/Reference/TypeScript+API/FrontMatterCache).
     * But prefer using {@link frontmatter} where possible.
     *
     * @note This is currently only populated for Task objects when read in the Obsidian plugin,
     *       and queries in the plugin.
     *       It's not populated in most unit tests.
     *       If not available, it returns an empty object, {}.
     *
     * @see frontmatter, which provides a cleaned-up version of the raw frontmatter.
     */
    get cachedMetadata() {
        return this._cachedMetadata;
    }
    /**
     * Returns a cleaned-up version of the frontmatter.
     *
     * If accessing tags, please note:
     * - If there are any tags in the frontmatter, `frontmatter.tags` will have the values with '#' prefix added.
     * - It recognises both `frontmatter.tags` and `frontmatter.tag` (and various capitalisation combinations too).
     * - It removes any null tags.
     *
     * @note This is currently only populated for Task objects when read in the Obsidian plugin.
     *       It's not populated for queries in the plugin, nor in most unit tests.
     *       And it is an empty object, {}, if the {@link cachedMetadata} has not been populated
     *       or if the markdown file has no frontmatter or empty frontmatter.
     */
    get frontmatter() {
        return this._frontmatter;
    }
    /**
     * Does the data content of another TasksFile's raw frontmatter
     * match this one.
     *
     * This can be used to detect whether Task objects need to be updated,
     * or (later) whether queries need to be updated, due to user edits.
     *
     * @param other
     */
    rawFrontmatterIdenticalTo(other) {
        const thisFrontmatter = this.cachedMetadata.frontmatter;
        const thatFrontmatter = other.cachedMetadata.frontmatter;
        if (thisFrontmatter === thatFrontmatter) {
            // The same object or both undefined
            return true;
        }
        if (!thisFrontmatter || !thatFrontmatter) {
            return false; // One is undefined and the other is not
        }
        // Check if the same content.
        // This is fairly simplistic.
        // For example, it treats values that are the same but in a different order as being different,
        // although their information content is the same.
        return JSON.stringify(thisFrontmatter) === JSON.stringify(thatFrontmatter);
    }
    /**
     * Return the path to the file, with the filename extension removed.
     */
    get pathWithoutExtension() {
        return this.withoutExtension(this.path);
    }
    withoutExtension(value) {
        return value.replace(/\.md$/, '');
    }
    /**
     * Return the root to the file.
     */
    get root() {
        let path = this.path.replace(/\\/g, '/');
        if (path.charAt(0) === '/') {
            path = path.substring(1);
        }
        const separatorIndex = path.indexOf('/');
        if (separatorIndex == -1) {
            return '/';
        }
        return path.substring(0, separatorIndex + 1);
    }
    get folder() {
        const path = this.path;
        const fileNameWithExtension = this.filename;
        const folder = path.substring(0, path.lastIndexOf(fileNameWithExtension));
        if (folder === '') {
            return '/';
        }
        return folder;
    }
    /**
     * Return the filename including the extension.
     */
    get filename() {
        // Copied from Task.filename and FilenameField.value() initially
        const fileNameMatch = this.path.match(/([^/]+)$/);
        if (fileNameMatch !== null) {
            return fileNameMatch[1];
        }
        else {
            return '';
        }
    }
    get filenameWithoutExtension() {
        return this.withoutExtension(this.filename);
    }
    /**
     * This is documented for users and so must not be changed.
     * https://publish.obsidian.md/tasks/Getting+Started/Obsidian+Properties#How+does+Tasks+treat+Obsidian+Properties%3F
     * @param key
     */
    hasProperty(key) {
        const foundKey = this.findKeyInFrontmatter(key);
        if (foundKey === undefined) {
            return false;
        }
        const propertyValue = this.frontmatter[foundKey];
        if (propertyValue === null) {
            return false;
        }
        if (propertyValue === undefined) {
            return false;
        }
        return true;
    }
    /**
     * This is documented for users and so must not be changed.
     * https://publish.obsidian.md/tasks/Getting+Started/Obsidian+Properties#How+does+Tasks+treat+Obsidian+Properties%3F
     * @param key
     */
    property(key) {
        const foundKey = this.findKeyInFrontmatter(key);
        if (foundKey === undefined) {
            return null;
        }
        const propertyValue = this.frontmatter[foundKey];
        if (propertyValue === undefined) {
            return null;
        }
        if (Array.isArray(propertyValue)) {
            return propertyValue.filter((item) => item !== null);
        }
        return propertyValue;
    }
    findKeyInFrontmatter(key) {
        const lowerCaseKey = key.toLowerCase();
        return Object.keys(this.frontmatter).find((searchKey) => {
            const lowerCaseSearchKey = searchKey.toLowerCase();
            return lowerCaseSearchKey === lowerCaseKey;
        });
    }
    /**
     * Compare all the fields in another TasksFile, to detect any differences from this one.
     *
     * If any field is different in any way, it will return false.
     *
     * @param other
     */
    identicalTo(other) {
        if (this.path !== other.path) {
            return false;
        }
        return this.rawFrontmatterIdenticalTo(other);
    }
}
exports.TasksFile = TasksFile;
//# sourceMappingURL=TasksFile.js.map