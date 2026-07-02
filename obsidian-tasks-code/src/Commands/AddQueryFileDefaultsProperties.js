"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureQueryFileDefaultsInFrontmatter = ensureQueryFileDefaultsInFrontmatter;
const obsidian_1 = require("obsidian");
const QueryFileDefaults_1 = require("../Query/QueryFileDefaults");
async function ensureQueryFileDefaultsInFrontmatter(app, file) {
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
        const requiredKeys = new QueryFileDefaults_1.QueryFileDefaults().allPropertyNamesSorted();
        let updated = false;
        requiredKeys.forEach((key) => {
            if (!(key in frontmatter)) {
                frontmatter[key] = null;
                updated = true;
            }
        });
        if (!updated) {
            new obsidian_1.Notice('All supported properties are already present.');
        }
        else {
            new obsidian_1.Notice('Properties updated successfully.');
        }
    });
}
//# sourceMappingURL=AddQueryFileDefaultsProperties.js.map