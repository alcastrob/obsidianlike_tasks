"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Retrieve the list of released dependencies specified in the project's package.json file.
 *
 * @return {string[]} An array of dependency names defined in the "dependencies" section of the package.json file.
 */
function getReleasedDependencies() {
    const packageJsonPath = path_1.default.resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf8'));
    return Object.keys(packageJson.dependencies);
}
/**
 * Retrieve the copyright banner defined in the esbuild configuration file for the Tasks plugin.
 *
 * The method reads the esbuild configuration file, extracts the banner content using a regular expression,
 * and returns it as a string. Throws an error if the banner is not found.
 *
 * @return {string} The copyright banner extracted from the esbuild configuration file.
 */
function getTasksPluginCopyrightBanner() {
    const packageEsbuildConfigPath = path_1.default.resolve(__dirname, '../../esbuild.config.mjs');
    const packageEsbuildConfig = fs_1.default.readFileSync(packageEsbuildConfigPath, 'utf8');
    // Regular expression to extract the banner content
    const bannerRegex = /const\s+banner\s*=\s*`([\s\S]*?)`;/;
    const match = packageEsbuildConfig.match(bannerRegex);
    if (!match) {
        throw new Error('No banner found in esbuild.config.mjs');
    }
    return match[1];
}
describe('Check esbuild.config.mjs', () => {
    const bannerContent = getTasksPluginCopyrightBanner();
    it('check licensing', () => {
        expect(bannerContent).toContain('License obsidian-tasks:\nMIT License');
        expect(bannerContent).toContain('Clare Macrae, Ilyas Landikov and Martin Schenck');
    });
    // Check that every released dependency will its licence included in main.js
    it.each(getReleasedDependencies())('check dependency is in banner: "%s"', (filter) => {
        // For files that we embed in main.js, we need to honour the project license,
        // which we do by pasting it in to esbuild.config.mjs.
        const expectedLine = `License ${filter} (included library):`;
        expect(bannerContent).toContain(expectedLine);
        // If this fails, you need to go to:
        // 1. Go to https://classic.yarnpkg.com/lang/en/
        // 2. Search for the failed package name.
        // 3. Navigate to its GitHub repo.
        // 4. View its LICENSE file.
        // 5. Copy the contents of the LICENSE file.
        // 6. Create a new comment block inside the banner variable in esbuild.config.mjs
        // 7. Paste in a new block, including the library name and - if it's not a standard license - the full license text.
    });
});
//# sourceMappingURL=ESBuildConfig.test.js.map